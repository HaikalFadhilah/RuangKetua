"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Cloud,
  Folder,
  ChevronRight,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  FileText,
  ArrowLeft,
  FolderPlus,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Star,
  Pencil,
  Image as ImageIcon,
  FileArchive,
  HardDrive,
  MoreHorizontal,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  MessageCircle,
  X,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

interface DriveAccount {
  id: string;
  email: string | null;
  provider: string;
  quotaTotal: string | null;
  quotaUsed: string | null;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

interface DriveFile {
  id: string;
  dbId: string;
  name: string;
  mimeType: string;
  size: number;
  isFolder: boolean;
  starred: number;
  isShared: boolean;
  parentId: string | null;
  thumbnailLink?: string | null;
  webViewLink?: string | null;
  modifiedTime: string;
  createdTime?: string | null;
  accountId: string;
  accountEmail?: string | null;
}

interface StorageSummary {
  totalSpace: number;
  usedSpace: number;
}

type FilterView = "list" | "recent" | "starred";

function getDriveFileIcon(mime: string, isFolder: boolean, size = "h-6 w-6") {
  if (isFolder) return <Folder className={`${size} text-primary`} />;
  if (mime.includes("pdf")) return <FileText className={`${size} text-red-400`} />;
  if (mime.includes("image")) return <ImageIcon className={`${size} text-orange-400`} />;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z"))
    return <FileArchive className={`${size} text-violet-400`} />;
  if (mime.includes("word") || mime.includes("document")) return <FileText className={`${size} text-blue-400`} />;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return <FileText className={`${size} text-orange-500`} />;
  if (mime.includes("sheet") || mime.includes("excel")) return <FileText className={`${size} text-green-500`} />;
  if (mime.includes("audio")) return <FileText className={`${size} text-pink-400`} />;
  if (mime.includes("video")) return <FileText className={`${size} text-cyan-400`} />;
  return <FileText className={`${size} text-muted-foreground`} />;
}

function getDriveFileBg(mime: string, isFolder: boolean) {
  if (isFolder) return "bg-primary/10";
  if (mime.includes("pdf")) return "bg-red-500/10";
  if (mime.includes("image")) return "bg-orange-500/10";
  if (mime.includes("zip") || mime.includes("rar")) return "bg-violet-500/10";
  if (mime.includes("word") || mime.includes("document")) return "bg-blue-500/10";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "bg-orange-500/10";
  if (mime.includes("sheet") || mime.includes("excel")) return "bg-green-500/10";
  return "bg-muted";
}

export default function FileBrowser() {
  const { t } = useI18n();

  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storage, setStorage] = useState<StorageSummary | null>(null);

