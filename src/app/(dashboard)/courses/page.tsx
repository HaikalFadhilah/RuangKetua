"use client";

import { useI18n } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Pencil, BookOpen, Clock, FileText, ListTodo } from "lucide-react";
import type { CourseWithRelations } from "@/types";

import { container, item } from "@/lib/animations";

export default function CoursesPage() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithRelations | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    sks: "",
    semester: "",
    schedule: "",
    dosenName: "",
    dosenWa: "",
  });

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) setCourses(data.data);
    } catch {
      toast.error(t("courses.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openCreateDialog = () => {
    setEditingCourse(null);
    setForm({ name: "", sks: "", semester: "", schedule: "", dosenName: "", dosenWa: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: CourseWithRelations) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      sks: course.sks ? course.sks.toString() : "",
      semester: course.semester || "",
      schedule: course.schedule || "",
      dosenName: course.dosenName || "",
      dosenWa: course.dosenWa || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t("courses.nameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses";
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(editingCourse ? t("courses.updateSuccess") : t("courses.createSuccess"));
      setIsDialogOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("courses.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourseId) return;
    try {
      const res = await fetch(`/api/courses/${deletingCourseId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("courses.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setDeletingCourseId(null);
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("courses.deleteError"));
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.sks && c.sks.toString().includes(search.toLowerCase())) ||
    (c.semester && c.semester.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.courses")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("courses.subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t("courses.new")}
        </Button>
      </motion.div>

      {/* Filter */}
      <motion.div variants={item}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("courses.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium">{t("courses.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("courses.emptyHint")}</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="group hover:border-primary/20 transition-all duration-200">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1 pr-4">
                  <CardTitle className="text-lg line-clamp-2 leading-tight">{course.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {course.sks && <Badge variant="secondary" className="text-xs">{course.sks} SKS</Badge>}
                    {course.semester && <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">{course.semester}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(course)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setDeletingCourseId(course.id); setIsDeleteDialogOpen(true); }} className="hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {course.schedule && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{course.schedule}</p>
                    </div>
                  )}

                  {course.dosenName && (
                    <div className="flex items-center gap-2 pt-1 border-t text-xs text-muted-foreground mt-2">
                       <span className="truncate text-foreground font-medium">{t("courses.taughtBy", { name: course.dosenName })}</span>
                      {course.dosenWa && (
                        <a
                          href={`https://wa.me/${course.dosenWa.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-green-500 hover:text-green-600 transition-colors"
                          title={t("courses.contactWa")}
                        >
                          {t("courses.chatWa")}
                        </a>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-accent/40 rounded-md p-1.5 flex flex-col items-center">
                      <span className="font-medium text-foreground">{course._count?.tasks || 0}</span>
                      <span className="text-muted-foreground flex items-center gap-1"><ListTodo className="h-3 w-3"/> {t("courses.statTasks")}</span>
                    </div>
                    <div className="bg-accent/40 rounded-md p-1.5 flex flex-col items-center">
                      <span className="font-medium text-foreground">{course._count?.materials || 0}</span>
                      <span className="text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3"/> {t("courses.statMaterials")}</span>
                    </div>
                    <div className="bg-accent/40 rounded-md p-1.5 flex flex-col items-center">
                      <span className="font-medium text-foreground">{course._count?.elearnings || 0}</span>
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> {t("courses.statElearning")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? t("courses.editTitle") : t("courses.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("courses.dialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("courses.name")}</Label>
              <Input
                placeholder={t("courses.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
              <Label>{t("courses.sks")}</Label>
              <Input
                type="number"
                placeholder={t("courses.sksPlaceholder")}
                value={form.sks}
                  onChange={(e) => setForm({ ...form, sks: e.target.value })}
                />
              </div>
              <div className="space-y-2">
              <Label>{t("courses.semester")}</Label>
              <Input
                placeholder={t("courses.semesterPlaceholder")}
                value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("courses.schedule")}</Label>
              <Textarea
                placeholder={t("courses.schedulePlaceholder")}
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label>{t("courses.lecturerName")}</Label>
                <Input
                  placeholder={t("courses.lecturerPlaceholder")}
                  value={form.dosenName}
                  onChange={(e) => setForm({ ...form, dosenName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("courses.lecturerWa")}</Label>
                <Input
                  placeholder={t("courses.lecturerWaPlaceholder")}
                  value={form.dosenWa}
                  onChange={(e) => setForm({ ...form, dosenWa: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("courses.saving") : t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("courses.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("courses.deleteConfirm")}
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
