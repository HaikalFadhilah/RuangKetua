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
  FolderClosed,
  MessagesSquare,
  MessageCircle,
  HardDrive,
  LifeBuoy,
  BellRing,
  ShieldCheck,
  Sheet,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/store";

interface CommandItem {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  icon: React.ElementType;
  action: () => void;
  category: "navigate" | "action";
  keywords: string[];
}

export function CommandPalette() {
  const { t } = useI18n();
  const { user } = useAuthStore();
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
    { id: "dashboard", labelKey: "nav.dashboard", descriptionKey: "cmd.item.dashboardDesc", icon: LayoutDashboard, action: () => nav("/dashboard"), category: "navigate", keywords: ["home", "beranda", "utama"] },
    { id: "tasks", labelKey: "nav.tasks", descriptionKey: "cmd.item.tasksDesc", icon: ListTodo, action: () => nav("/tasks"), category: "navigate", keywords: ["tugas", "todo", "assignment"] },
    { id: "calendar", labelKey: "nav.calendar", descriptionKey: "cmd.item.calendarDesc", icon: CalendarDays, action: () => nav("/calendar"), category: "navigate", keywords: ["jadwal", "schedule", "tanggal"] },
    { id: "courses", labelKey: "nav.courses", descriptionKey: "cmd.item.coursesDesc", icon: GraduationCap, action: () => nav("/courses"), category: "navigate", keywords: ["matkul", "mata kuliah", "dosen"] },
    { id: "elearning", labelKey: "nav.elearning", descriptionKey: "cmd.item.elearningDesc", icon: BookOpen, action: () => nav("/elearning"), category: "navigate", keywords: ["kuliah", "online", "lms"] },
    { id: "repository", labelKey: "nav.repository", descriptionKey: "cmd.item.repositoryDesc", icon: FolderOpen, action: () => nav("/repository"), category: "navigate", keywords: ["file", "materi", "dokumen"] },
    
    { id: "announcements", labelKey: "nav.announcements", descriptionKey: "cmd.item.announcementsDesc", icon: Bell, action: () => nav("/announcements"), category: "navigate", keywords: ["info", "umumkan"] },
    { id: "notifications", labelKey: "nav.notifications", descriptionKey: "cmd.item.notificationsDesc", icon: BellRing, action: () => nav("/notifications"), category: "navigate", keywords: ["notif", "pemberitahuan"] },
    { id: "broadcast", labelKey: "nav.broadcast", descriptionKey: "cmd.item.broadcastDesc", icon: Megaphone, action: () => nav("/broadcast"), category: "navigate", keywords: ["kirim", "whatsapp", "grup"] },
    { id: "chat", labelKey: "nav.chat", descriptionKey: "cmd.item.chatDesc", icon: MessageCircle, action: () => nav("/chat"), category: "navigate", keywords: ["ngobrol", "pesan", "dm"] },
    { id: "forum", labelKey: "nav.forum", descriptionKey: "cmd.item.forumDesc", icon: MessagesSquare, action: () => nav("/forum"), category: "navigate", keywords: ["diskusi", "tanya", "jawab", "komunitas"] },
    { id: "whatsapp", labelKey: "nav.whatsapp", descriptionKey: "cmd.item.whatsappDesc", icon: MessageSquare, action: () => nav("/whatsapp"), category: "navigate", keywords: ["wa", "qr", "koneksi"] },

    { id: "drive", labelKey: "nav.drive", descriptionKey: "cmd.item.driveDesc", icon: HardDrive, action: () => nav("/drive"), category: "navigate", keywords: ["cloud", "google drive", "penyimpanan"] },
    { id: "files", labelKey: "nav.files", descriptionKey: "cmd.item.filesDesc", icon: FolderClosed, action: () => nav("/files"), category: "navigate", keywords: ["file manager", "upload", "download"] },
    { id: "spreadsheets", labelKey: "nav.spreadsheets", descriptionKey: "cmd.item.spreadsheetsDesc", icon: Sheet, action: () => nav("/spreadsheets"), category: "navigate", keywords: ["excel", "sheet", "tabel", "uang kas"] },
    { id: "members", labelKey: "nav.members", descriptionKey: "cmd.item.membersDesc", icon: Users, action: () => nav("/members"), category: "navigate", keywords: ["anggota", "buku induk", "mahasiswa", "teman"] },
    { id: "notes", labelKey: "nav.notes", descriptionKey: "cmd.item.notesDesc", icon: StickyNote, action: () => nav("/notes"), category: "navigate", keywords: ["catatan", "memo", "note"] },
    { id: "ai", labelKey: "nav.aiAssistant", descriptionKey: "cmd.item.aiDesc", icon: Bot, action: () => nav("/ai-assistant"), category: "navigate", keywords: ["chat", "tanya", "bantuan", "bot"] },
    { id: "ocr", labelKey: "nav.ocr", descriptionKey: "cmd.item.ocrDesc", icon: ScanText, action: () => nav("/ocr"), category: "navigate", keywords: ["scan", "gambar", "foto", "screenshot"] },
    { id: "statistics", labelKey: "nav.statistics", descriptionKey: "cmd.item.statisticsDesc", icon: BarChart3, action: () => nav("/statistics"), category: "navigate", keywords: ["grafik", "chart", "data", "laporan"] },
    
    { id: "activity", labelKey: "nav.activity", descriptionKey: "cmd.item.activityDesc", icon: Activity, action: () => nav("/activity"), category: "navigate", keywords: ["log", "riwayat", "history"] },
    { id: "tickets", labelKey: "nav.tickets", descriptionKey: "cmd.item.ticketsDesc", icon: LifeBuoy, action: () => nav("/tickets"), category: "navigate", keywords: ["bantuan", "support", "help"] },
    { id: "settings", labelKey: "nav.settings", descriptionKey: "cmd.item.settingsDesc", icon: Settings, action: () => nav("/settings"), category: "navigate", keywords: ["pengaturan", "profil", "password", "tema"] },
    
    // Admin only
    ...(user?.role === "super_admin" || user?.role === "admin" ? [{ id: "admin", labelKey: "admin.nav.dashboard", descriptionKey: "cmd.item.adminDesc", icon: ShieldCheck, action: () => nav("/rk-dashboard"), category: "navigate" as const, keywords: ["panel", "super", "kelola"] } as CommandItem] : []),

    // Quick Actions
    { id: "new-task", labelKey: "cmd.item.newTask", icon: Plus, action: () => nav("/tasks"), category: "action", keywords: ["tambah", "buat", "new", "task"] },
    { id: "new-announcement", labelKey: "cmd.item.newAnnouncement", icon: FileText, action: () => nav("/announcements"), category: "action", keywords: ["tambah", "buat", "pengumuman"] },
    { id: "ask-ai", labelKey: "cmd.item.askAi", icon: Bot, action: () => nav("/ai-assistant"), category: "action", keywords: ["tanya", "chat", "ai"] },
  ];

  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          t(item.labelKey).toLowerCase().includes(q) ||
          (item.descriptionKey ? t(item.descriptionKey).toLowerCase().includes(q) : false) ||
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
        <span className="flex-1 text-left text-muted-foreground/70">{t("cmd.searchPlaceholder")}</span>
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
                    placeholder={t("cmd.searchHint")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                    {t("cmd.esc")}
                  </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
                  {allFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">{t("cmd.noResults", { query })}</p>
                    </div>
                  ) : (
                    <>
                      {navigateItems.length > 0 && (
                        <>
                          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t("cmd.sectionNavigate")}</p>
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
                                  <span className="font-medium">{t(item.labelKey)}</span>
                                  {item.descriptionKey && (
                                    <span className="ml-2 text-xs text-muted-foreground">{t(item.descriptionKey)}</span>
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
                          <p className="px-2 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t("cmd.sectionActions")}</p>
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
                                <span className="font-medium flex-1 text-left">{t(item.labelKey)}</span>
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
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">↑↓</kbd> {t("cmd.navHint")}</span>
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">↵</kbd> {t("cmd.selectHint")}</span>
                  <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1">esc</kbd> {t("cmd.closeHint")}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
