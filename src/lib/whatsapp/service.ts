import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import type { WASocket, GroupMetadata } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

const logger = pino({ level: "silent" });

const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");

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

  async connect(): Promise<void> {
    if (this.status === "connected" || this.status === "connecting") {
      return;
    }

    this.status = "connecting";
    this.emit("status", this.status);

    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ["Ruang Ketua", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
      });

      // Handle connection updates
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
          this.emit("status", this.status);

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

          const me = this.sock?.user;
          if (me) {
            this.user = {
              id: me.id,
              name: me.name || me.id.split("@")[0],
            };
          }

          this.emit("status", this.status);
          console.log("[WA] Connected as", this.user?.name);

          // Fetch groups
          await this.fetchGroups();
        }
      });

      // Save credentials
      this.sock.ev.on("creds.update", saveCreds);
    } catch (error) {
      console.error("[WA] Connection error:", error);
      this.status = "disconnected";
      this.emit("status", this.status);
    }
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.status = "disconnected";
    this.user = null;
    this.qrCode = null;
    this.groups = [];
    this.clearSession();
    this.emit("status", this.status);
  }

  private clearSession(): void {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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

  async broadcastToMultipleGroups(groupIds: string[], message: string): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const groupId of groupIds) {
      try {
        await this.sendMessage(groupId, message);
        success.push(groupId);
        // Small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch {
        failed.push(groupId);
      }
    }

    return { success, failed };
  }

  async sendPersonalMessage(phoneNumber: string, message: string): Promise<boolean> {
    const jid = phoneNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    return this.sendMessage(jid, message);
  }

  isConnected(): boolean {
    return this.status === "connected";
  }
}

// Singleton
const globalForWA = globalThis as unknown as {
  whatsappService: WhatsAppService | undefined;
};

export const whatsappService = globalForWA.whatsappService ?? new WhatsAppService();

if (process.env.NODE_ENV !== "production") {
  globalForWA.whatsappService = whatsappService;
}

export default whatsappService;
