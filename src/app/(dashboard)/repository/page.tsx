"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  Upload,
  FileText,
  Presentation,
  FileArchive,
  ChevronRight,
  Download,
  Trash2,
  Search,
  BookOpen,
  Loader2,
  ArrowLeft,
  File,
  Image,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  code: string | null;
}

interface RepoFile {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  courseId: string | null;
  createdAt: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
  if (type.includes("image") || type.includes("png") || type.includes("jpg")) return <Image className="h-5 w-5 text-orange-400" />;
  if (type.includes("ppt") || type.includes("presentation")) return <Presentation className="h-5 w-5 text-orange-500" />;
  if (type.includes("doc") || type.includes("word")) return <FileText className="h-5 w-5 text-blue-400" />;
  if (type.includes("zip") || type.includes("rar")) return <FileArchive className="h-5 w-5 text-green-400" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

export default function RepositoryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch courses (as folders)
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) {
        setCourses(data.data || []);
      } else {
        // Fallback: extract from dosen
        const resDosen = await fetch("/api/dosen");
        const dataDosen = await resDosen.json();
        if (dataDosen.success) {
          const courseSet = new Map<string, Course>();
          (dataDosen.data || []).forEach((d: { courses?: Course[] }) => {
            d.courses?.forEach((c: Course) => courseSet.set(c.id, c));
          });
          setCourses(Array.from(courseSet.values()));
        }
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  // Fetch files - optionally filtered by courseId
  const fetchFiles = useCallback(async (courseId?: string) => {
    try {
      const url = courseId ? `/api/files?courseId=${courseId}` : "/api/files";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setFiles(data.data || []);
    } catch { /* silent */ }
  }, []);

  // Fetch file counts per course
  const fetchFileCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.success) {
        const counts: Record<string, number> = {};
        (data.data || []).forEach((f: RepoFile) => {
          if (f.courseId) {
            counts[f.courseId] = (counts[f.courseId] || 0) + 1;
          }
        });
        setFileCounts(counts);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCourses(); fetchFileCounts(); }, [fetchCourses, fetchFileCounts]);

  useEffect(() => {
    if (selectedCourse) {
      fetchFiles(selectedCourse.id);
    } else {
      fetchFiles();
    }
  }, [selectedCourse, fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} melebihi 10MB`); continue; }
        const formData = new FormData();
        formData.append("file", f);
        if (selectedCourse) formData.append("courseId", selectedCourse.id);
        const res = await fetch("/api/files", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }
      toast.success("Materi berhasil diupload");
      fetchFiles(selectedCourse?.id);
      fetchFileCounts();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal upload"); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      toast.success("File dihapus");
      fetchFiles(selectedCourse?.id);
      fetchFileCounts();
    } catch { toast.error("Gagal menghapus"); }
  };

  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedCourse && (
            <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedCourse(null); setSearch(""); }}><ArrowLeft className="h-4 w-4" /></Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedCourse ? selectedCourse.name : "Repository Materi"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {selectedCourse ? `Materi untuk ${selectedCourse.code || selectedCourse.name}` : "Kelola materi kuliah berdasarkan mata kuliah"}
            </p>
          </div>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {selectedCourse ? "Upload ke Folder" : "Upload Materi"}
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip,.rar,.mp4,.webm,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv" onChange={(e) => handleUpload(e.target.files)} />
      </motion.div>

      {!selectedCourse ? (
        <>
          {/* Course folders */}
          <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
            {courses.length > 0 ? courses.map((c) => (
              <Card key={c.id} className="group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setSelectedCourse(c)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <div className="flex items-center gap-2">
                        {c.code && <p className="text-xs text-muted-foreground">{c.code}</p>}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {fileCounts[c.id] || 0} file
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">Belum ada mata kuliah</p>
                  <p className="text-xs text-muted-foreground mt-1">Tambahkan dosen dengan mata kuliah di halaman Dosen</p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* All files (unassigned) */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Semua File ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari file..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">{search ? "File tidak ditemukan" : "Belum ada file"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.slice(0, 20).map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 group hover:border-primary/20 transition-all">
                        {getFileIcon(f.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(f.fileSize)}</span>
                            <span>{formatDate(f.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a href={f.fileUrl} download={f.name}><Download className="h-3.5 w-3.5" /></a>
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(f.id)} className="hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        /* Inside a course folder */
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari materi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              {filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-lg font-medium">Folder kosong</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload materi untuk mata kuliah ini</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />Upload Materi
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 group hover:border-primary/20 transition-all">
                      {getFileIcon(f.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(f.fileSize)}</span>
                          <span>{formatDate(f.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a href={f.fileUrl} download={f.name}><Download className="h-3.5 w-3.5" /></a>
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(f.id)} className="hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
