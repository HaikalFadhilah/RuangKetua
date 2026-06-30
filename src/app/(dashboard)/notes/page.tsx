"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, StickyNote as StickyNoteIcon, Pin, Trash2, Loader2 } from "lucide-react";
import { NOTE_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes?limit=100");
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch { toast.error("Gagal mengambil catatan"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "", color: "yellow" }) });
      const data = await res.json();
      if (data.success) { setNotes((prev) => [data.data, ...prev]); }
    } catch { toast.error("Gagal membuat catatan"); }
    finally { setIsCreating(false); }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      await fetch(`/api/notes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    } catch { toast.error("Gagal mengupdate catatan"); }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Catatan dihapus");
    } catch { toast.error("Gagal menghapus catatan"); }
  };

  const getColorClass = (color: string) => NOTE_COLORS.find((c) => c.value === color)?.class || NOTE_COLORS[0].class;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sticky Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">Catatan pribadi Ketua Kelas</p>
        </div>
        <Button onClick={createNote} disabled={isCreating}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" />Tambah Catatan</>}
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <StickyNoteIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-lg font-medium">Belum ada catatan</p>
          <p className="text-sm text-muted-foreground mt-1">Klik tombol di atas untuk menambah catatan baru</p>
        </div>
      ) : (
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notes.map((note) => (
            <motion.div key={note.id} layout variants={item} className={cn("group relative rounded-xl p-4 min-h-[180px] flex flex-col transition-shadow hover:shadow-lg", getColorClass(note.color))}>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => updateNote(note.id, { pinned: !note.pinned })} className={cn("p-1 rounded hover:bg-black/10 cursor-pointer", note.pinned && "text-yellow-600")}>
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteNote(note.id)} className="p-1 rounded hover:bg-black/10 text-red-500 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {note.pinned && <Pin className="absolute top-2 left-2 h-3.5 w-3.5 text-yellow-600" />}
              <textarea
                defaultValue={note.content}
                onBlur={(e) => { if (e.target.value !== note.content) updateNote(note.id, { content: e.target.value }); }}
                placeholder="Tulis catatan..."
                className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 text-gray-800 dark:text-gray-100"
              />
              <div className="flex gap-1 mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateNote(note.id, { color: c.value })}
                    className={cn("h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer", c.class, note.color === c.value ? "border-gray-600 dark:border-white scale-110" : "border-transparent")}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
