"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  Loader2,
  CheckCircle2,
  Radio,
} from "lucide-react";

interface WAGroup {
  id: string;
  subject: string;
  size: number;
}

interface WAStatusData {
  connected: boolean;
  connecting: boolean;
  qr: string | null;
  user: { id: string; name: string } | null;
  groups: WAGroup[];
}

export default function WhatsAppPage() {
  const [waStatus, setWaStatus] = useState<WAStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) setWaStatus(data.data);
    } catch {
      console.error("Failed to fetch WA status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/whatsapp/qr", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.data);
        toast.success("QR Code generated! Silakan scan.");
      } else {
        toast.error(data.error || "Gagal generate QR");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("WhatsApp berhasil diputus");
        fetchStatus();
      }
    } catch {
      toast.error("Gagal memutus koneksi");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const connectionStatus = waStatus?.connected
    ? "connected"
    : waStatus?.connecting
    ? "connecting"
    : "disconnected";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Integration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola koneksi WhatsApp untuk broadcast dan reminder
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Status Koneksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <Badge variant="success">Connected</Badge>
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                  <Badge variant="warning">Connecting...</Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">Disconnected</Badge>
                </>
              )}
            </div>

            {waStatus?.user && (
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-sm font-medium text-green-400">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Login sebagai: {waStatus.user.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">ID: {waStatus.user.id}</p>
              </div>
            )}

            <div className="flex gap-2">
              {connectionStatus !== "connected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQR}
                  disabled={isGenerating || connectionStatus === "connecting"}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {connectionStatus === "connecting" ? "Menghubungkan..." : "Connect"}
                </Button>
              )}
              {connectionStatus === "connected" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-5 w-5 text-primary" />
              QR Login
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {waStatus?.qr ? (
              <>
                <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                  <img
                    src={waStatus.qr}
                    alt="WhatsApp QR Code"
                    className="h-56 w-56"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Buka WhatsApp &gt; Menu &gt; Linked Devices &gt; Scan QR
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh QR
                </Button>
              </>
            ) : connectionStatus === "connected" ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-green-400">WhatsApp Terhubung</p>
                <p className="text-xs text-muted-foreground mt-1">Tidak perlu scan QR lagi</p>
              </div>
            ) : (
              <>
                <div className="h-48 w-48 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Generate QR Code
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Klik untuk membuat QR code baru
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-400" />
              Grup WhatsApp ({waStatus?.groups?.length || 0})
            </span>
            {selectedGroups.length > 0 && (
              <Badge variant="default" className="text-xs">
                {selectedGroups.length} dipilih
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus !== "connected" ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hubungkan WhatsApp terlebih dahulu untuk melihat daftar grup
            </p>
          ) : waStatus?.groups && waStatus.groups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-2">
              {waStatus.groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedGroups.includes(group.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedGroups.includes(group.id)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedGroups.includes(group.id) && (
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.size} anggota
                    </p>
                  </div>
                  <Radio className="h-4 w-4 text-muted-foreground/30" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada grup ditemukan
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