  const [previewTarget, setPreviewTarget] = useState<DriveFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DriveFile | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Share link
  const [shareTarget, setShareTarget] = useState<DriveFile | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const [filterView, setFilterView] = useState<FilterView>("recent");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Spreadsheet Template state — removed (moved to /spreadsheets page)

  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInitialSync = useRef(false);

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch("/api/drive/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
        setSelectedAccountId((prev) =>
          prev && data.data.some((a: DriveAccount) => a.id === prev)
            ? prev : (data.data[0]?.id || null)
        );
      }
    } catch { toast.error(t("drive.loadAccountsFailed")); }
    finally { setAccountsLoading(false); }
  }, [t]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const effectiveView = search.trim() ? "search" : filterView;

  const loadFiles = useCallback(async () => {
    if (!selectedAccountId) return;
    setFilesLoading(true);
    try {
      const params = new URLSearchParams({ accountId: selectedAccountId, view: effectiveView });
      const fid = folderStack[folderStack.length - 1];
      if (effectiveView === "list" && fid.id !== "root") params.set("folderId", fid.id);
      if (effectiveView === "search") params.set("q", search.trim());
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/drive/files?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setFiles(data.data.files || []); setStorage(data.data.storage || null); }
      else toast.error(data.error || t("drive.loadFilesFailed"));
    } catch { toast.error(t("drive.loadFilesFailed")); }
    finally { setFilesLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, effectiveView, folderStack, search, t]);

  const doSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/drive/sync", { method: "POST" });
      await fetchAccounts();
      await loadFiles();
      toast.success(t("drive.syncDone"));
    } catch { toast.error(t("drive.syncFailed")); }
    finally { setSyncing(false); }
  }, [fetchAccounts, loadFiles, t]);

  // Constant-length [loadFiles] dep — avoids HMR size-change error
  useEffect(() => {
    if (!selectedAccountId) return;
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc && !acc.lastSyncedAt && !didInitialSync.current) {
      didInitialSync.current = true; doSync();
    } else { loadFiles(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFiles]);

  const selectAccount = (id: string) => {
    setSelectedAccountId(id);
    setFolderStack([{ id: "root", name: "My Drive" }]);
    setSelected(new Set());
    didInitialSync.current = false;
  };
  const openFolder = (f: DriveFile) => { setFolderStack((s) => [...s, { id: f.id, name: f.name }]); setSelected(new Set()); };
  const goToFolder = (i: number) => { setFolderStack((s) => s.slice(0, i + 1)); setSelected(new Set()); };
  const openItem = (f: DriveFile) => { 
    if (f.isFolder) {
      openFolder(f); 
    } else {
      setPreviewTarget(f);
    }
  };
  const downloadFile = (f: DriveFile) => window.open(`/api/drive/files/${f.id}/download?accountId=${f.accountId}`, "_blank");

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !selectedAccountId) return;
    setUploading(true);
    try {
      const fid = folderStack[folderStack.length - 1];
      const parentId = effectiveView === "list" && fid.id !== "root" ? fid.id : undefined;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // 1. Minta tiket (Session URL) dari server kita
        const sessionRes = await fetch("/api/drive/upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
            accountId: selectedAccountId,
            folderId: parentId,
            auto: false
          })
        });
        
        const sessionData = await sessionRes.json();
        if (!sessionData.success) throw new Error(sessionData.error);
        const { sessionUri, accountId: targetAccountId } = sessionData.data;

        // 2. Direct Upload ke Google Drive pakai Session URI (Bypass server RAM!)
        const uploadRes = await fetch(sessionUri, {
          method: "PUT",
          headers: {
            "Content-Length": file.size.toString(),
          },
          body: file
        });

        if (!uploadRes.ok) throw new Error(`Google Drive Upload Failed: ${uploadRes.statusText}`);
        const driveData = await uploadRes.json();

        // 3. Konfirmasi ke server lokal bahwa file berhasil di-upload
        const confirmRes = await fetch("/api/drive/upload-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: targetAccountId,
            fileId: driveData.id,
            repoUpload: false
          })
        });

        const confirmData = await confirmRes.json();
        if (!confirmData.success) throw new Error(confirmData.error);
      }

      toast.success(t("drive.uploadSuccess")); 
      loadFiles();
    } catch (err) { 
      toast.error(err instanceof Error ? err.message : t("drive.uploadFailed")); 
    } finally { 
      setUploading(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedAccountId) return;
    setCreatingFolder(true);
    try {
      const fid = folderStack[folderStack.length - 1];
      const res = await fetch("/api/drive/folders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId, name: newFolderName.trim(), parentId: effectiveView === "list" && fid.id !== "root" ? fid.id : undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("drive.folderCreated")); setNewFolderOpen(false); setNewFolderName(""); loadFiles();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("drive.folderFailed")); }
    finally { setCreatingFolder(false); }
  };

  const handleDeleteFile = async () => {
    if (!confirmDelete || !selectedAccountId) return;

    const fileIdToDelete = confirmDelete.id;
    const accountId = selectedAccountId;

    // 1. Hapus file dari list dulu, LALU tutup dialog — biar animasi dialog
    //    tidak blocking render list yang sudah bersih
    setFiles(prev => prev.filter(f => f.id !== fileIdToDelete));
    requestAnimationFrame(() => setConfirmDelete(null));

    // 2. Fire-and-forget ke server di background
    fetch(`/api/drive/files?${new URLSearchParams({ accountId, fileId: fileIdToDelete })}`, { method: "DELETE" })
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error);
        toast.success(t("drive.fileDeleted"));
      })
      .catch(err => {
        toast.error(err instanceof Error ? err.message : t("drive.deleteFailed"));
        loadFiles(); // kembalikan file jika gagal
      });
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/drive/files/${renameTarget.id}/rename`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim(), accountId: renameTarget.accountId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("drive.renamed")); setRenameTarget(null); setRenameName(""); loadFiles();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("drive.renameFailed")); }
    finally { setRenaming(false); }
  };

  const handleStar = async (f: DriveFile) => {
    try {
      const res = await fetch(`/api/drive/files/${f.id}/star`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: f.accountId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadFiles();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("drive.starFailed")); }
  };

  // Share link — use local app API with short dbId
  const handleShare = async (f: DriveFile) => {
    setGeneratingLink(true);
    setShareTarget(f);
    
    try {
      const res = await fetch("/api/drive/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbId: f.dbId })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || t("drive.shareFailed"));
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const localLink = `${origin}/drive/share/${data.data.token}`;
      setShareLink(localLink);
      setCopied(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("drive.shareFailed"));
      setShareTarget(null);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); toast.success(t("drive.linkCopied")); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error(t("drive.copyFailed")); }
  };

  const shareToChat = () => {
    if (!shareTarget || !shareLink) return;
    const msg = encodeURIComponent(`📎 ${shareTarget.name}\n${shareLink}`);
    window.open(`/whatsapp?prefill=${msg}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const isAllSelected = files.length > 0 && files.every((f) => selected.has(f.id));
  const toggleSelectAll = () => setSelected((prev) => files.length > 0 && files.every((f) => prev.has(f.id)) ? new Set() : new Set(files.map((f) => f.id)));

  // ── Context menu (3-dot) items ──
  const FileMenu = ({ f }: { f: DriveFile }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" size="icon-sm"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {f.isFolder ? (
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); openFolder(f); }}>
            <Folder className="h-4 w-4 mr-2" /> {t("drive.openFolder")}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); downloadFile(f); }}>
              <Download className="h-4 w-4 mr-2" /> {t("drive.download")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleShare(f); }}>
              <Share2 className="h-4 w-4 mr-2" /> {t("drive.shareLink")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStar(f); }}>
          <Star className={`h-4 w-4 mr-2 ${f.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {f.starred ? t("drive.unstar") : t("drive.star")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRenameTarget(f); setRenameName(f.name); }}>
          <Pencil className="h-4 w-4 mr-2" /> {t("drive.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setConfirmDelete(f); }}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="h-4 w-4 mr-2" /> {t("action.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const FileContextMenu = ({ f, children }: { f: DriveFile, children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {f.isFolder ? (
          <ContextMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); openFolder(f); }}>
            <Folder className="h-4 w-4 mr-2" /> {t("drive.openFolder")}
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); downloadFile(f); }}>
              <Download className="h-4 w-4 mr-2" /> {t("drive.download")}
            </ContextMenuItem>
            <ContextMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleShare(f); }}>
              <Share2 className="h-4 w-4 mr-2" /> {t("drive.shareLink")}
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStar(f); }}>
          <Star className={`h-4 w-4 mr-2 ${f.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {f.starred ? t("drive.unstar") : t("drive.star")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRenameTarget(f); setRenameName(f.name); }}>
          <Pencil className="h-4 w-4 mr-2" /> {t("drive.rename")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setConfirmDelete(f); }}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="h-4 w-4 mr-2" /> {t("action.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <div className="space-y-5">

      {/* ── Loading ── */}
      {accountsLoading && (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      )}

      {/* ── No account ── */}
      {!accountsLoading && accounts.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-primary/10">
              <HardDrive className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">{t("drive.noAccounts")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("files.gdriveRequired")}</p>
            </div>
            <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
              <Link href="/drive"><Cloud className="h-4 w-4" /> {t("drive.connectDrive")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Main UI ── */}
      {!accountsLoading && accounts.length > 0 && (
        <>
          {/* Toolbar — single clean row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account selector */}
            {accounts.length > 1 && (
              <select
                value={selectedAccountId || ""}
                onChange={(e) => selectAccount(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.email || "Google Drive"}</option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("drive.searchFiles")} className="pl-9 h-9" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <Tabs 
              value={search ? "" : filterView} 
              onValueChange={(v) => { if (v) { setFilterView(v as FilterView); setSearch(""); } }}
            >
              <TabsList className="h-9">
                <TabsTrigger value="list" className="px-3 py-1 text-xs">{t("drive.filterAll")}</TabsTrigger>
                <TabsTrigger value="recent" className="px-3 py-1 text-xs">{t("drive.filterRecent")}</TabsTrigger>
                <TabsTrigger value="starred" className="px-3 py-1 text-xs">{t("drive.filterStarred")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-2.5 py-1" title={t("drive.gridView")}>
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="px-2.5 py-1" title={t("drive.listView")}>
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)} className="gap-1.5 h-9">
                <FolderPlus className="h-4 w-4" /> <span className="hidden sm:inline">{t("drive.newFolder")}</span>
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5 h-9 bg-primary hover:bg-primary/90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("action.upload")}</span>
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={doSync} disabled={syncing} title={t("drive.sync")} className="h-9 w-9">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* Breadcrumb */}
          {effectiveView === "list" && folderStack.length > 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
              {folderStack.map((f, i) => (
                <span key={`${i}-${f.id}`} className="flex items-center gap-1">
                  <button onClick={() => goToFolder(i)} className={`hover:text-foreground transition-colors ${i === folderStack.length - 1 ? "font-medium text-foreground" : ""}`}>
                    {f.name}
                  </button>
                  {i < folderStack.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
                </span>
              ))}
              <button onClick={() => goToFolder(folderStack.length - 2)} className="ml-1 flex items-center gap-1 text-primary hover:underline">
                <ArrowLeft className="h-3 w-3" /> {t("action.back")}
              </button>
            </div>
          )}

          {/* Storage bar */}
          {storage && storage.totalSpace > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("drive.storageInfo", { used: formatFileSize(storage.usedSpace), total: formatFileSize(storage.totalSpace) })}</span>
                <span>{Math.round((storage.usedSpace / storage.totalSpace) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (storage.usedSpace / storage.totalSpace) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
              <span className="text-sm font-medium text-primary">{t("drive.selected", { count: selected.size })}</span>
              <Button variant="ghost" size="sm" className="gap-1.5 ml-2 h-8" onClick={() => selected.forEach((id) => { const f = files.find((x) => x.id === id); if (f) downloadFile(f); })}>
                <Download className="h-3.5 w-3.5" /> {t("drive.download")}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => { /* bulk delete – reuse single delete loop */ }}>
                <Trash2 className="h-3.5 w-3.5" /> {t("action.delete")}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 ml-auto text-muted-foreground" onClick={() => setSelected(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* File area */}
          {filesLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {effectiveView === "recent" ? t("drive.emptyRecent") : effectiveView === "starred" ? t("drive.emptyStarred") : search ? t("drive.emptySearch") : t("drive.emptyState")}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* ── Grid ── */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {files.map((f) => (
                <FileContextMenu key={f.id} f={f}>
                        <div
                          role="button" tabIndex={0}
                          onClick={() => openItem(f)}
                          onKeyDown={(e) => { if (e.key === "Enter") openItem(f); }}
                  className="group relative flex flex-col cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Top bar: checkbox + menu */}
                  <div className="flex items-center justify-between px-2.5 pt-2.5">
                    <input
                      type="checkbox" checked={selected.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={`size-4 accent-primary transition-opacity ${
                        selected.has(f.id) 
                          ? "opacity-100" 
                          : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100"
                      }`}
                    />
                    <FileMenu f={f} />
                  </div>

                  {/* Icon */}
                  <div className="flex flex-1 items-center justify-center py-4">
                    <div className={`grid size-14 place-items-center rounded-2xl ${getDriveFileBg(f.mimeType, f.isFolder)}`}>
                      {getDriveFileIcon(f.mimeType, f.isFolder, "h-7 w-7")}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="px-3 pb-3 space-y-0.5">
                    <p className="line-clamp-1 text-[13px] font-medium" title={f.name}>{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {f.isFolder ? t("drive.folder") : formatFileSize(f.size)}
                    </p>
                  </div>

                  {/* Starred badge */}
                  {!!f.starred && (
                    <span className="absolute top-2 right-8 text-yellow-400"><Star className="h-3 w-3 fill-yellow-400" /></span>
                  )}
                </div>
                </FileContextMenu>
              ))}
            </div>
          ) : (
            /* ── List ── */
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/20 border-b text-xs font-medium text-muted-foreground">
                <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="size-4 accent-primary shrink-0" />
                <span className="flex-1 px-1">{t("drive.filterAll")}</span>
                <span className="w-24 text-right hidden sm:block">{t("drive.modified")}</span>
                <span className="w-16 text-right">{t("drive.used")}</span>
                <span className="w-8 shrink-0" />
              </div>
              {files.map((f) => (
                <FileContextMenu key={f.id} f={f}>
                  <div
                    className="group flex items-center gap-3 px-3 py-1.5 hover:bg-muted/40 cursor-pointer border-b last:border-0 transition-colors"
                    onClick={() => openItem(f)}
                  >
                    <input 
                      type="checkbox" 
                      checked={selected.has(f.id)} 
                      onChange={() => toggleSelect(f.id)} 
                      onClick={(e) => e.stopPropagation()} 
                      className={`size-4 accent-primary shrink-0 transition-opacity ${
                        selected.has(f.id) 
                          ? "opacity-100" 
                          : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100"
                      }`}
                    />
                    <div className={`grid size-7 shrink-0 place-items-center rounded-md ${getDriveFileBg(f.mimeType, f.isFolder)}`}>
                      {getDriveFileIcon(f.mimeType, f.isFolder, "h-3.5 w-3.5")}
                    </div>
                    <div className="flex-1 min-w-0 px-1">
                      <p className="text-[13px] font-medium truncate">{f.name}</p>
                    </div>
                    <span className="w-24 text-right text-xs text-muted-foreground hidden sm:block shrink-0">
                      {formatDate(f.modifiedTime)}
                    </span>
                    <span className="w-16 text-right text-xs text-muted-foreground shrink-0">
                      {f.isFolder ? "—" : formatFileSize(f.size)}
                    </span>
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0 w-8 flex justify-end">
                      <FileMenu f={f} />
                    </div>
                  </div>
                </FileContextMenu>
              ))}
            </div>
          )}

          {/* ── Dialogs ── */}

          {/* Delete */}
          <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("drive.deleteFile")}</DialogTitle>
                <DialogDescription>{t("drive.deleteFileDesc", { name: confirmDelete?.name || "" })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>{t("action.cancel")}</Button>
                <Button variant="destructive" onClick={handleDeleteFile}>
                  <Trash2 className="h-4 w-4" /> {t("action.delete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New folder */}
          <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("drive.createFolder")}</DialogTitle>
                <DialogDescription>{t("drive.createFolderDesc", { name: folderStack[folderStack.length - 1]?.name || "" })}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="folderName">{t("drive.folderName")}</Label>
                <Input id="folderName" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Mis. Tugas Kuliah" onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} autoFocus />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFolderOpen(false)}>{t("action.cancel")}</Button>
                <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()} className="gap-2 bg-primary hover:bg-primary/90">
                  {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} {t("drive.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rename */}
          <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("drive.renameTitle")}</DialogTitle>
                <DialogDescription>{t("drive.renameDesc", { name: renameTarget?.name || "" })}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="newName">{t("drive.newName")}</Label>
                <Input id="newName" value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} autoFocus />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenameTarget(null)}>{t("action.cancel")}</Button>
                <Button onClick={handleRename} disabled={renaming || !renameName.trim()} className="gap-2 bg-primary hover:bg-primary/90">
                  {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} {t("drive.rename")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share link */}
          <Dialog open={!!shareTarget} onOpenChange={(o) => { if (!o) { setShareTarget(null); setShareLink(""); setCopied(false); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" /> {t("drive.shareLink")}
                </DialogTitle>
                <DialogDescription>{shareTarget?.name}</DialogDescription>
              </DialogHeader>

              {generatingLink ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : shareLink ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={shareLink} 
                      className="flex-1 font-mono text-xs bg-muted/30 text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0" 
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyShareLink}
                      className="shrink-0 h-9 w-9"
                      title={t("drive.copyLink")}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("drive.shareLinkDesc")}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("drive.noShareLink")}</p>
              )}

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button variant="outline" className="gap-2" onClick={copyShareLink} disabled={!shareLink || copied}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("drive.copied") : t("drive.copyLink")}
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={shareToChat} disabled={!shareLink}>
                  <MessageCircle className="h-4 w-4" /> {t("drive.shareToChat")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Preview Modal */}
          <Dialog open={!!previewTarget} onOpenChange={(o) => !o && setPreviewTarget(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="truncate pr-6">{previewTarget?.name}</DialogTitle>
                <DialogDescription>
                  {previewTarget ? formatFileSize(previewTarget.size) : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                {/* Preview for images */}
                {previewTarget?.mimeType.startsWith("image/") && (
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewTarget.thumbnailLink?.replace(/=s\d+/, "=s2048") || previewTarget.webViewLink || ""}
                      alt={previewTarget.name}
                      className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Preview for documents/pdfs/videos */}
                {previewTarget && !previewTarget.mimeType.startsWith("image/") &&
                  (previewTarget.mimeType.includes("pdf") ||
                    previewTarget.mimeType.includes("document") ||
                    previewTarget.mimeType.includes("word") ||
                    previewTarget.mimeType.includes("presentation") ||
                    previewTarget.mimeType.includes("spreadsheet") ||
                    previewTarget.mimeType.startsWith("video/")) &&
                  previewTarget.webViewLink?.includes("google.com") && (
                    <div className="rounded-xl overflow-hidden border border-border aspect-[16/9] relative bg-muted/20">
                      <iframe
                        src={previewTarget.webViewLink.replace(/\/(view|edit)(\?.*)?$/, "/preview")}
                        title={previewTarget.name}
                        className="absolute inset-0 w-full h-[60vh] min-h-[400px] border-0"
                        allow="autoplay; fullscreen"
                      />
                    </div>
                  )}

                {/* Fallback for others */}
                {previewTarget && !previewTarget.mimeType.startsWith("image/") &&
                  !(
                    (previewTarget.mimeType.includes("pdf") ||
                      previewTarget.mimeType.includes("document") ||
                      previewTarget.mimeType.includes("word") ||
                      previewTarget.mimeType.includes("presentation") ||
                      previewTarget.mimeType.includes("spreadsheet") ||
                      previewTarget.mimeType.startsWith("video/")) &&
                    previewTarget.webViewLink?.includes("google.com")
                  ) && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border border-border">
                      <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-sm font-medium">Tidak ada pratinjau</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Silakan unduh file ini untuk melihat isinya.
                      </p>
                    </div>
                  )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTarget(null)}>
                  Tutup
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => previewTarget && downloadFile(previewTarget)}>
                  <Download className="h-4 w-4" /> {t("drive.download")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Dialog Buat Spreadsheet — moved to /spreadsheets page */}

        </>
      )}
    </div>
  );
}
