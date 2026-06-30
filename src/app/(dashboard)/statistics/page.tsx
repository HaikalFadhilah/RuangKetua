"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  Clock,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Activity,
} from "lucide-react";

interface StatsData {
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byPriority: { priority: string; _count: number }[];
    byCourse: { name: string; count: number }[];
    byStatus: { status: string; _count: number }[];
  };
  announcements: number;
  dosen: number;
  elearning: number;
  files: number;
  notes: number;
  activities: number;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  overdue: "#ef4444",
};

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/statistics");
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      toast.error("Gagal mengambil statistik");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const completionRate = stats?.tasks.total
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Statistik</h1>
        <p className="text-muted-foreground text-sm mt-1">Analisis dan grafik aktivitas kelas</p>
      </motion.div>

      {/* Main Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><ListTodo className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-xs text-muted-foreground">Total Tugas</p><p className="text-2xl font-bold">{stats?.tasks.total || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-xs text-muted-foreground">Selesai</p><p className="text-2xl font-bold">{stats?.tasks.completed || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><TrendingUp className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-xs text-muted-foreground">Progress</p><p className="text-2xl font-bold">{completionRate}%</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
            <div><p className="text-xs text-muted-foreground">Terlambat</p><p className="text-2xl font-bold">{stats?.tasks.overdue || 0}</p></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10"><MessageSquare className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-xs text-muted-foreground">Pengumuman</p><p className="text-lg font-bold">{stats?.announcements || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10"><Users className="h-5 w-5 text-indigo-400" /></div>
            <div><p className="text-xs text-muted-foreground">Dosen</p><p className="text-lg font-bold">{stats?.dosen || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10"><BookOpen className="h-5 w-5 text-cyan-400" /></div>
            <div><p className="text-xs text-muted-foreground">E-Learning</p><p className="text-lg font-bold">{stats?.elearning || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10"><FileText className="h-5 w-5 text-teal-400" /></div>
            <div><p className="text-xs text-muted-foreground">File</p><p className="text-lg font-bold">{stats?.files || 0}</p></div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasks by Priority - CSS Bar Chart */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Tugas per Prioritas</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.tasks.byPriority && stats.tasks.byPriority.length > 0 ? (
                <div className="space-y-3">
                  {stats.tasks.byPriority.map((p) => {
                    const maxCount = Math.max(...stats.tasks.byPriority.map((x) => x._count));
                    const pct = maxCount > 0 ? (p._count / maxCount) * 100 : 0;
                    const color = PRIORITY_COLORS[p.priority] || "#6b7280";
                    return (
                      <div key={p.priority} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{p.priority}</span>
                          <span className="text-muted-foreground">{p._count}</span>
                        </div>
                        <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data tugas</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks by Status - Donut style */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" />Status Tugas</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.tasks.byStatus && stats.tasks.byStatus.length > 0 ? (
                <div className="space-y-3">
                  {stats.tasks.byStatus.map((s) => {
                    const pct = stats.tasks.total > 0 ? Math.round((s._count / stats.tasks.total) * 100) : 0;
                    const color = STATUS_COLORS[s.status] || "#6b7280";
                    return (
                      <div key={s.status} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize font-medium">{s.status.replace("_", " ")}</span>
                            <span className="text-muted-foreground text-xs">{s._count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.15 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data tugas</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks by Course */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Tugas per Mata Kuliah</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.tasks.byCourse && stats.tasks.byCourse.length > 0 ? (
                <div className="space-y-2">
                  {stats.tasks.byCourse.map((c, idx) => {
                    const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#06b6d4", "#f97316", "#ec4899"];
                    const color = colors[idx % colors.length];
                    const maxCount = Math.max(...stats.tasks.byCourse.map((x) => x.count));
                    const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[200px]">{c.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{c.count}</Badge>
                        </div>
                        <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Progress Ring */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Tingkat Penyelesaian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative h-40 w-40">
                  <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-accent" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={completionRate >= 80 ? "#22c55e" : completionRate >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - completionRate / 100) }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{completionRate}%</span>
                    <span className="text-xs text-muted-foreground">Selesai</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Selesai: {stats?.tasks.completed || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Pending: {stats?.tasks.pending || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
