"use client";

import { useI18n } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  ListTodo,
} from "lucide-react";
import type { TaskWithRelations, Priority, TaskStatus, CourseWithRelations } from "@/types";
import { getPriorityColor, getStatusColor, formatRelativeTime } from "@/lib/utils";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/config/constants";

import { container, item } from "@/lib/animations";

export default function TasksPage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    deadline: "",
    priority: "MEDIUM" as Priority,
    status: "PENDING" as TaskStatus,
  });

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) setCourses(data.data);
    } catch {
      // fail silently
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch {
      toast.error(t("tasks.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
    fetchCourses();
  }, [fetchTasks, fetchCourses]);

  const openCreateDialog = () => {
    setEditingTask(null);
    setForm({ title: "", description: "", courseId: "", deadline: "", priority: "MEDIUM", status: "PENDING" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: TaskWithRelations) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      courseId: task.course?.id || "",
      deadline: task.deadline ? (() => {
        // Convert UTC to WIB (UTC+7) for datetime-local input
        const utc = new Date(task.deadline as string);
        const wib = new Date(utc.getTime() + 7 * 60 * 60 * 1000);
        return wib.toISOString().slice(0, 16);
      })() : "",
      priority: task.priority,
      status: task.status,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(t("tasks.titleRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(editingTask ? t("tasks.updateSuccess") : t("tasks.createSuccess"));
      setIsDialogOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tasks.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    try {
      const res = await fetch(`/api/tasks/${deletingTaskId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("tasks.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tasks.deleteError"));
    }
  };

  const handleStatusToggle = async (task: TaskWithRelations) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      toast.success(newStatus === "COMPLETED" ? t("tasks.completed") : t("tasks.reopened"));
    } catch {
      toast.error(t("tasks.statusError"));
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.tasks")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("tasks.subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t("tasks.new")}
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("tasks.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("tasks.allStatus")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("tasks.allPriority")}</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ListTodo className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium">{t("tasks.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("tasks.emptyHint")}</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="group hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Status toggle */}
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className="mt-0.5 shrink-0 cursor-pointer"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`text-sm font-medium ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(task)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }}
                          className="hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={`text-[10px] ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`text-[10px] ${getStatusColor(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      {task.course && (
                        <Badge variant="secondary" className="text-[10px]">{task.course.name}</Badge>
                      )}
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? t("tasks.editTitle") : t("tasks.createTitle")}</DialogTitle>
            <DialogDescription>
              {editingTask ? t("tasks.editDesc") : t("tasks.createDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("tasks.title")}</Label>
              <Input
                placeholder={t("tasks.titlePlaceholder")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("tasks.course")}</Label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("tasks.selectCourse")}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("tasks.description")}</Label>
              <Textarea
                placeholder={t("tasks.descriptionPlaceholder")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("tasks.priority")}</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("tasks.status")}</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
                <Label>{t("tasks.deadline")}</Label>
              <Input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTask ? t("action.save") : t("action.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("tasks.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("tasks.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t("action.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("action.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
