"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, Eye, Save, X,
  Sparkles, ListChecks, ListOrdered, Quote, ImageIcon, Lightbulb, Flag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  coverEmoji: string | null;
  status: string;
  readingTime: string | null;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
};

const TEMPLATES: { label: string; icon: LucideIcon; snippet: string }[] = [
  {
    label: "Pengantar",
    icon: Flag,
    snippet:
      "\n## Apa itu [Topik]?\n\n[Jelaskan secara singkat apa itu [Topik] dan mengapa ini penting bagi Ketua Kelas.]\n",
  },
  {
    label: "Daftar Fitur",
    icon: ListChecks,
    snippet:
      "\n## Fitur Utama\n\n- **[Nama Fitur]** â€” [Penjelasan singkat keunggulan fitur ini.]\n- **[Nama Fitur]** â€” [Penjelasan singkat keunggulan fitur ini.]\n- **[Nama Fitur]** â€” [Penjelasan singkat keunggulan fitur ini.]\n",
  },
  {
    label: "Langkah-langkah",
    icon: ListOrdered,
    snippet:
      "\n## Cara Menggunakannya\n\n1. [Langkah pertama yang perlu dilakukan.]\n2. [Langkah kedua.]\n3. [Langkah ketiga.]\n",
  },
  {
    label: "Tips & Trik",
    icon: Lightbulb,
    snippet:
      "\n## Tips & Trik\n\n> **Tips:** [Tuliskan tips praktis yang bisa langsung diterapkan oleh pembaca.]\n",
  },
  {
    label: "Quote",
    icon: Quote,
    snippet:
      "\n> [Tuliskan kutipan atau pesan penting yang ingin disorot.]\n",
  },
  {
    label: "Gambar",
    icon: ImageIcon,
    snippet:
      "\n![Deskripsi gambar](https://link-gambar.jpg)\n",
  },
];

const markdownClass =
  "space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-1 [&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:marker:text-primary [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:rounded-xl [&_img]:border [&_img]:border-border";

export function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Umum",
    coverEmoji: "",
    readingTime: "",
    excerpt: "",
    status: "draft",
    content: "",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", { cache: "no-store" });
      const d = await res.json();
      if (d.success) setPosts(d.data);
    } catch {
      toast.error("Gagal memuat artikel");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ title: "", slug: "", category: "Umum", coverEmoji: "", readingTime: "", excerpt: "", status: "draft", content: "" });
    setEditingId(null);
    setPreview(false);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  async function openEdit(p: Post) {
    resetForm();
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      category: p.category,
      coverEmoji: p.coverEmoji || "",
      readingTime: p.readingTime || "",
      excerpt: p.excerpt || "",
      status: p.status,
      content: p.content,
    });
    setOpen(true);
  }

  function insertTemplate(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: f.content + snippet }));
      return;
    }
    const start = el.selectionStart ?? form.content.length;
    const end = el.selectionEnd ?? form.content.length;
    const next = form.content.slice(0, start) + snippet + form.content.slice(end);
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Judul dan konten wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/blog/${editingId}` : "/api/admin/blog";
      const payload = {
        ...form,
        slug: form.slug.trim() || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!d.success) {
        toast.error(d.error || "Gagal menyimpan");
        return;
      }
      toast.success(editingId ? "Artikel diperbarui" : "Artikel dibuat");
      setOpen(false);
      resetForm();
      load();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Post) {
    setDeleteTarget(p);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog/${deleteTarget.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) return toast.error(d.error || "Gagal menghapus");
      toast.success("Artikel dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Artikel Blog</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Buat, edit, dan hapus draft artikel internal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tulis Artikel
          </Button>
        </div>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left">Judul</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Diperbarui</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">Memuatâ€¦</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                Belum ada artikel. Klik â€œTulis Artikelâ€ untuk memulai.
              </td></tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <span>{p.coverEmoji || "ðŸ“„"}</span>
                      <span className="line-clamp-1">{p.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">
                    {p.status === "published" ? (
                      <Badge variant="success">Publikasi</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p)} title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{editingId ? "Edit Artikel" : "Tulis Artikel Baru"}</DialogTitle>
            <DialogDescription>
              Gunakan template di bawah untuk menyusun artikel yang rapi dan profesional.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mis. Kenali Ruang Ketua" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug URL</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto dari judul" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Kategori</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Pengantar" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emoji">Emoji Sampul</Label>
                <Input id="emoji" value={form.coverEmoji} onChange={(e) => setForm((f) => ({ ...f, coverEmoji: e.target.value }))} placeholder="ðŸ‘‹" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rt">Waktu Baca</Label>
                <Input id="rt" value={form.readingTime} onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))} placeholder="4 menit baca" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="excerpt">Ringkasan (excerpt)</Label>
                <Textarea id="excerpt" className="min-h-[60px]" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Deskripsi singkat untuk kartu artikel" />
              </div>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Template Penulisan
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => insertTemplate(t.snippet)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="inline-flex rounded-lg border border-border p-0.5">
                {(["draft", "published"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                      form.status === s
                        ? s === "published"
                          ? "bg-green-500/15 text-green-500"
                          : "bg-yellow-500/15 text-yellow-500"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s === "published" ? "Publikasi" : "Draft"}
                  </button>
                ))}
              </div>
            </div>

            {/* Content + preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Konten (Markdown)</Label>
                <Button size="sm" variant="outline" onClick={() => setPreview((p) => !p)} className="h-7 gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> {preview ? "Edit" : "Pratinjau"}
                </Button>
              </div>

              {preview ? (
                <div className={cn("min-h-[300px] rounded-lg border border-border bg-background p-6", markdownClass)}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{form.content || "_Belum ada konten_"}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  ref={textareaRef}
                  className="min-h-[320px] font-mono text-[13px] leading-relaxed"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder={"Tulis artikel dalam format Markdownâ€¦\n\n## Heading\nTeks **tebal**, *miring*, dan daftar."}
                />
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>
              <X className="h-4 w-4" /> Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Menyimpanâ€¦" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={`Hapus artikel "${deleteTarget?.title}"?`}
        description="Artikel ini akan dihapus secara permanen dan tidak dapat dikembalikan."
        confirmLabel="Hapus Artikel"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
