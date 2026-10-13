import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState as createMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import type { WASocket, GroupMetadata } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import {
  WA_BROADCAST_CONSECUTIVE_FAILURE_LIMIT,
  WA_BROADCAST_FAILURE_RATE_LIMIT,
  WA_BROADCAST_FAILURE_RATE_MIN_ATTEMPTS,
  WA_BROADCAST_SEND_DELAY_MS,
  type WhatsAppBroadcastResult,
  type WhatsAppBroadcastStopReason,
} from "@/lib/whatsapp/safety";

const logger = pino({ level: "silent" });

// ── Registry config ──────────────────────────────────────
const MAX_CONCURRENT_CONNECTIONS = 50;
const EVICT_AFTER_MS = 30 * 60 * 1000; // 30 minutes after disconnect

export interface WAStatus {
  connected: boolean;
  connecting: boolean;
  qr: string | null;
  user: { id: string; name: string } | null;
  groups: { id: string; subject: string; size: number }[];
}

class WhatsAppService {
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private status: "disconnected" | "connecting" | "connected" = "disconnected";
  private user: { id: string; name: string } | null = null;
  private groups: { id: string; subject: string; size: number }[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private authDir: string;
  private userId: string;

  // ── Fix #1: Mutex for connect() ──
  private connectLock: Promise<void> | null = null;

  // ── Fix #4: Broadcast cancellation flag ──
  private broadcastAborted = false;

  // ── Fix #2: Track last disconnect time for eviction ──
  lastActivityAt: number = Date.now();

  constructor(userId: string) {
    this.userId = userId;
    this.authDir = path.join(process.cwd(), ".whatsapp-auth", userId);
  }

  getStatus(): WAStatus {
    return {
      connected: this.status === "connected",
      connecting: this.status === "connecting",
      qr: this.qrCode,
      user: this.user,
      groups: this.groups,
    };
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: unknown[]) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(...args));
  }

  // ── Fix #5: await persistStatus (no more fire-and-forget) ──
  private async persistStatus(status: "disconnected" | "connecting" | "connected") {
    try {
      if (!this.userId) return;
      await prisma.whatsAppSession.upsert({
        where: { userId: this.userId },
        create: { userId: this.userId, status, updatedAt: new Date() },
        update: { status, updatedAt: new Date() },
      });
    } catch (error) {
      console.error("[WA] Failed to persist status:", error);
    }
  }

  // ── Fix #1: Mutex-guarded connect ──
  async connect(): Promise<void> {
    // If already connected or connecting, skip
    if (this.status === "connected" || this.status === "connecting") {
      return;
    }

    // If another connect() is in-flight, wait for it instead of racing
    if (this.connectLock) {
      await this.connectLock;
      return;
    }

    this.connectLock = this._doConnect();
    try {
      await this.connectLock;
    } finally {
      this.connectLock = null;
    }
  }

  private async _doConnect(): Promise<void> {
    this.status = "connecting";
    this.lastActivityAt = Date.now();
    this.emit("status", this.status);
    await this.persistStatus("connecting");

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await createMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ["Ruang Ketua", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
      });

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = await QRCode.toDataURL(qr);
          this.emit("qr", this.qrCode);
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.status = "disconnected";
          this.user = null;
          this.qrCode = null;
          this.lastActivityAt = Date.now();

          // ── Fix #4: Abort any running broadcast ──
          this.broadcastAborted = true;

          this.emit("status", this.status);
          await this.persistStatus("disconnected");

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[WA] Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), 3000 * this.reconnectAttempts);
          } else if (!shouldReconnect) {
            console.log("[WA] Logged out, clearing session");
            this.clearSession();
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.reconnectAttempts = 0;
          this.lastActivityAt = Date.now();

          const me = this.sock?.user;
          if (me) {
            this.user = {
              id: me.id,
              name: me.name || me.id.split("@")[0],
            };
          }

          this.emit("status", this.status);
          console.log("[WA] Connected as", this.user?.name);

          await this.persistStatus("connected");
          await this.fetchGroups();
        }
      });

      this.sock.ev.on("creds.update", saveCreds);
    } catch (error) {
      console.error("[WA] Connection error:", error);
      this.status = "disconnected";
      this.emit("status", this.status);
    }
  }

  async disconnect(): Promise<void> {
    // ── Fix #4: Abort broadcast on disconnect ──
    this.broadcastAborted = true;

    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.status = "disconnected";
    this.user = null;
    this.qrCode = null;
    this.groups = [];
    this.lastActivityAt = Date.now();
    this.clearSession();
    this.emit("status", this.status);
    await this.persistStatus("disconnected");
  }

  private clearSession(): void {
    if (fs.existsSync(this.authDir)) {
      fs.rmSync(this.authDir, { recursive: true, force: true });
    }
  }

  async fetchGroups(): Promise<void> {
    if (!this.sock || this.status !== "connected") return;

    try {
      const groups = await this.sock.groupFetchAllParticipating();
      this.groups = Object.values(groups).map((g: GroupMetadata) => ({
        id: g.id,
        subject: g.subject,
        size: g.participants.length,
      }));
      this.emit("groups", this.groups);
    } catch (error) {
      console.error("[WA] Error fetching groups:", error);
    }
  }

  async sendMessage(jid: string, text: string): Promise<boolean> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp tidak terhubung");
    }

    this.lastActivityAt = Date.now();

    try {
      await this.sock.sendMessage(jid, { text });
      return true;
    } catch (error) {
      console.error("[WA] Send message error:", error);
      throw error;
    }
  }

  async broadcastToGroup(groupId: string, message: string): Promise<boolean> {
    return this.sendMessage(groupId, message);
  }

  // ── Fix #4: Broadcast with cancellation support ──
  async broadcastToMultipleGroups(groupIds: string[], message: string): Promise<WhatsAppBroadcastResult> {
    const success: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];
    let consecutiveFailures = 0;
    let stoppedReason: WhatsAppBroadcastStopReason | null = null;

    // Reset abort flag at start
    this.broadcastAborted = false;

    for (let index = 0; index < groupIds.length; index++) {
      // ── Check abort flag (set by disconnect/logout) ──
      if (this.broadcastAborted) {
        stoppedReason = "connection_lost";
        skipped.push(...groupIds.slice(index));
        break;
      }

      const groupId = groupIds[index];

      try {
        await this.sendMessage(groupId, message);
        success.push(groupId);
        consecutiveFailures = 0;
      } catch {
        failed.push(groupId);
        consecutiveFailures++;
      }

      const attempted = success.length + failed.length;
      const failureRate = attempted > 0 ? failed.length / attempted : 0;

      if (consecutiveFailures >= WA_BROADCAST_CONSECUTIVE_FAILURE_LIMIT) {
        stoppedReason = "consecutive_failures";
      } else if (
        attempted >= WA_BROADCAST_FAILURE_RATE_MIN_ATTEMPTS &&
        failureRate >= WA_BROADCAST_FAILURE_RATE_LIMIT
      ) {
        stoppedReason = "high_failure_rate";
      }

      if (stoppedReason) {
        const remainingGroupIds = groupIds.slice(index + 1);
        if (remainingGroupIds.length === 0) {
          stoppedReason = null;
        } else {
          skipped.push(...remainingGroupIds);
        }
        break;
      }

      if (index < groupIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, WA_BROADCAST_SEND_DELAY_MS));
      }
    }

    return {
      success,
      failed,
      skipped,
      attempted: success.length + failed.length,
      stopped: skipped.length > 0,
      stoppedReason,
    };
  }

  async sendPersonalMessage(phoneNumber: string, message: string): Promise<boolean> {
    const jid = phoneNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    return this.sendMessage(jid, message);
  }

  // ── Fix #1: ensureConnected uses mutex-guarded connect() ──
  async ensureConnected(timeoutMs = 10000): Promise<boolean> {
    if (this.isConnected()) return true;

    const credentialsPath = path.join(this.authDir, "creds.json");
    if (!fs.existsSync(credentialsPath)) return false;

    try {
      await this.connect(); // mutex-guarded, safe for concurrent calls
    } catch {
      return false;
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.isConnected()) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return this.isConnected();
  }

  isConnected(): boolean {
    return this.status === "connected";
  }

  // ── Fix #2: Check if instance can be evicted ──
  isEvictable(): boolean {
    return (
      this.status === "disconnected" &&
      !this.connectLock &&
      Date.now() - this.lastActivityAt > EVICT_AFTER_MS
    );
  }

  // ── Cleanup socket resources without full logout ──
  destroy(): void {
    this.broadcastAborted = true;
    if (this.sock) {
      try { this.sock.end(undefined); } catch { /* ignore */ }
      this.sock = null;
    }
    this.status = "disconnected";
    this.user = null;
    this.qrCode = null;
    this.groups = [];
    this.listeners.clear();
  }
}

