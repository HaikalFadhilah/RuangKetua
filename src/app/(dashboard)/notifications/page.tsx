"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Clock,
  Megaphone,
  Timer,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ListTodo,
  CalendarClock,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Notification {
  id: string;
  type: "overdue" | "deadline" | "reminder" | "info";
  title: string;
  description: string;
  priority: string | null;
  entityId: string;
  entityType: "task" | "reminder" | "announcement";
  time: string;
}

const typeConfig = {
  overdue: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Terlambat",
    badgeBg: "bg-red-500/10 text-red-500",
  },
  deadline: {
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: "Deadline",
    badgeBg: "bg-orange-500/10 text-orange-500",
  },
  reminder: {
    icon: Timer,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Reminder",
    badgeBg: "bg-yellow-500/10 text-yellow-600",
  },
  info: {
    icon: Megaphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Informasi",
    badgeBg: "bg-blue-500/10 text-blue-500",
  },
};

import { container, item } from "@/lib/animations";

const FILTERS = ["Semua", "Terlambat", "Deadline", "Reminder", "Informasi"] as const;
type Filter = (typeof FILTERS)[number];

export default function NotificationsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("Semua");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setCount(data.data.count || 0);
        setLastUpdated(new Date());
      }
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClick = (notif: Notification) => {
    if (notif.entityType === "task") router.push(`/tasks/${notif.entityId}`);
    else if (notif.entityType === "announcement") router.push("/announcements");
    else router.push("/calendar");
  };

  const filterMap: Record<Filter, Notification["type"] | null> = {
    Semua: null,
    Terlambat: "overdue",
    Deadline: "deadline",
    Reminder: "reminder",
    Informasi: "info",
  };

  const filtered =
    filter === "Semua"
      ? notifications
      : notifications.filter((n) => n.type === filterMap[filter]);

  // Summary counts
  const overdueCnt = notifications.filter((n) => n.type === "overdue").length;
  const deadlineCnt = notifications.filter((n) => n.type === "deadline").length;
  const reminderCnt = notifications.filter((n) => n.type === "reminder").length;
  const infoCnt = notifications.filter((n) => n.type === "info").length;

  const filterLabels: Record<Filter, string> = {
    Semua: t("notif.filterAll"),
    Terlambat: t("notif.filterOverdue"),
    Deadline: t("notif.filterDeadline"),
    Reminder: t("notif.filterReminder"),
    Informasi: t("notif.filterInfo"),
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-5"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("notif.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("notif.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("notif.updated", { time: formatRelativeTime(lastUpdated.toISOString()) })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("action.refresh")}
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Terlambat", labelKey: "notif.summaryOverdue", count: overdueCnt, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Deadline Segera", labelKey: "notif.summaryDeadline", count: deadlineCnt, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Reminder", labelKey: "notif.summaryReminder", count: reminderCnt, icon: Timer, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { label: "Informasi", labelKey: "notif.summaryInfo", count: infoCnt, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-border shadow-sm cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setFilter(s.label === "Deadline Segera" ? "Deadline" : (s.label as Filter))}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-xs text-muted-foreground">{t(s.labelKey)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {filterLabels[f]}
              {f === "Semua" && notifications.length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({notifications.length})</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notification List */}
      <motion.div variants={item}>
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {filter === "Semua" ? t("notif.allNotifications") : filterLabels[filter]}
              {filtered.length > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("notif.itemCount", { count: filtered.length })})
                </span>
              )}
            </CardTitle>
            {count > 0 && (
              <CardDescription className="text-xs">
                {t("notif.activeCount", { count })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">{t("notif.loading")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <div className="p-4 rounded-full bg-muted/50">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {filter === "Semua" ? t("notif.emptyTitle") : t("notif.emptyTitleFiltered", { filter: filterLabels[filter] })}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {filter === "Semua"
                      ? t("notif.emptyDescAll")
                      : t("notif.emptyDescFiltered")}
                  </p>
                </div>
                {filter !== "Semua" && (
                  <Button variant="outline" size="sm" onClick={() => setFilter("Semua")}>
                    {t("notif.showAll")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((notif) => {
                  const cfg = typeConfig[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className="flex items-start gap-4 w-full px-5 py-4 text-left hover:bg-muted/40 transition-colors group"
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate">{notif.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badgeBg}`}>
                            {t(`notif.type.${notif.type}`)}
                          </span>
                          {notif.priority === "URGENT" && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 shrink-0">
                              {t("notif.urgent")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatRelativeTime(notif.time)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="border-border shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
          onClick={() => router.push("/tasks")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <ListTodo className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t("notif.manageTasks")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("notif.manageTasksDesc")}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card
          className="border-border shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
          onClick={() => router.push("/calendar")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <CalendarClock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t("notif.openCalendar")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("notif.openCalendarDesc")}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
