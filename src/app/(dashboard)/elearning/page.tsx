"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Clock, AlertCircle, Edit3, Trash2, Loader2, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface ELearningItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  frequency: string;
  reminders: string;
  isActive: boolean;
  course: { id: string; name: string; code: string | null };
}

interface Course {
  id: string;
  name: string;
  code: string | null;
}

import { container, item } from "@/lib/animations";

export default function ELearningPage() {
  const [elearnings, setElearnings] = useState<ELearningItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ELearningItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    frequency: "2_weeks",
    reminders: "H-7,H-3,H-1,H-0",
  });

  const { t } = useI18n();

  const fetchData = useCallback(async () => {
    try {
      const [elRes, courseRes] = await Promise.all([
        fetch("/api/elearning?limit=50"),
        fetch("/api/courses"),
      ]);
      const elData = await elRes.json();
      const courseData = await courseRes.json();
      if (elData.success) setElearnings(elData.data);
      if (courseData.success) setCourses(courseData.data);
    }     catch { toast.error(t("elearning.fetchError")); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const activeCount = elearnings.filter((e) => e.isActive && new Date(e.endDate) > now).length;
  const closingCount = elearnings.filter((e) => {
    const diff = new Date(e.endDate).getTime() - now.getTime();
    return e.isActive && diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  }).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ courseId: "", title: "", description: "", startDate: "", endDate: "", frequency: "2_weeks", reminders: "H-7,H-3,H-1,H-0" });
    setIsDialogOpen(true);
  };

  const openEdit = (el: ELearningItem) => {
    setEditing(el);
    setForm({
      courseId: el.course.id,
      title: el.title,
      description: el.description || "",
      startDate: new Date(el.startDate).toISOString().slice(0, 16),
      endDate: new Date(el.endDate).toISOString().slice(0, 16),
      frequency: el.frequency,
      reminders: el.reminders,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.courseId) { toast.error(t("elearning.incompleteData")); return; }
    setIsSaving(true);
    try {
      const url = editing ? `/api/elearning/${editing.id}` : "/api/elearning";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(editing ? t("elearning.updated") : t("elearning.added"));
      setIsDialogOpen(false);
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("elearning.saveError")); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/elearning/${id}`, { method: "DELETE" });
      toast.success(t("elearning.deleted"));
      fetchData();
    } catch { toast.error(t("elearning.deleteError")); }
  };

  const getStatusBadge = (el: ELearningItem) => {
    const end = new Date(el.endDate);
    const diff = end.getTime() - now.getTime();
    if (diff < 0) return <Badge variant="destructive" className="text-[10px]">{t("elearning.statusClosed")}</Badge>;
    if (diff < 24 * 60 * 60 * 1000) return <Badge variant="destructive" className="text-[10px]">{t("elearning.statusToday")}</Badge>;
    if (diff < 3 * 24 * 60 * 60 * 1000) return <Badge variant="warning" className="text-[10px]">{t("elearning.statusClosing")}</Badge>;
    return <Badge variant="success" className="text-[10px]">{t("elearning.statusActive")}</Badge>;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("elearning.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("elearning.subtitle")}</p>
        </div>
         <Button onClick={openCreate}><Plus className="h-4 w-4" />{t("elearning.add")}</Button>
      </motion.div>

      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><BookOpen className="h-5 w-5 text-blue-400" /></div>
           <div><p className="text-sm font-medium">{t("elearning.total")}</p><p className="text-2xl font-bold">{elearnings.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><Clock className="h-5 w-5 text-green-400" /></div>
           <div><p className="text-sm font-medium">{t("elearning.statusActive")}</p><p className="text-2xl font-bold">{activeCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10"><AlertCircle className="h-5 w-5 text-red-400" /></div>
           <div><p className="text-sm font-medium">{t("elearning.statusClosing")}</p><p className="text-2xl font-bold">{closingCount}</p></div>
        </CardContent></Card>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : elearnings.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">{t("elearning.empty")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("elearning.emptyDesc")}</p>
        </CardContent></Card>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {elearnings.map((el) => (
            <Card key={el.id} className="group hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{el.title}</h3>
                      {getStatusBadge(el)}
                      <Badge variant="secondary" className="text-[10px]">{el.course?.name}</Badge>
                    </div>
                    {el.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{el.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t("elearning.start")}: {formatDate(el.startDate)}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t("elearning.end")}: {formatDate(el.endDate)}</span>
                      <span className="flex items-center gap-1"><Bell className="h-3 w-3" />{t("elearning.reminder")}: {el.reminders}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(el)}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(el.id)} className="hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("elearning.editTitle") : t("elearning.add")}</DialogTitle>
            <DialogDescription>{t("elearning.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("elearning.course")}</Label>
              <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                 <option value="">{t("elearning.selectCourse")}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>{t("elearning.titleLabel")}</Label><Input placeholder={t("elearning.titlePlaceholder")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("elearning.descLabel")}</Label><Textarea placeholder={t("elearning.descPlaceholder")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t("elearning.startDateLabel")}</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("elearning.endDateLabel")}</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("elearning.frequencyLabel")}</Label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="weekly">{t("elearning.freqWeekly")}</option>
                  <option value="2_weeks">{t("elearning.freq2Weeks")}</option>
                  <option value="monthly">{t("elearning.freqMonthly")}</option>
                  <option value="once">{t("elearning.freqOnce")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("elearning.reminderLabel")}</Label>
                <select value={form.reminders} onChange={(e) => setForm({ ...form, reminders: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="H-7,H-3,H-1,H-0">{t("elearning.remOption1")}</option>
                  <option value="H-3,H-1,H-0">{t("elearning.remOption2")}</option>
                  <option value="H-1,H-0">{t("elearning.remOption3")}</option>
                  <option value="H-0">{t("elearning.remOption4")}</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("action.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
