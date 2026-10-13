"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowLeft,
  Calendar,
  Edit3,
  Save,
  Trash2,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
  History,
  ListTodo,
  Plus,
} from "lucide-react";
import { formatDate, formatRelativeTime, getPriorityColor, getStatusColor } from "@/lib/utils";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/config/constants";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskHistory {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  course: { id: string; name: string } | null;
  subtasks: Subtask[];
  history: TaskHistory[];
}

import { container, item } from "@/lib/animations";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "medium",
    status: "PENDING",
  });

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setTask(data.data);
        setForm({
          title: data.data.title,
          description: data.data.description || "",
          deadline: data.data.deadline ? (() => {
            const utc = new Date(data.data.deadline);
            const wib = new Date(utc.getTime() + 7 * 60 * 60 * 1000);
            return wib.toISOString().slice(0, 16);
          })() : "",
          priority: data.data.priority,
          status: data.data.status,
        });
      } else {
        toast.error("Tugas tidak ditemukan");
        router.push("/tasks");
      }
    } catch {
      toast.error("Gagal mengambil data");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Tugas berhasil diupdate");
      setIsEditing(false);
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status diupdate");
      fetchTask();
    } catch { toast.error("Gagal update status"); }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    if (!task) return;
    const updated = task.subtasks.map((s) =>
      s.id === subtask.id ? { ...s, completed: !s.completed } : s
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtasks: updated.map((s) => ({ title: s.title, completed: s.completed })),
        }),
      });
      fetchTask();
    } catch { toast.error("Gagal update subtask"); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    const updated = [...task.subtasks.map((s) => ({ title: s.title, completed: s.completed })), { title: newSubtask, completed: false }];
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updated }),
      });
      setNewSubtask("");
      fetchTask();
    } catch { toast.error("Gagal menambah subtask"); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      toast.success("Tugas dihapus");
      router.push("/tasks");
    } catch { toast.error("Gagal menghapus"); }
    finally { setIsDeleting(false); setDeleteOpen(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl md:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const subtaskProgress = task.subtasks.length > 0
    ? Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)
    : 0;

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/tasks")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Dibuat {formatRelativeTime(task.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Batal</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4" />Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />Hapus
              </Button>
            </>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div variants={item} className="md:col-span-2 space-y-6">
          {/* Task Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioritas</Label>
                      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    {task.course && <Badge variant="secondary">{task.course.name}</Badge>}
                  </div>
                  {task.description ? (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Tidak ada deskripsi</p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                    {task.deadline && (
                      <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Deadline: {formatDate(task.deadline)}</span>
                    )}
                    {task.course && (
                      <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{task.course.name}</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><ListTodo className="h-4 w-4" />Subtask ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})</span>
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">{subtaskProgress}%</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.subtasks.length > 0 && (
                <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subtaskProgress}%` }}
                    className="h-full bg-primary rounded-full"
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              {task.subtasks.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleToggleSubtask(sub)}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left cursor-pointer"
                >
                  {sub.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm ${sub.completed ? "line-through text-muted-foreground" : ""}`}>{sub.title}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Tambah subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Riwayat Perubahan</CardTitle>
            </CardHeader>
            <CardContent>
              {task.history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada perubahan</p>
              ) : (
                <div className="space-y-3">
                  {task.history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p>
                          <span className="font-medium capitalize">{h.field}</span> diubah dari{" "}
                          <Badge variant="secondary" className="text-[10px]">{h.oldValue || "-"}</Badge> ke{" "}
                          <Badge variant="default" className="text-[10px]">{h.newValue || "-"}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(h.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={item} className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s.value}
                  variant={task.status === s.value ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange(s.value)}
                >
                  {task.status === s.value && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {s.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span>{formatDate(task.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diupdate</span>
                <span>{formatDate(task.updatedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prioritas</span>
                <Badge className={`${getPriorityColor(task.priority)} text-[10px]`}>{task.priority}</Badge>
              </div>
              {task.deadline && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="text-xs">{formatDate(task.deadline)}</span>
                  </div>
                </>
              )}
              {task.course && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matakuliah</span>
                    <span>{task.course.name}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>

    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Hapus tugas ini?"
      description="Tugas beserta semua subtask dan riwayatnya akan dihapus secara permanen."
      confirmLabel="Hapus Tugas"
      loading={isDeleting}
      onConfirm={handleDelete}
    />
    </>
  );
}
