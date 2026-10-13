"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import {
  Download,
  FileText,
  FileImage,
  FileArchive,
  File,
  Loader2,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SharedFileInfo {
  name: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  sharedBy: string;
  createdAt: string;
}

function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  if (fileType.startsWith("image/")) return <FileImage className={className} />;
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("word"))
    return <FileText className={className} />;
  if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("archive"))
    return <FileArchive className={className} />;
  return <File className={className} />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
}

export default function DriveSharePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [file, setFile] = useState<SharedFileInfo | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchFile() {
      try {
        const res = await fetch(`/api/drive/share/${id}`);
        const data = await res.json();
        if (data.success) {
          setFile(data.data);
        } else {
          setError(data.error || "File tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat file");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchFile();
  }, [id]);

  const handleDownload = async () => {
    if (!file) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/drive/share/${id}?download=true`);
      if (!res.ok) throw new Error("Download gagal");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      setError("Download gagal. Coba lagi nanti.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Memuat file...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">File Tidak Ditemukan</h1>
          <p className="text-sm text-slate-400 mb-6">
            {error || "Link share ini sudah tidak aktif atau file telah dihapus."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <RuangKetuaLogo size={24} />
            Buka Ruang Ketua
          </Link>
        </motion.div>
      </div>
    );
  }

  const ext = getExtension(file.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <RuangKetuaLogo size={36} />
            <div>
              <h2 className="text-sm font-bold text-white">Ruang Ketua</h2>
              <p className="text-[10px] text-slate-400">Cloud Files Sharing</p>
            </div>
          </div>
        </div>

        {/* File info */}
        <div className="p-6">
          {/* File card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-5">
            <div className="shrink-0 p-3 rounded-xl bg-indigo-500/10">
              <FileTypeIcon fileType={file.fileType} className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-white truncate">{file.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {ext}
                </span>
                <span className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</span>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Dibagikan oleh</span>
              <span className="text-white font-medium ml-auto">{file.sharedBy}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Tanggal upload</span>
              <span className="text-white font-medium ml-auto">
                {formatDate(file.createdAt)}
              </span>
            </div>
          </div>

          {/* Download button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download File
              </>
            )}
          </motion.button>

          {/* Preview for images */}
          {file.fileType.startsWith("image/") && (
            <div className="mt-5 rounded-xl overflow-hidden border border-slate-700/50">
              { }
              <img
                src={file.fileUrl}
                alt={file.name}
                className="w-full h-auto max-h-[300px] object-contain bg-slate-800"
              />
            </div>
          )}

          {/* Preview for documents/pdfs/videos */}
          {!file.fileType.startsWith("image/") &&
            (file.fileType.includes("pdf") ||
              file.fileType.includes("document") ||
              file.fileType.includes("word") ||
              file.fileType.includes("presentation") ||
              file.fileType.includes("spreadsheet") ||
              file.fileType.startsWith("video/")) &&
            file.fileUrl.includes("google.com") && (
              <div className="mt-5 rounded-xl overflow-hidden border border-slate-700/50 aspect-[16/9] relative bg-slate-800">
                <iframe
                  src={file.fileUrl.replace(/\/(view|edit)(\?.*)?$/, "/preview")}
                  title={file.name}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; fullscreen"
                />
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50">
          <p className="text-center text-[10px] text-slate-500">
            Dibagikan melalui Ruang Ketua — Dashboard Ketua Kelas
          </p>
        </div>
      </motion.div>
    </div>
  );
}
