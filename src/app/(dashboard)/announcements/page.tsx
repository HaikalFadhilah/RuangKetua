"use client";

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
import { Plus, Search, Bell, Megaphone, Edit3, Trash2, Pin, Loader2 } from "lucide-react";
import { ANNOUNCEMENT_CATEGORIES } from "@/config/constants";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  broadcast: boolean;
  createdAt: string;
}

import { container, item } from "@/lib/animations";

export default function AnnouncementsPage() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general", pinned: false, broadcast: false });

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/announcements?${params}`);
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch { toast.error(t("announce.toast.fetchError")); }
    finally { setIsLoading(false); }
  }, [search, categoryFilter]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", category: "general", pinned: false, broadcast: false });
    setIsDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, category: a.category, pinned: a.pinned, broadcast: a.broadcast });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error(t("announce.toast.required")); return; }
    setIsSaving(true);
    try {
      const url = editing ? `/api/announcements/${editing.id}` : "/api/announcements";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(editing ? t("announce.toast.updated") : t("announce.toast.created"));
      setIsDialogOpen(false);
      fetchAnnouncements();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("announce.toast.saveError")); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("announce.toast.deleted"));
      fetchAnnouncements();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("announce.toast.deleteError")); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.announcements")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("announce.subtitle")}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />{t("announce.create")}</Button>
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("announce.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">{t("announce.allCategories")}</option>
          {ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">{t("announce.empty")}</p>
        </CardContent></Card>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="group hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-yellow-500" />}
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                      {a.broadcast && <Badge variant="success" className="text-[10px]">{t("nav.broadcast")}</Badge>}
                      <span className="text-[11px] text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(a.id)} className="hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <DialogTitle>{editing ? t("announce.editTitle") : t("announce.createTitle")}</DialogTitle>
            <DialogDescription>{t("announce.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("announce.fieldTitle")}</Label><Input placeholder={t("announce.titlePlaceholder")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("announce.fieldContent")}</Label><Textarea placeholder={t("announce.contentPlaceholder")} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} /></div>
            <div className="space-y-2">
              <Label>{t("announce.fieldCategory")}</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="rounded" />{t("announce.pin")}</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.broadcast} onChange={(e) => setForm({ ...form, broadcast: e.target.checked })} className="rounded" />{t("announce.broadcastWa")}</label>
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
