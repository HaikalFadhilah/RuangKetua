"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HardDrive,
  Cloud,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Plus,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { ALLOCATION_STRATEGIES } from "@/lib/cloud/allocation-config";
import { container, item } from "@/lib/animations";

interface DriveAccount {
  id: string;
  email: string | null;
  provider: string;
  quotaTotal: string | null;
  quotaUsed: string | null;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

type Tab = "overview" | "allocation";

const ACCOUNT_PALETTE = [
  { used: "bg-primary", free: "bg-primary/20", surface: "bg-primary/10", text: "text-primary" },
  { used: "bg-emerald-600", free: "bg-emerald-500/20", surface: "bg-emerald-500/10", text: "text-emerald-600" },
  { used: "bg-amber-500", free: "bg-amber-500/20", surface: "bg-amber-500/10", text: "text-amber-600" },
  { used: "bg-pink-500", free: "bg-pink-500/20", surface: "bg-pink-500/10", text: "text-pink-600" },
];

export default function DrivePage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [strategy, setStrategy] = useState<string>("round_robin");
  const [allocOrder, setAllocOrder] = useState<string[]>([]);
  const [savingAlloc, setSavingAlloc] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // â”€â”€ OAuth return handler â”€â”€
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const reason = params.get("reason");
    if (status === "connected") {
      toast.success(t("drive.connectSuccess"));
      window.history.replaceState({}, "", "/drive");
      fetchAccounts();
    } else if (status === "error") {
      const r = reason || "unknown";
      let msg = r;
      if (/drive\.googleapis\.com|Drive API has not been used|disabled/i.test(r)) msg = t("drive.errApiDisabled");
      else if (/access.?blocked|scope/i.test(r)) msg = t("drive.errScope");
      else if (/invalid_grant|invalid_client/i.test(r)) msg = t("drive.errCredentials");
      else if (/redirect_uri/i.test(r)) msg = t("drive.errRedirect");
      toast.error(t("drive.connectErrorPrefix", { msg }));
      window.history.replaceState({}, "", "/drive");
    }

  }, []);

  const fetchAllocation = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (data.success) {
        setStrategy(data.data.allocationStrategy || "round_robin");
        setAllocOrder(data.data.allocationOrder || []);
      }
    } catch {
      /* ignore */
    }

  }, []);

  const fetchAccounts = useCallback(async (sync = false) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/drive/accounts${sync ? "?sync=true" : ""}`);
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch {
      toast.error(t("drive.loadAccountsFailed"));
    } finally {
      setAccountsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAccounts();
    fetchAllocation();
  }, [fetchAccounts, fetchAllocation]);

  const doSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/drive/sync", { method: "POST" });
      await fetchAccounts();
      toast.success(t("drive.syncDone"));
    } catch {
      toast.error(t("drive.syncFailed"));
    } finally {
      setSyncing(false);
    }

  }, [t]);

  const enrichedAccounts = accounts.map((a, i) => {
    const total = Number(a.quotaTotal || 0);
    const used = Number(a.quotaUsed || 0);
    const free = Math.max(0, total - used);
    const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    return { ...a, total, used, free, pct, palette: ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] };
  });

  const totalSpace = enrichedAccounts.reduce((s, a) => s + a.total, 0);
  const totalUsed = enrichedAccounts.reduce((s, a) => s + a.used, 0);
  const totalFree = Math.max(0, totalSpace - totalUsed);

  const segments = enrichedAccounts
    .flatMap((a) => [
      { key: `${a.id}-used`, width: totalSpace ? (a.used / totalSpace) * 100 : 0, cls: a.palette.used },
      { key: `${a.id}-free`, width: totalSpace ? (a.free / totalSpace) * 100 : 0, cls: a.palette.free },
    ])
    .filter((s) => s.width > 0);

  const customOrderedAccounts = (() => {
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const ordered: DriveAccount[] = [];
    allocOrder.forEach((id) => {
      if (byId.has(id)) {
        ordered.push(byId.get(id)!);
        byId.delete(id);
      }
    });
    accounts.forEach((a) => {
      if (byId.has(a.id)) ordered.push(a);
    });
    return ordered;
  })();

  const handleConnect = () => {
    window.location.href = "/api/drive/connect";
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/drive/accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("drive.disconnected"));
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("drive.disconnectFailed"));
    }
  };

  const updateStrategy = async (s: string) => {
    setStrategy(s);
    setSavingAlloc(true);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationStrategy: s }),
      });
    } catch {
      /* ignore */
    } finally {
      setSavingAlloc(false);
    }
  };

  const moveOrder = async (index: number, dir: -1 | 1) => {
    const arr = customOrderedAccounts.map((a) => a.id);
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setAllocOrder(arr);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationOrder: arr }),
      });
    } catch {
      /* ignore */
    }
  };

  const onDropOrder = async (from: number, to: number) => {
    const arr = customOrderedAccounts.map((a) => a.id);
    if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setAllocOrder(arr);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationOrder: arr }),
      });
    } catch {
      /* ignore */
    }
  };



  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("drive.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("drive.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={doSync} disabled={syncing} title={t("drive.sync")}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={handleConnect} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("drive.connectAccount")}
          </Button>
        </div>
      </motion.div>

      {/* Tab strip */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview">{t("drive.overview")}</TabsTrigger>
          <TabsTrigger value="allocation">{t("drive.allocation")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {accountsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Cloud className="h-14 w-14 text-muted-foreground/30 mb-3" />
            <p className="text-base font-medium">{t("drive.noAccounts")}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t("drive.noAccountsDesc")}</p>
            <Button onClick={handleConnect} className="mt-4 gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> {t("drive.connectDrive")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card className="rounded-[24px] shadow-[0_18px_44px_rgba(32,33,36,0.10)]">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Cloud className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t("drive.totalStorage")}</p>
                        <strong className="mt-1 block text-3xl font-bold tracking-tight">
                          {formatFileSize(totalUsed)} <span className="text-base font-medium text-muted-foreground">/ {formatFileSize(totalSpace)}</span>
                        </strong>
                      </div>
                    </div>
                    <div className="min-w-[260px] rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{t("drive.used")}</span>
                        <strong>{formatFileSize(totalUsed)}</strong>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{t("drive.available")}</span>
                        <strong>{formatFileSize(totalFree)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-muted flex">
                    {segments.map((s) => (
                      <div key={s.key} className={`h-full ${s.cls}`} style={{ width: `${s.width}%` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {enrichedAccounts.map((acc) => (
                  <div key={acc.id} className="group flex min-w-0 flex-col rounded-[24px] border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                          <HardDrive className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{acc.email || "Google Drive"}</p>
                          <p className="text-xs font-medium text-muted-foreground">Google Drive</p>
                        </div>
                      </div>
                      <span
                        onClick={() => handleDisconnect(acc.id)}
                        className="text-muted-foreground hover:text-red-500 cursor-pointer shrink-0"
                        title={t("drive.disconnectAccount")}
                      >
                        <X className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-[10px] font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`size-2.5 rounded-full ${acc.palette.used}`} />
                        <span className="text-muted-foreground">{t("drive.used")}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`size-2.5 rounded-full ${acc.palette.free}`} />
                        <span className="text-muted-foreground">{t("drive.available")}</span>
                      </span>
                      {acc.status === "invalid_token" && (
                        <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-red-500">{t("drive.statusInvalid")}</span>
                      )}
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted flex">
                      <div className={`h-full ${acc.palette.used}`} style={{ width: `${acc.pct}%` }} />
                      <div className={`h-full ${acc.palette.free}`} style={{ width: `${100 - acc.pct}%` }} />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">{formatFileSize(acc.used)} / {formatFileSize(acc.total)}</span>
                      <span className={acc.palette.text}>{formatFileSize(acc.free)} {t("drive.remaining")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "allocation" && (
            <div className="space-y-6">
              <Card className="rounded-[24px] shadow-[0_18px_44px_rgba(32,33,36,0.10)]">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold">{t("drive.strategy")}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t("drive.strategyDesc")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ALLOCATION_STRATEGIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStrategy(s)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          strategy === s ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{t(`alloc.${s}`)}</span>
                          {strategy === s && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t(`alloc.${s}Desc`)}</p>
                      </button>
                    ))}
                  </div>
                  {savingAlloc && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

                  {strategy === "custom" && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("drive.customOrder")}</h4>
                      <p className="text-xs text-muted-foreground">{t("drive.customOrderDesc")}</p>
                      <ul className="grid gap-2">
                        {customOrderedAccounts.map((acc, i) => (
                          <li
                            key={acc.id}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex !== null) onDropOrder(dragIndex, i);
                              setDragIndex(null);
                            }}
                            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 cursor-grab active:cursor-grabbing"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">{acc.email || "Google Drive"}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => moveOrder(i, -1)} title={t("drive.moveUp")}>
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" disabled={i === customOrderedAccounts.length - 1} onClick={() => moveOrder(i, 1)} title={t("drive.moveDown")}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[24px] shadow-[0_18px_44px_rgba(32,33,36,0.10)]">
                <CardContent className="p-6">
                  <h3 className="text-base font-bold">{t("drive.allocationTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("drive.allocationDesc")}</p>
                  <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-muted flex">
                    {segments.map((s) => (
                      <div key={s.key} className={`h-full ${s.cls}`} style={{ width: `${s.width}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {enrichedAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-2 text-sm">
                        <span className={`size-3 rounded-full ${acc.palette.used}`} />
                        <span className="font-medium truncate flex-1">{acc.email || "Google Drive"}</span>
                        <span className="text-muted-foreground">{acc.pct.toFixed(1)}% · {formatFileSize(acc.used)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
