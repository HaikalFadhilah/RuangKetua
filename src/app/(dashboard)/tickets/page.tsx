"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  LifeBuoy, Plus, Loader2, CheckCircle2, Clock,
  XCircle, MessageSquare, Send, AlertCircle
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";

import { container, item } from "@/lib/animations";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN:        { label: "tickets.status.open",       color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  IN_PROGRESS: { label: "tickets.status.inProgress", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  RESOLVED:    { label: "tickets.status.resolved",   color: "bg-green-500/10 text-green-600 border-green-500/30" },
  CLOSED:      { label: "tickets.status.closed",     color: "bg-muted text-muted-foreground" },
};

const CATEGORY_OPTIONS = [
  { value: "BUG",      label: "tickets.category.bug" },
  { value: "FEATURE",  label: "tickets.category.feature" },
  { value: "QUESTION", label: "tickets.category.question" },
  { value: "OTHER",    label: "tickets.category.other" },
];

export default function TicketsPage() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", category: "BUG" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      const d = await res.json();
      if (d.success) setTickets(d.data ?? []);
    } catch {
      toast.error(t("tickets.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error(t("tickets.toast.required"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("tickets.toast.sent"));
      setCreateOpen(false);
      setForm({ subject: "", message: "", category: "BUG" });
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || t("tickets.toast.sendError"));
    } finally {
      setCreating(false);
    }
  };

  const openCount = tickets.filter(t => t.status === "OPEN").length;
  const doneCount = tickets.filter(t => t.status === "RESOLVED").length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.tickets")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("tickets.subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> {t("tickets.create")}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10"><Clock className="h-4 w-4 text-yellow-500" /></div>
            <div><p className="text-xs text-muted-foreground">{t("tickets.stat.open")}</p><p className="text-2xl font-bold">{openCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/10"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
            <div><p className="text-xs text-muted-foreground">{t("tickets.status.resolved")}</p><p className="text-2xl font-bold">{doneCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><LifeBuoy className="h-4 w-4 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">{t("tickets.stat.total")}</p><p className="text-2xl font-bold">{tickets.length}</p></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="py-16 text-center">
              <LifeBuoy className="h-10 w-10 opacity-20 mx-auto mb-3" />
              <p className="text-sm font-medium">{t("tickets.empty")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("tickets.emptyDesc")}
              </p>
              <Button className="mt-4 gap-2" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> {t("tickets.createFirst")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const statusInfo = STATUS_MAP[ticket.status] ?? STATUS_MAP.OPEN;
            const isExpanded = expandedId === ticket.id;
            return (
              <motion.div key={ticket.id} variants={item}>
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{ticket.subject}</p>
                          <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{t(statusInfo.label)}</Badge>
                          <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(ticket.createdAt)}
                          {ticket.replies?.length > 0 && (
                            <span className="ml-2 text-primary">· {t("tickets.replies", { count: ticket.replies.length })}</span>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                      >
                        <MessageSquare className="h-3 w-3" />
                        {isExpanded ? t("action.close") : t("tickets.view")}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-muted/40 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{t("tickets.yourMessage")}</p>
                          <p className="text-sm">{ticket.message}</p>
                        </div>

                        {ticket.replies?.length > 0 && (
                          <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                            {ticket.replies.map((r: any) => (
                              <div key={r.id} className={`text-xs p-2.5 rounded-lg ${r.isAdmin ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-semibold ${r.isAdmin ? "text-primary" : ""}`}>
                                    {r.isAdmin ? t("tickets.admin") : t("tickets.you")}
                                  </span>
                                  <span className="text-muted-foreground">{formatRelativeTime(r.createdAt)}</span>
                                </div>
                                <p>{r.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                            {ticket.status === "RESOLVED"
                              ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {t("tickets.resolvedNote")}</>
                              : <><XCircle className="h-3.5 w-3.5" /> {t("tickets.closedNote")}</>
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={open => !open && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" /> {t("tickets.createTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("tickets.fieldCategory")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{t(c.label)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("tickets.fieldSubject")} <span className="text-destructive">*</span></Label>
              <Input
                placeholder={t("tickets.subjectPlaceholder")}
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("tickets.fieldDescription")} <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder={t("tickets.descPlaceholder")}
                className="min-h-[100px] text-sm"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {t("tickets.adminNote")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>{t("action.cancel")}</Button>
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("tickets.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
