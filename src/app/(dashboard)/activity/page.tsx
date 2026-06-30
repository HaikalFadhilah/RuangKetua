"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon, Plus, Edit3, Trash2, Radio, Bell, MessageSquare, LogIn, LogOut } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityLogEntry } from "@/types";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-3.5 w-3.5" />,
  UPDATE: <Edit3 className="h-3.5 w-3.5" />,
  DELETE: <Trash2 className="h-3.5 w-3.5" />,
  BROADCAST: <Radio className="h-3.5 w-3.5" />,
  REMINDER: <Bell className="h-3.5 w-3.5" />,
  WA_LOGIN: <LogIn className="h-3.5 w-3.5" />,
  WA_DISCONNECT: <LogOut className="h-3.5 w-3.5" />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-red-500/10 text-red-500",
  BROADCAST: "bg-purple-500/10 text-purple-500",
  REMINDER: "bg-yellow-500/10 text-yellow-500",
  WA_LOGIN: "bg-green-500/10 text-green-500",
  WA_DISCONNECT: "bg-red-500/10 text-red-500",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/activity?limit=50");
      const data = await res.json();
      if (data.success) setActivities(data.data);
    } catch { toast.error("Gagal mengambil activity log"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Riwayat semua aktivitas</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : activities.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <ActivityIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">Belum ada aktivitas</p>
        </CardContent></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <motion.div variants={item} className="space-y-1">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 pl-10 py-3">
                <div className={`absolute left-2 top-4 flex h-[14px] w-[14px] items-center justify-center rounded-full ring-4 ring-background ${actionColors[act.action] || "bg-gray-500/10 text-gray-500"}`}>
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{act.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{act.action}</Badge>
                    <Badge variant="outline" className="text-[10px]">{act.entity}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatRelativeTime(act.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
