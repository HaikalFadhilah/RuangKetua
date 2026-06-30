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
import { Plus, Search, GraduationCap, Phone, Mail, Clock, Edit3, Trash2, Loader2 } from "lucide-react";
import type { DosenWithCourses } from "@/types";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function DosenPage() {
  const [dosenList, setDosenList] = useState<DosenWithCourses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState<DosenWithCourses | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", consultHours: "" });

  const fetchDosen = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");
      const res = await fetch(`/api/dosen?${params}`);
      const data = await res.json();
      if (data.success) setDosenList(data.data);
    } catch { toast.error("Gagal mengambil data dosen"); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchDosen(); }, [fetchDosen]);

  const openCreate = () => {
    setEditingDosen(null);
    setForm({ name: "", whatsapp: "", email: "", consultHours: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (d: DosenWithCourses) => {
    setEditingDosen(d);
    setForm({ name: d.name, whatsapp: d.whatsapp || "", email: d.email || "", consultHours: d.consultHours || "" });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nama wajib diisi"); return; }
    setIsSaving(true);
    try {
      const url = editingDosen ? `/api/dosen/${editingDosen.id}` : "/api/dosen";
      const method = editingDosen ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(editingDosen ? "Dosen berhasil diupdate" : "Dosen berhasil ditambahkan");
      setIsDialogOpen(false);
      fetchDosen();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyimpan"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dosen/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Dosen berhasil dihapus");
      fetchDosen();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menghapus"); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Dosen</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data dosen dan mata kuliah</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Tambah Dosen</Button>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari dosen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : dosenList.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">Belum ada data dosen</p>
        </CardContent></Card>
      ) : (
        <motion.div variants={item} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dosenList.map((d) => (
            <Card key={d.id} className="group hover:border-primary/20 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{d.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(d.id)} className="hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {d.whatsapp && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{d.whatsapp}</div>}
                {d.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{d.email}</div>}
                {d.consultHours && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{d.consultHours}</div>}
                {d.courses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.courses.map((c) => <Badge key={c.id} variant="secondary" className="text-[10px]">{c.name}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDosen ? "Edit Dosen" : "Tambah Dosen"}</DialogTitle>
            <DialogDescription>Isi informasi dosen</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama</Label><Input placeholder="Nama dosen" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>No. WhatsApp</Label><Input placeholder="08xxxxxxxxxx" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="dosen@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Jam Konsultasi</Label><Input placeholder="Senin 10:00-12:00" value={form.consultHours} onChange={(e) => setForm({ ...form, consultHours: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
