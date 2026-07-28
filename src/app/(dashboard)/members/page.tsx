"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { container, item } from "@/lib/animations";
import { Users, Plus, Loader2, Trash2, Search, MoreVertical, Edit2, ScanText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ClassMember = {
  id: string;
  nim: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  memberType: string;
  revisiCourses: string | null;
};

import DashboardShell from "@/components/layout/dashboard-shell";

export default function MembersPage() {
  const { t } = useI18n();
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, REGULER, REVISIAN
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nim: "", phone: "", email: "", memberType: "REGULER", revisiCourses: "" });
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // OCR state
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      toast.error("Gagal memuat buku induk kelas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Nama wajib diisi!");
    
    setSubmitting(true);
    try {
      const isEdit = !!editId;
      const res = await fetch("/api/members", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Anggota berhasil diperbarui" : "Anggota berhasil ditambahkan");
        setIsAddOpen(false);
        setIsEditOpen(false);
        setEditId(null);
        setForm({ name: "", nim: "", phone: "", email: "", memberType: "REGULER", revisiCourses: "" });
        fetchMembers();
      } else {
        toast.error(data.error || "Gagal menyimpan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (m: ClassMember) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      nim: m.nim || "",
      phone: m.phone || "",
      email: m.email || "",
      memberType: m.memberType || "REGULER",
      revisiCourses: m.revisiCourses || ""
    });
    setIsEditOpen(true);
  };

  const handleOcrSubmit = async () => {
    if (!ocrText.trim()) return toast.error("Teks OCR kosong!");
    setOcrScanning(true);
    try {
      const res = await fetch("/api/ai/ocr-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Bulk insert via promises
        let count = 0;
        for (const m of data.data) {
          const insertRes = await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: m.name, nim: m.nim, memberType: "REGULER" })
          });
          if (insertRes.ok) count++;
        }
        toast.success(`${count} anggota berhasil diimport dari OCR`);
        setIsOcrOpen(false);
        setOcrText("");
        fetchMembers();
      } else {
        toast.error("Gagal membaca format OCR");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan OCR");
    } finally {
      setOcrScanning(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/members?id=${deleteTarget}`, { method: "DELETE" });
      toast.success("Anggota dihapus");
      setMembers(prev => prev.filter(m => m.id !== deleteTarget));
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteOpen(false);
    setDeleting(true);
    try {
      await fetch(`/api/members?bulkIds=${selectedIds.join(",")}`, { method: "DELETE" });
      toast.success(`${selectedIds.length} anggota dihapus`);
      setSelectedIds([]);
      fetchMembers();
    } catch {
      toast.error("Gagal menghapus massal");
    } finally {
      setDeleting(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || (m.nim && m.nim.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "ALL" ? true : m.memberType === filterType;
    return matchSearch && matchType;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Absen Kelas</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar hadir teman sekelas untuk integrasi Spreadsheet & WA Broadcast otomatis.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setIsOcrOpen(true)} className="gap-2">
            <ScanText className="h-4 w-4" />
            Scan Absen
          </Button>
          <Button onClick={() => { setEditId(null); setForm({ name: "", nim: "", phone: "", email: "", memberType: "REGULER", revisiCourses: "" }); setIsAddOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Anggota
          </Button>
        </div>
      </motion.div>

      <Card className="border-border/60">
        <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau NIM..." 
                className="pl-9 h-9 text-sm bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">Semua Tipe</option>
              <option value="REGULER">Mahasiswa Reguler</option>
              <option value="REVISIAN">Non-Reguler</option>
            </select>
          </div>
          {selectedIds.length > 0 && (
            <Button size="sm" variant="destructive" className="h-9 gap-2" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Hapus {selectedIds.length} Data
            </Button>
          )}
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3 w-[40px]">
                    <Checkbox 
                      checked={members.length > 0 && selectedIds.length === members.length}
                      onCheckedChange={(c) => setSelectedIds(c ? members.map(m => m.id) : [])}
                    />
                  </th>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">No. WhatsApp</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p>Belum ada data anggota kelas.</p>
                      <p className="text-xs mt-1">Data ini digunakan untuk mengisi otomatis Google Sheets & Broadcast.</p>
                    </td>
                  </tr>
                ) : (
                   filteredMembers.map(m => (
                    <tr key={m.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox 
                          checked={selectedIds.includes(m.id)}
                          onCheckedChange={(c) => setSelectedIds(prev => c ? [...prev, m.id] : prev.filter(id => id !== m.id))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {m.name}
                        {m.memberType === "REVISIAN" && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 text-[9px] font-bold tracking-wider uppercase border border-orange-500/20">
                              Non-Reguler
                            </span>
                            {m.revisiCourses && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={m.revisiCourses}>
                                • {m.revisiCourses}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{m.nim || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(m)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tambah */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota Kelas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>NIM / No. Mahasiswa</Label>
              <Input placeholder="1234567890" value={form.nim} onChange={e => setForm({...form, nim: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp (Opsional)</Label>
              <Input placeholder="62812..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <p className="text-[10px] text-muted-foreground">Isi nomor ini jika ingin diintegrasikan dengan fitur WA Broadcast penagihan.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Tipe Anggota</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.memberType}
                onChange={e => setForm({...form, memberType: e.target.value})}
              >
                <option value="REGULER">Mahasiswa Reguler (Anggota Tetap)</option>
                <option value="REVISIAN">Mahasiswa Non-Reguler (Mengulang / Lintas Angkatan)</option>
              </select>
            </div>

            {form.memberType === "REVISIAN" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                <Label>Mata Kuliah Revisi <span className="text-destructive">*</span></Label>
                <Input placeholder="Kalkulus, Fisika Dasar (pisahkan dengan koma)" value={form.revisiCourses} onChange={e => setForm({...form, revisiCourses: e.target.value})} required />
              </motion.div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Anggota Kelas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>NIM / No. Mahasiswa</Label>
              <Input placeholder="1234567890" value={form.nim} onChange={e => setForm({...form, nim: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp (Opsional)</Label>
              <Input placeholder="62812..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <p className="text-[10px] text-muted-foreground">Isi nomor ini jika ingin diintegrasikan dengan fitur WA Broadcast penagihan.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Tipe Anggota</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.memberType}
                onChange={e => setForm({...form, memberType: e.target.value})}
              >
                <option value="REGULER">Mahasiswa Reguler (Anggota Tetap)</option>
                <option value="REVISIAN">Mahasiswa Non-Reguler (Mengulang / Lintas Angkatan)</option>
              </select>
            </div>

            {form.memberType === "REVISIAN" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                <Label>Mata Kuliah Revisi <span className="text-destructive">*</span></Label>
                <Input placeholder="Kalkulus, Fisika Dasar (pisahkan dengan koma)" value={form.revisiCourses} onChange={e => setForm({...form, revisiCourses: e.target.value})} required />
              </motion.div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog OCR */}
      <Dialog open={isOcrOpen} onOpenChange={setIsOcrOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import via Scan Absen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Paste teks hasil foto daftar hadir, Excel, atau KTM di sini. AI akan otomatis mengekstrak nama dan NIM menjadi anggota baru.
            </p>
            <div className="space-y-2">
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Contoh:&#10;1. 2021001 - Budi Santoso&#10;2. 2021002 - Siti Nurhaliza&#10;3. Andi Pratama"
                value={ocrText}
                onChange={e => setOcrText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOcrOpen(false)}>Batal</Button>
            <Button onClick={handleOcrSubmit} disabled={ocrScanning || !ocrText.trim()} className="gap-2 bg-primary">
              {ocrScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
              {ocrScanning ? "Memindai Teks..." : "Mulai Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete single */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus anggota ini?"
        description="Data anggota akan dihapus permanen dari Buku Absen Kelas dan tidak dapat dikembalikan."
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {/* Confirm bulk delete */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Hapus ${selectedIds.length} anggota sekaligus?`}
        description="Semua anggota yang dipilih akan dihapus permanen dari Buku Absen Kelas."
        confirmLabel={`Hapus ${selectedIds.length} Anggota`}
        loading={deleting}
        onConfirm={handleBulkDelete}
      />
    </motion.div>
  );
}