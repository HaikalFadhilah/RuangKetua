"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Image,
  FileArchive,
  File,
  Download,
  Trash2,
  Edit3,
  Loader2,
  Search,
  Share2,
  Link,
  Copy,
  Check,
  Link2Off,
  Globe,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

interface SharedFile {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  shareToken?: string | null;
  isPublic?: boolean;
  createdAt: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg")) return <Image className="h-5 w-5 text-orange-400" />;
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return <FileArchive className="h-5 w-5 text-purple-400" />;
  if (type.includes("doc") || type.includes("word")) return <FileText className="h-5 w-5 text-blue-400" />;
  if (type.includes("ppt") || type.includes("presentation")) return <FileText className="h-5 w-5 text-orange-500" />;
  if (type.includes("xls") || type.includes("sheet")) return <FileText className="h-5 w-5 text-green-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function getFileColor(type: string) {
  if (type.includes("pdf")) return "bg-red-500/10";
  if (type.includes("image") || type.includes("png") || type.includes("jpg")) return "bg-orange-500/10";
  if (type.includes("zip") || type.includes("rar")) return "bg-purple-500/10";
  if (type.includes("doc") || type.includes("word")) return "bg-blue-500/10";
  if (type.includes("ppt")) return "bg-orange-500/10";
  if (type.includes("xls")) return "bg-green-500/10";
  return "bg-muted";
}

export default function FilesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<SharedFile | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.success) setFiles(data.data);
    } catch { toast.error("Gagal mengambil file"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} melebihi 10MB`); continue; }
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/files", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }
      toast.success(`${fileList.length} file berhasil diupload`);
      fetchFiles();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal mengupload"); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    try {
      const res = await fetch(`/api/files/${renameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("File berhasil direname");
      setRenameId(null);
      fetchFiles();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal rename"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/files/${deleteId}`, { method: "DELETE" });
      toast.success("File berhasil dihapus");
      setDeleteId(null);
      fetchFiles();
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleShare = async (file: SharedFile) => {
    // Kalau udah punya share link, langsung tampilkan
    if (file.shareToken && file.isPublic) {
      const link = `${window.location.origin}/share/${file.shareToken}`;
      setShareFile(file);
      setShareLink(link);
      setCopied(false);
      return;
    }

    // Generate share link baru
    setIsSharing(true);
    setShareFile(file);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const link = `${window.location.origin}/share/${data.data.shareToken}`;
      setShareLink(link);
      setCopied(false);
      fetchFiles();
      toast.success("Share link berhasil dibuat!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat share link");
      setShareFile(null);
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async () => {
    if (!shareFile) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/files/${shareFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unshare" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Share link dihapus");
      setShareFile(null);
      setShareLink("");
      fetchFiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus share link");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);
  const sharedCount = files.filter((f) => f.isPublic && f.shareToken).length;
  const typeCounts = files.reduce((acc, f) => {
    const key = f.fileType.includes("pdf") ? "PDF" : f.fileType.includes("image") || f.fileType.includes("png") || f.fileType.includes("jpg") ? "Image" : f.fileType.includes("doc") ? "DOC" : "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Sharing</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload dan bagikan file kelas via link</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload File
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><FileText className="h-5 w-5 text-blue-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total File</p><p className="text-lg font-bold">{files.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><Globe className="h-5 w-5 text-green-400" /></div>
          <div><p className="text-xs text-muted-foreground">Dibagikan</p><p className="text-lg font-bold">{sharedCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10"><Share2 className="h-5 w-5 text-purple-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total Size</p><p className="text-lg font-bold">{formatFileSize(totalSize)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10"><FileText className="h-5 w-5 text-red-400" /></div>
          <div><p className="text-xs text-muted-foreground">PDF</p><p className="text-lg font-bold">{typeCounts["PDF"] || 0}</p></div>
        </CardContent></Card>
      </motion.div>

      {/* Upload Zone */}
      <motion.div variants={item}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Drag & drop file ke sini, atau klik untuk upload</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Maks 10MB per file • PDF, DOC, PPT, XLS, ZIP, gambar</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari file..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </motion.div>

      {/* File List */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Share2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">{search ? "File tidak ditemukan" : "Belum ada file"}</p>
          <p className="text-sm text-muted-foreground mt-1">{search ? "Coba kata kunci lain" : "Upload file untuk mulai berbagi"}</p>
        </CardContent></Card>
      ) : (
        <motion.div variants={item} className="space-y-2">
          {filtered.map((f) => (
            <Card key={f.id} className="group hover:border-primary/20 transition-all">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${getFileColor(f.fileType)}`}>
                    {getFileIcon(f.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      {f.isPublic && f.shareToken && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                          <Globe className="h-2.5 w-2.5" />
                          Shared
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(f.fileSize)}</span>
                      <span>{formatDate(f.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Share button */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleShare(f)}
                      className={f.isPublic && f.shareToken ? "text-green-400 hover:text-green-300" : "hover:text-primary"}
                      title="Bagikan via link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    {/* Download */}
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={f.fileUrl} download={f.name} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                    </Button>
                    {/* Rename */}
                    <Button variant="ghost" size="icon-sm" onClick={() => { setRenameId(f.id); setRenameName(f.name); }}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    {/* Delete */}
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(f.id)} className="hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Share Dialog */}
      <Dialog open={!!shareFile} onOpenChange={(o) => { if (!o) { setShareFile(null); setShareLink(""); setCopied(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Bagikan File
            </DialogTitle>
            <DialogDescription>
              Siapapun dengan link ini bisa download file tanpa login
            </DialogDescription>
          </DialogHeader>

          {shareFile && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                <div className={`p-2 rounded-lg shrink-0 ${getFileColor(shareFile.fileType)}`}>
                  {getFileIcon(shareFile.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{shareFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(shareFile.fileSize)}</p>
                </div>
              </div>

              {/* Share link */}
              {isSharing ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Membuat link...</span>
                </div>
              ) : shareLink ? (
                <div className="space-y-3">
                  {/* Link display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/50 border border-border">
                      <Link className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground truncate font-mono">{shareLink}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCopyLink}
                      className={`shrink-0 min-w-[90px] ${copied ? "bg-green-600 hover:bg-green-600" : ""}`}
                    >
                      {copied ? (
                        <><Check className="h-3.5 w-3.5" /> Disalin!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Salin</>
                      )}
                    </Button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
                    <Globe className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Link aktif — siapapun bisa download</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {shareLink && (
              <Button
                variant="outline"
                onClick={handleUnshare}
                disabled={isSharing}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Link2Off className="h-4 w-4" />
                Hapus Link
              </Button>
            )}
            <Button variant="outline" onClick={() => { setShareFile(null); setShareLink(""); setCopied(false); }}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameId} onOpenChange={(o) => { if (!o) setRenameId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Masukkan nama baru untuk file</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nama File</Label>
            <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>Batal</Button>
            <Button onClick={handleRename}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus File?</DialogTitle>
            <DialogDescription>File yang dihapus tidak dapat dikembalikan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
