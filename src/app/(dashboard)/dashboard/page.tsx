"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListTodo,
  Clock,
  Bell,
  Megaphone,
  TrendingUp,
  Plus,
  Radio,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Timer,
  FolderOpen,
  Sheet,
  Users,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { DashboardStats } from "@/types";
import { formatRelativeTime, getDeadlineColor } from "@/lib/utils";

import { container, item } from "@/lib/animations";

const quickActions = [
  { label: "dash.quickTask", href: "/tasks", icon: Plus, color: "text-primary" },
  { label: "dash.quickBroadcast", href: "/broadcast", icon: Radio, color: "text-primary" },
  { label: "dash.quickReminder", href: "/reminders", icon: Bell, color: "text-primary" },
  { label: "dash.quickAnnouncement", href: "/announcements", icon: Megaphone, color: "text-primary" },
  { label: "dash.quickFiles", href: "/files", icon: FolderOpen, color: "text-primary" },
  { label: "dash.quickSpreadsheets", href: "/spreadsheets", icon: Sheet, color: "text-primary" },
  { label: "dash.quickMembers", href: "/members", icon: Users, color: "text-primary" },
  { label: "dash.quickNotes", href: "/notes", icon: StickyNote, color: "text-primary" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/statistics");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dash.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks">
            <Plus className="h-4 w-4" />
            {t("dash.quickTask")}
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label={t("dash.activeTasks")}
          value={stats?.activeTasks ?? 0}
          icon={<ListTodo className="h-5 w-5" />}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
        <StatsCard
          label={t("dash.completed")}
          value={stats?.completedTasks ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="text-green-400"
          bgColor="bg-green-400/10"
        />
        <StatsCard
          label={t("dash.overdue")}
          value={stats?.overdueTasks ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="text-red-400"
          bgColor="bg-red-400/10"
        />
        <StatsCard
          label={t("dash.todayReminders")}
          value={stats?.todayReminders ?? 0}
          icon={<Bell className="h-5 w-5" />}
          color="text-yellow-400"
          bgColor="bg-yellow-400/10"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t("dash.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all duration-200 hover:bg-accent hover:border-primary/30 hover:shadow-sm cursor-pointer group">
                    <div className={`p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium text-center">{t(action.label)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                {t("dash.deadlinesTitle")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks" className="text-xs">
                  {t("dash.viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                stats.upcomingDeadlines.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                         {task.course?.name || t("dash.general")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs font-medium ${task.deadline ? getDeadlineColor(task.deadline) : ""}`}>
                        {task.deadline ? formatRelativeTime(task.deadline) : "-"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Timer className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("dash.noDeadlines")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Announcements */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-400" />
                {t("dash.announcementsTitle")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/announcements" className="text-xs">
                  {t("dash.viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
                stats.recentAnnouncements.slice(0, 5).map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(ann.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {ann.category}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("dash.noAnnouncements")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Semester Progress */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("dash.semesterProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dash.progress")}</span>
                <span className="font-medium">{stats?.semesterProgress ?? 0}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.semesterProgress ?? 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <div className={color}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
