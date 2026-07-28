"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Clock,
  Megaphone,
  Timer,
  X,
  ArrowRight,
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
  overdue: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", labelKey: "notifpanel.type.overdue" },
  deadline: { icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10", labelKey: "notifpanel.type.deadline" },
  reminder: { icon: Timer, color: "text-yellow-400", bg: "bg-yellow-400/10", labelKey: "notifpanel.type.reminder" },
  info: { icon: Megaphone, color: "text-blue-400", bg: "bg-blue-400/10", labelKey: "notifpanel.type.info" },
};

export function NotificationPanel() {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setCount(data.data.count || 0);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when panel opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleClick = (notif: Notification) => {
    if (notif.entityType === "task") router.push(`/tasks/${notif.entityId}`);
    else if (notif.entityType === "announcement") router.push("/announcements");
    else router.push("/elearning");
    setIsOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-xl border border-border bg-background shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t("notifpanel.title")}</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                    {count}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[380px]">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">{t("notifpanel.empty")}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t("notifpanel.emptySub")}</p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((notif) => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${config.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{notif.title}</span>
                            {notif.priority === "URGENT" && (
                              <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                                {t("notifpanel.urgent")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {formatRelativeTime(notif.time)}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-1.5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => { router.push("/notifications"); setIsOpen(false); }}
                className="text-xs text-primary hover:underline font-medium w-full text-center cursor-pointer"
              >
                {t("notifpanel.viewAll")} →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