// ── Per-user WhatsApp service registry ──────────────────
const globalForWA = globalThis as unknown as {
  waRegistry: Map<string, WhatsAppService> | undefined;
};

if (!globalForWA.waRegistry) {
  globalForWA.waRegistry = new Map();
}

const registry = globalForWA.waRegistry!;

// ── Fix #2: Periodic eviction of stale disconnected sessions ──
function evictStale() {
  for (const [userId, service] of registry) {
    if (service.isEvictable()) {
      console.log(`[WA] Evicting stale session for user ${userId}`);
      service.destroy();
      registry.delete(userId);
    }
  }
}

// Run eviction every 5 minutes
if (typeof globalForWA.waRegistry !== "undefined") {
  const globalEvict = globalThis as unknown as { _waEvictTimer?: ReturnType<typeof setInterval> };
  if (!globalEvict._waEvictTimer) {
    globalEvict._waEvictTimer = setInterval(evictStale, 5 * 60 * 1000);
  }
}

// ── Fix #3: Connection limit cap ──
function countActiveConnections(): number {
  let count = 0;
  for (const service of registry.values()) {
    const s = service.getStatus();
    if (s.connected || s.connecting) count++;
  }
  return count;
}

export function getWhatsAppService(userId: string): WhatsAppService {
  if (!registry.has(userId)) {
    // ── Fix #3: Reject if too many active connections ──
    if (countActiveConnections() >= MAX_CONCURRENT_CONNECTIONS) {
      // Try evicting stale sessions first
      evictStale();
      if (countActiveConnections() >= MAX_CONCURRENT_CONNECTIONS) {
        throw new Error("Terlalu banyak sesi WhatsApp aktif. Coba lagi nanti.");
      }
    }
    registry.set(userId, new WhatsAppService(userId));
  }
  return registry.get(userId)!;
}

export default getWhatsAppService;
