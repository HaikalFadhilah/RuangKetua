"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  BookOpen,
  CalendarDays,
  Megaphone,
  MessageSquare,
  GraduationCap,
  FolderOpen,
  Bell,
  BarChart3,
  Bot,
  ScanText,
  Share2,
  StickyNote,
  Activity,
  Settings,
  Search,
  ArrowRight,
  Plus,
  FileText,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: "navigate" | "action";
  keywords: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const nav = useCallback((href: string) => {
    router.push(href);
    setIsOpen(false);
  }, [router]);

  const items: CommandItem[] = [
    // Navigation
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => nav("/dashboard"), category: "navigate", keywords: ["home", "beranda", "utama"] },
    { id: "tasks", label: "Task Manager", description: "Kelola tugas kelas", icon: ListTodo, action: () => nav("/tasks"), category: "navigate", keywords: ["tugas", "todo", "assignment"] },
    { id: "elearning", label: "E-Learning", description: "Daftar e-learning", icon: BookOpen, action: () => nav("/elearning"), category: "navigate", keywords: ["kuliah", "online", "lms"] },
    { id: "calendar", label: "Kalender", description: "Jadwal & deadline", icon: CalendarDays, action: () => nav("/calendar"), category: "navigate", keywords: ["jadwal", "schedule", "tanggal"] },
    { id: "broadcast", label: "Broadcast", description: "Kirim pesan massal", icon: Megaphone, action: () => nav("/broadcast"), category: "navigate", keywords: ["kirim", "whatsapp", "grup"] },
    { id: "whatsapp", label: "WhatsApp", description: "Koneksi WhatsApp", icon: MessageSquare, action: () => nav("/whatsapp"), category: "navigate", keywords: ["wa", "chat", "qr"] },
    { id: "dosen", label: "Dosen", description: "Data dosen & matkul", icon: GraduationCap, action: () => nav("/dosen"), category: "navigate", keywords: ["pengajar", "guru", "mata kuliah", "matkul"] },
    { id: "repository", label: "Repository", description: "Materi kuliah", icon: FolderOpen, action: () => nav("/repository"), category: "navigate", keywords: ["file", "materi", "dokumen"] },
    { id: "announcements", label: "Pengumuman", description: "Buat & kelola pengumuman", icon: Bell, action: () => nav("/announcements"), category: "navigate", keywords: ["info", "notif", "umumkan"] },
    { id: "statistics", label: "Statistik", description: "Data & grafik", icon: BarChart3, action: () => nav("/statistics"), category: "navigate", keywords: ["grafik", "chart", "data", "laporan"] },
    { id: "ai", label: "AI Assistant", description: "Chat dengan AI", icon: Bot, action: () => nav("/ai-assistant"), category: "navigate", keywords: ["chat", "tanya", "bantuan", "gemini", "groq"] },
    { id: "ocr", label: "OCR Screenshot", description: "Ekstrak tugas dari gambar", icon: ScanText, action: () => nav("/ocr"), category: "navigate", keywords: ["scan", "gambar", "foto", "screenshot"] },
    { id: "files", label: "File Sharing", description: "Upload & share file", icon: Share2, action: () => nav("/files"), category: "navigate", keywords: ["upload", "download", "dokumen"] },
    { id: "notes", label: "Sticky Notes", description: "Catatan cepat", icon: StickyNote, action: () => nav("/notes"), category: "navigate", keywords: ["catatan", "note", "memo"] },
    { id: "activity", label: "Activity Log", description: "Riwayat aktivitas", icon: Activity, action: () => nav("/activity"), category: "navigate", keywords: ["log", "riwayat", "history"] },
    { id: "settings", label: "Settings", description: "Pengaturan akun", icon: Settings, action: () => nav("/settings"), category: "navigate", keywords: ["pengaturan", "profil", "password", "tema"] },
    // Quick Actions
    { id: "new-task", label: "Buat Tugas Baru", icon: Plus, action: () => nav("/tasks"), category: "action", keywords: ["tambah", "buat", "new", "task"] },
    { id: "new-announcement", label: "Buat Pengumuman", icon: FileText, action: () => nav("/announcements"), category: "action", keywords: ["tambah", "buat", "pengumuman"] },
    { id: "ask-ai", label: "Tanya AI Assistant", icon: Bot, action: () => nav("/ai-assistant"), category: "action", keywords: ["tanya", "chat", "ai"] },
  ];

  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
        );
      })
    : items;

  const navigateItems = filtered.filter((i) => i.category === "navigate");
  const actionItems = filtered.filter((i) => i.category === "action");
  const allFiltered = [...navigateItems, ...actionItems];

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allFiltered[selectedIndex]) {
        allFiltered[selectedIndex].action();
      }
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground w-[280px] transition-colors hover:border-primary/30 hover:bg-muted cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left text-muted-foreground/70">Search...</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 mx-4"
            >
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Cari halaman, fitur, atau ketik perintah..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
                  {allFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Tidak ada hasil untuk &quot;{query}&quot;</p>
                    </div>
                  ) : (
                    <>
                      {navigateItems.length > 0 && (
                        <>
                          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Halaman</p>
                          {navigateItems.map((item, i) => {
                            const Icon = item.icon;
                            const globalIndex = i;
                            return (
                              <button
                                key={item.id}
                                data-index={globalIndex}
                                onClick={() => item.action()}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                                  selectedIndex === globalIndex
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-accent/50"
                                }`}
                              >
                                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                                <div className="flex-1 text-left">
                                  <span className="font-medium">{item.label}</span>
                                  {item.description && (
                                    <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                                  )}
                                </div>
                                {selectedIndex === globalIndex && (
                                  <ArrowRight className="h-3 w-3 text-primary/60" />
                                )}
                              </button>
                            );
                          })}
                        </>
                      )}

                      {actionItems.length > 0 && (
                        <>
                          <p className="px-2 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Aksi Cepat</p>
                          {actionItems.map((item, i) => {
                            const Icon = item.icon;
                            const globalIndex = navigateItems.length + i;
                            return (
                              <button
                                key={item.id}
                                data-index={globalIndex}
                                onClick={() => item.action()}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                                  selectedIndex === globalIndex
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-accent/50"
                                }`}
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-medium flex-1 text-left">{item.label}</span>
                                {selectedIndex === globalIndex && (
                                  <ArrowRight className="h-3 w-3 text-primary/60" />
                                )}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground/60">
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">↑↓</kbd> navigasi</span>
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">↵</kbd> pilih</span>
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">esc</kbd> tutup</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
