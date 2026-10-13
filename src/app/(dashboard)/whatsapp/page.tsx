"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  QrCode,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  defaultGroupId?: string | null;
  defaultGroupName?: string | null;
}

export default function WhatsAppPage() {
  const { t } = useI18n();
  const [waStatus, setWaStatus] = useState<WAStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

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
    const intervalTime = waStatus?.connected ? 15000 : 3000;
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [fetchStatus, waStatus?.connected]);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/whatsapp/qr", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.data);
      } else {
        toast.error(data.error || t("wa.toast.qrError"));
      }
    } catch {
      toast.error(t("wa.toast.qrRequestError"));
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
        toast.success(t("wa.toast.disconnected"));
        fetchStatus();
      }
    } catch {
      toast.error(t("wa.toast.disconnectError"));
    } finally {
      setIsDisconnecting(false);
      setDisconnectOpen(false);
    }
  };

  const handleDefaultGroupChange = async (groupId: string) => {
    if (!groupId) return;
    setIsSavingGroup(true);
    try {
      const res = await fetch("/api/whatsapp/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setWaStatus((current) => current ? {
        ...current,
        defaultGroupId: data.data.defaultGroupId,
        defaultGroupName: data.data.defaultGroupName,
      } : current);
      toast.success(t("wa.defaultGroupSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("wa.defaultGroupSaveError"));
    } finally {
      setIsSavingGroup(false);
    }
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
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t("wa.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("wa.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("px-3 py-1 font-medium transition-colors", 
              connectionStatus === "connected" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
              connectionStatus === "connecting" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
              "bg-slate-500/10 text-slate-500 border-slate-500/20"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", 
              connectionStatus === "connected" ? "bg-emerald-500" :
              connectionStatus === "connecting" ? "bg-amber-500 animate-pulse" :
              "bg-slate-500"
            )} />
            {connectionStatus === "connected" ? t("wa.status.active") : 
             connectionStatus === "connecting" ? t("wa.status.syncing") : t("wa.status.none")}
          </Badge>
        </div>
      </div>

      {/* SESSION CARD */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 min-h-[300px]">
            <div className="p-6 lg:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border bg-muted/20">
               {connectionStatus === "connected" && waStatus?.user ? (
                 <div className="space-y-6">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                      <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("wa.deviceLinked")}</h2>
                      <p className="text-2xl font-bold text-foreground">{waStatus.user.name}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-foreground/80 bg-background/50 w-fit px-3 py-1.5 rounded-lg border shadow-sm">
                         <Smartphone className="h-4 w-4" />
                         <span className="font-mono font-medium tracking-tight">{waStatus.user.id.split(':')[0]}</span>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-muted border border-border shadow-sm">
                      <WifiOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{t("wa.authRequired")}</h2>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[90%]">
                        {t("wa.authDesc")}
                      </p>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-6 lg:p-8 flex items-center justify-center relative bg-background">
               <AnimatePresence mode="wait">
                  {connectionStatus === "connected" ? (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex flex-col items-center justify-center text-center space-y-6"
                     >
                        <div className="rounded-full bg-emerald-500/10 p-6 flex items-center justify-center border-4 border-emerald-500/20 shadow-sm">
                           <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">{t("wa.fullyIntegrated")}</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">{t("wa.sessionActiveDesc")}</p>
                        </div>
                        <Button 
                           variant="outline" 
                           onClick={() => setDisconnectOpen(true)} 
                           disabled={isDisconnecting}
                           className="mt-6 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors shadow-sm font-medium px-6"
                        >
                           {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
                           {t("wa.disconnectBtn")}
                        </Button>
                     </motion.div>
                  ) : (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full flex flex-col items-center"
                     >
                        {waStatus?.qr ? (
                          <div className="space-y-6 flex flex-col items-center">
                             <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200 transition-all hover:scale-[1.02] duration-300">
                               <img src={waStatus.qr} alt={t("wa.scanQrAlt")} className="h-[220px] w-[220px] sm:h-[260px] sm:w-[260px] select-none" draggable={false} />
                             </div>
                             
                             <div className="bg-muted/40 w-[90%] sm:w-[280px] p-3 rounded-xl border border-border border-dashed text-center">
                               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium leading-relaxed">
                                 {t("wa.qrHint1")} &rarr; <br/> {t("wa.qrHint2")} &rarr; {t("wa.qrHint3")}
                               </p>
                             </div>

                             <Button size="sm" onClick={handleGenerateQR} disabled={isGenerating} variant="secondary" className="shadow-sm bg-background border font-medium px-4">
                               {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />} {t("wa.refreshQr")}
                             </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-6 w-full flex flex-col items-center">
                             <div className="h-32 w-32 rounded-3xl flex items-center justify-center border-[3px] border-dashed border-border bg-muted/30">
                               <QrCode className="h-10 w-10 text-muted-foreground/40" />
                             </div>
                             <div className="space-y-1">
                               <h3 className="text-sm font-bold">{t("wa.qrEmpty")}</h3>
                               <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
                                 {t("wa.qrEmptyDesc")}
                               </p>
                             </div>
                             <Button 
                              onClick={handleGenerateQR} 
                              disabled={isGenerating || connectionStatus === "connecting"}
                              className="w-[200px] gap-2 shadow-sm font-semibold"
                             >
                               {isGenerating || connectionStatus === "connecting" ? (
                                 <><Loader2 className="h-4 w-4 animate-spin" /> {t("wa.accessing")}</>
                               ) : (
                                 <><QrCode className="h-4 w-4" /> {t("wa.generateQr")}</>
                               )}
                             </Button>
                          </div>
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {connectionStatus === "connected" && (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t("wa.defaultGroupTitle")}</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  {t("wa.defaultGroupDesc")}
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-[320px]">
              <select
                value={waStatus?.defaultGroupId || ""}
                onChange={(event) => handleDefaultGroupChange(event.target.value)}
                disabled={isSavingGroup || !waStatus?.groups.length}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {waStatus?.groups.length ? t("wa.defaultGroupPlaceholder") : t("wa.defaultGroupEmpty")}
                </option>
                {waStatus?.groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.subject} ({group.size})
                  </option>
                ))}
              </select>
              {isSavingGroup && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Putuskan WhatsApp?"
        description="Sesi WhatsApp akan diputus dan kamu perlu scan QR ulang untuk menghubungkan kembali."
        confirmLabel="Putuskan"
        loading={isDisconnecting}
        onConfirm={handleDisconnect}
      />
    </motion.div>
  );
}
