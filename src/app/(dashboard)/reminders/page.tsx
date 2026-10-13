"use client";

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  ListTodo,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Bell,
  BellOff,
  Settings2,
  Clock,
  Send,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { container, item } from "@/lib/animations";

interface AutoReminderData {
  id: string;
  type: string;
  enabled: boolean;
  reminderDays: string;
  reminderTime: string;
  target: string;
  messageTemplate: string | null;
  lastTriggered: string | null;
  triggerCount: number;
}

const REMINDER_TYPES = [
  { type: "elearning", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
  { type: "task_deadline", icon: ListTodo, color: "text-orange-500", bg: "bg-orange-500/10" },
  { type: "daily_schedule", icon: CalendarDays, color: "text-green-500", bg: "bg-green-500/10" },
  { type: "absen", icon: ClipboardCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
  { type: "exam", icon: GraduationCap, color: "text-red-500", bg: "bg-red-500/10" },
  { type: "weekly_report", icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-500/10" },
] as const;

const DEFAULT_CONFIGS: Record<string, { days: string; time: string }> = {
  elearning: { days: "H-7,H-3,H-1", time: "07:00" },
  task_deadline: { days: "H-7,H-3,H-1", time: "07:00" },
  daily_schedule: { days: "", time: "06:30" },
  absen: { days: "", time: "12:00" },
  exam: { days: "H-7,H-3,H-1", time: "07:00" },
  weekly_report: { days: "", time: "20:00" },
};

// Types that use H-x day config
const USES_H_DAYS = ["elearning", "task_deadline", "exam"];

export default function RemindersPage() {
  const { t } = useI18n();
  const [reminders, setReminders] = useState<AutoReminderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configType, setConfigType] = useState<string | null>(null);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [defaultGroupName, setDefaultGroupName] = useState<string | null>(null);

  const [configForm, setConfigForm] = useState({
    reminderDays: "",
    reminderTime: "",
    messageTemplate: "",
  });

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auto-reminder");
      const data = await res.json();
      if (data.success) setReminders(data.data);
    } catch {
      toast.error(t("reminder.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDeliveryStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setDeliveryReady(Boolean(data.data.connected && data.data.defaultGroupId));
        setDefaultGroupName(data.data.defaultGroupName || null);
      }
    } catch {
      setDeliveryReady(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    fetchDeliveryStatus();
  }, [fetchDeliveryStatus, fetchReminders]);

  const getReminderByType = (type: string): AutoReminderData | undefined => {
    return reminders.find((r) => r.type === type);
  };

  const handleToggle = async (type: string) => {
    const existing = getReminderByType(type);
    const newEnabled = existing ? !existing.enabled : true;
    const defaults = DEFAULT_CONFIGS[type] || { days: "H-7,H-3,H-1", time: "07:00" };

    if (newEnabled && !deliveryReady) {
      toast.error(t("reminder.deliveryNotReady"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auto-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          enabled: newEnabled,
          reminderDays: existing?.reminderDays || defaults.days,
          reminderTime: existing?.reminderTime || defaults.time,
          target: existing?.target || "group",
          messageTemplate: existing?.messageTemplate || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("reminder.saveSuccess"));
      fetchReminders();
    } catch {
      toast.error(t("reminder.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const openConfig = (type: string) => {
    const existing = getReminderByType(type);
    const defaults = DEFAULT_CONFIGS[type] || { days: "H-7,H-3,H-1", time: "07:00" };
    setConfigType(type);
    setConfigForm({
      reminderDays: existing?.reminderDays || defaults.days,
      reminderTime: existing?.reminderTime || defaults.time,
      messageTemplate: existing?.messageTemplate || "",
    });
    setConfigOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!configType) return;
    const existing = getReminderByType(configType);
    if ((existing?.enabled ?? true) && !deliveryReady) {
      toast.error(t("reminder.deliveryNotReady"));
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/auto-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: configType,
          enabled: existing?.enabled ?? true,
          reminderDays: configForm.reminderDays,
          reminderTime: configForm.reminderTime,
          target: "group",
          messageTemplate: configForm.messageTemplate || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("reminder.saveSuccess"));
      setConfigOpen(false);
      fetchReminders();
    } catch {
      toast.error(t("reminder.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastTriggered = (dateStr: string | null): string => {
    if (!dateStr) return t("reminder.never");
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const activeCount = reminders.filter((r) => r.enabled).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("reminder.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("reminder.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {activeCount}/{REMINDER_TYPES.length} {t("reminder.enabled")}
          </Badge>
        </div>
      </motion.div>

      {!deliveryReady && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold">{t("reminder.deliveryTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("reminder.deliveryDesc")}</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href="/whatsapp">{t("reminder.deliveryAction")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {deliveryReady && defaultGroupName && (
        <p className="text-xs text-muted-foreground">
          {t("reminder.deliveryReady", { group: defaultGroupName })}
        </p>
      )}

      {/* Reminder Cards Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={item} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REMINDER_TYPES.map(({ type, icon: Icon, color, bg }) => {
            const reminder = getReminderByType(type);
            const isEnabled = reminder?.enabled ?? false;

            return (
              <Card
                key={type}
                className={`group transition-all duration-200 ${
                  isEnabled ? "hover:border-primary/20" : "opacity-75 hover:opacity-100"
                }`}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base leading-tight">
                        {t(`reminder.type.${type}`)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(`reminder.type.${type}.desc`)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    {/* Status & Stats */}
                    {reminder && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-accent/40 rounded-md p-2 flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {t("reminder.time")}
                          </span>
                          <span className="font-medium text-foreground mt-0.5">{reminder.reminderTime} WIB</span>
                        </div>
                        <div className="bg-accent/40 rounded-md p-2 flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Send className="h-3 w-3" /> {t("reminder.triggerCount")}
                          </span>
                          <span className="font-medium text-foreground mt-0.5">
                            {t("reminder.times", { count: String(reminder.triggerCount) })}
                          </span>
                        </div>
                      </div>
                    )}

                    {reminder && USES_H_DAYS.includes(type) && (
                      <div className="flex flex-wrap gap-1">
                        {(reminder.reminderDays || "").split(",").filter(Boolean).map((d) => (
                          <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {d.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {reminder?.lastTriggered && (
                      <p className="text-[11px] text-muted-foreground">
                        {t("reminder.lastTriggered")}: {formatLastTriggered(reminder.lastTriggered)}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t mt-2">
                      <Button
                        variant={isEnabled ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggle(type)}
                        disabled={isSaving}
                      >
                        {isEnabled ? (
                          <>
                            <Bell className="h-3.5 w-3.5 mr-1.5" />
                            {t("reminder.enabled")}
                          </>
                        ) : (
                          <>
                            <BellOff className="h-3.5 w-3.5 mr-1.5" />
                            {t("reminder.disabled")}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openConfig(type)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reminder.configTitle")}</DialogTitle>
            <DialogDescription>{t("reminder.configDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Send Time */}
            <div className="space-y-2">
              <Label>{t("reminder.time")}</Label>
              <Input
                type="time"
                value={configForm.reminderTime}
                onChange={(e) => setConfigForm({ ...configForm, reminderTime: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("reminder.timeHint")}</p>
            </div>

            {/* H-x Days (only for types that use it) */}
            {configType && USES_H_DAYS.includes(configType) && (
              <div className="space-y-2">
                <Label>{t("reminder.days")}</Label>
                <Input
                  placeholder="H-7,H-3,H-1"
                  value={configForm.reminderDays}
                  onChange={(e) => setConfigForm({ ...configForm, reminderDays: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t("reminder.daysHint")}</p>
              </div>
            )}

            {/* Message Template */}
            <div className="space-y-2">
              <Label>{t("reminder.template")}</Label>
              <Textarea
                placeholder={t("reminder.templateHint")}
                value={configForm.messageTemplate}
                onChange={(e) => setConfigForm({ ...configForm, messageTemplate: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? "..." : t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
