"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, StickyNote as StickyNoteIcon, Pin, Trash2, Loader2, PinOff, Search, X } from "lucide-react";
import { NOTE_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
}

import { container } from "@/lib/animations";

const noteVariant = { hidden: { opacity: 0, y: 16, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

const COLOR_MAP: Record<string, { bg: string; border: string; dot: string; text: string; placeholder: string; divider: string; action: string; inputBg: string }> = {
  yellow:  { bg: "bg-yellow-50 dark:bg-yellow-950/40",  border: "border-yellow-200 dark:border-yellow-800/60",  dot: "bg-yellow-400",  text: "text-yellow-900 dark:text-yellow-100",  placeholder: "placeholder:text-yellow-700/40 dark:placeholder:text-yellow-300/30",  divider: "border-yellow-200/70 dark:border-yellow-700/40",  action: "hover:bg-yellow-200/60 dark:hover:bg-yellow-800/40",  inputBg: "bg-yellow-100/60 dark:bg-yellow-900/30" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/40",      border: "border-blue-200 dark:border-blue-800/60",      dot: "bg-blue-400",    text: "text-blue-900 dark:text-blue-100",      placeholder: "placeholder:text-blue-700/40 dark:placeholder:text-blue-300/30",      divider: "border-blue-200/70 dark:border-blue-700/40",      action: "hover:bg-blue-200/60 dark:hover:bg-blue-800/40",      inputBg: "bg-blue-100/60 dark:bg-blue-900/30" },
  green:   { bg: "bg-green-50 dark:bg-green-950/40",    border: "border-green-200 dark:border-green-800/60",    dot: "bg-green-400",   text: "text-green-900 dark:text-green-100",    placeholder: "placeholder:text-green-700/40 dark:placeholder:text-green-300/30",    divider: "border-green-200/70 dark:border-green-700/40",    action: "hover:bg-green-200/60 dark:hover:bg-green-800/40",    inputBg: "bg-green-100/60 dark:bg-green-900/30" },
  pink:    { bg: "bg-pink-50 dark:bg-pink-950/40",      border: "border-pink-200 dark:border-pink-800/60",      dot: "bg-pink-400",    text: "text-pink-900 dark:text-pink-100",      placeholder: "placeholder:text-pink-700/40 dark:placeholder:text-pink-300/30",      divider: "border-pink-200/70 dark:border-pink-700/40",      action: "hover:bg-pink-200/60 dark:hover:bg-pink-800/40",      inputBg: "bg-pink-100/60 dark:bg-pink-900/30" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-950/40",  border: "border-purple-200 dark:border-purple-800/60",  dot: "bg-purple-400",  text: "text-purple-900 dark:text-purple-100",  placeholder: "placeholder:text-purple-700/40 dark:placeholder:text-purple-300/30",  divider: "border-purple-200/70 dark:border-purple-700/40",  action: "hover:bg-purple-200/60 dark:hover:bg-purple-800/40",  inputBg: "bg-purple-100/60 dark:bg-purple-900/30" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-950/40",  border: "border-orange-200 dark:border-orange-800/60",  dot: "bg-orange-400",  text: "text-orange-900 dark:text-orange-100",  placeholder: "placeholder:text-orange-700/40 dark:placeholder:text-orange-300/30",  divider: "border-orange-200/70 dark:border-orange-700/40",  action: "hover:bg-orange-200/60 dark:hover:bg-orange-800/40",  inputBg: "bg-orange-100/60 dark:bg-orange-900/30" },
};

function getColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.yellow;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ── Expanded modal ─────────────────────────────────────────────────────────
function NoteModal({ note, onClose, onUpdate, onDelete, t }: {
  note: Note;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const c = getColors(note.color);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 120);
  }, []);

  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        key="modal-card"
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className={cn(
          "relative flex flex-col w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[80vh]",
          c.bg, c.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* macOS traffic-light title bar */}
        <div className={cn("flex items-center gap-2 px-4 py-3 border-b shrink-0", c.divider)}>
          <div className="flex items-center gap-1.5">
            {/* Red — close */}
            <button
              onClick={onClose}
              title="Tutup"
              className="group/dot h-3 w-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="hidden group-hover/dot:block text-red-800 text-[8px] leading-none font-bold select-none">✕</span>
            </button>
            {/* Yellow — pin toggle */}
            <button
              onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
              title={note.pinned ? "Lepas sematan" : "Sematkan"}
              className="group/dot h-3 w-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="hidden group-hover/dot:block text-yellow-800 text-[8px] leading-none font-bold select-none">
                {note.pinned ? "−" : "⏷"}
              </span>
            </button>
            {/* Green — delete */}
            <button
              onClick={() => { onDelete(note.id); onClose(); }}
              title="Hapus catatan"
              className="group/dot h-3 w-3 rounded-full bg-green-400 hover:bg-red-400 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="hidden group-hover/dot:block text-green-800 text-[8px] leading-none font-bold select-none">⊕</span>
            </button>
          </div>
          <span className="ml-2 text-xs text-muted-foreground/50 font-medium">{formatDate(note.createdAt)}</span>
          {note.pinned && <Pin className="h-3 w-3 text-amber-500 ml-auto" />}
        </div>

        {/* Title input */}
        <div className={cn("px-5 pt-4 pb-2 border-b shrink-0", c.divider)}>
          <input
            ref={titleRef}
            type="text"
            defaultValue={note.title}
            onBlur={(e) => { if (e.target.value !== note.title) onUpdate(note.id, { title: e.target.value }); }}
            placeholder="Judul catatan..."
            className={cn(
              "w-full bg-transparent text-base font-semibold focus:outline-none tracking-tight",
              c.text,
              "placeholder:font-normal placeholder:opacity-40"
            )}
          />
        </div>

        {/* Content textarea */}
        <textarea
          ref={textareaRef}
          defaultValue={note.content}
          onBlur={(e) => { if (e.target.value !== note.content) onUpdate(note.id, { content: e.target.value }); }}
          placeholder={t("notes.placeholder")}
          className={cn(
            "flex-1 bg-transparent text-sm resize-none focus:outline-none px-5 py-4 leading-relaxed min-h-[240px]",
            c.text, c.placeholder
          )}
        />

        {/* Footer: color picker */}
        <div className={cn("flex items-center gap-2 px-5 py-3 border-t shrink-0", c.divider)}>
          <span className="text-[10px] text-muted-foreground/50 font-medium mr-1">Warna:</span>
          {NOTE_COLORS.map((col) => (
            <button
              key={col.value}
              onClick={() => onUpdate(note.id, { color: col.value })}
              title={col.label}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-all cursor-pointer hover:scale-125",
                col.class,
                note.color === col.value
                  ? "border-gray-500 dark:border-white scale-125 ring-2 ring-offset-1 ring-gray-400/40"
                  : "border-transparent"
              )}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Note card (grid) ───────────────────────────────────────────────────────
function NoteCard({ note, onUpdate, onDelete, onExpand, t }: {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onExpand: (note: Note) => void;
  t: (key: string) => string;
}) {
  const c = getColors(note.color);

  return (
    <motion.div
      layout
      variants={noteVariant}
      onClick={() => onExpand(note)}
      className={cn(
        "group relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-1",
        c.bg, c.border
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full shrink-0", c.dot)} />
          <span className="text-[10px] font-medium text-muted-foreground/60">{formatDate(note.createdAt)}</span>
        </div>
        {/* Action buttons — visible on hover */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
            title={note.pinned ? "Lepas sematan" : "Sematkan"}
            className={cn("p-1.5 rounded-lg transition-colors cursor-pointer", c.action, note.pinned ? "text-amber-500" : "text-muted-foreground")}
          >
            {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Hapus"
            className={cn("p-1.5 rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-red-500", c.action)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      {note.title && (
        <div className={cn("px-3.5 pt-1 pb-0.5 text-sm font-semibold leading-snug truncate", c.text)}>
          {note.title}
        </div>
      )}

      {/* Preview content */}
      <div
        className={cn(
          "flex-1 px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-5 select-none",
          c.text,
          !note.content && "opacity-40 italic",
          note.title && "pt-1"
        )}
      >
        {note.content || t("notes.placeholder")}
      </div>

      {/* Footer: color dots */}
      <div
        className={cn("flex items-center gap-1.5 px-3.5 py-2.5 border-t", c.divider)}
        onClick={(e) => e.stopPropagation()}
      >
        {NOTE_COLORS.map((col) => (
          <button
            key={col.value}
            onClick={() => onUpdate(note.id, { color: col.value })}
            title={col.label}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all cursor-pointer hover:scale-125",
              col.class,
              note.color === col.value
                ? "border-gray-500 dark:border-white scale-125 ring-2 ring-offset-1 ring-gray-400/40"
                : "border-transparent"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes?limit=100");
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch { toast.error(t("notes.fetchError")); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const createNote = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "", color: "yellow" }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [data.data, ...prev]);
        setExpandedNote(data.data);
      }
    } catch { toast.error(t("notes.createError")); }
    finally { setIsCreating(false); }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
      if (expandedNote?.id === id) setExpandedNote((prev) => prev ? { ...prev, ...updates } : prev);
    } catch { toast.error(t("notes.updateError")); }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (expandedNote?.id === id) setExpandedNote(null);
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      toast.success(t("notes.deleted"));
    } catch {
      toast.error(t("notes.deleteError"));
      fetchNotes();
    }
  };

  const q = searchQuery.toLowerCase().trim();
  const filtered = q
    ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    : notes;

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <motion.div variants={noteVariant} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t("nav.notes")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("notes.subtitle")}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search bar */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari judul atau isi..."
                      className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearchQuery(""); }}
              className={cn("h-9 w-9 shrink-0", searchOpen && "bg-muted")}
              title="Cari catatan"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button onClick={createNote} disabled={isCreating} className="gap-2 shrink-0">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("notes.add")}
            </Button>
          </div>
        </motion.div>

        {/* Search result count */}
        {q && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground -mt-4">
            {filtered.length === 0 ? "Tidak ada catatan yang cocok." : `${filtered.length} catatan ditemukan untuk "${searchQuery}"`}
          </motion.p>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn("w-full rounded-xl", i % 3 === 0 ? "h-52" : i % 2 === 0 ? "h-36" : "h-44")} />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <motion.div variants={noteVariant} className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <StickyNoteIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-muted-foreground">{t("notes.empty")}</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">{t("notes.emptyDesc")}</p>
            <Button onClick={createNote} disabled={isCreating} variant="outline" className="mt-5 gap-2">
              <Plus className="h-4 w-4" />
              {t("notes.add")}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Disematkan</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pinned.map((note) => (
                    <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onExpand={setExpandedNote} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Unpinned section */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNoteIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Catatan Lain</span>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {unpinned.map((note) => (
                    <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onExpand={setExpandedNote} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Expanded note modal */}
      <AnimatePresence>
        {expandedNote && (
          <NoteModal
            key={expandedNote.id}
            note={expandedNote}
            onClose={() => setExpandedNote(null)}
            onUpdate={updateNote}
            onDelete={deleteNote}
            t={t}
          />
        )}
      </AnimatePresence>
    </>
  );
}
