"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlarmClock,
  AlertTriangle,
  ArrowRight,
  Activity,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  FileText,
  FolderClosed,
  FolderOpen,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  MessagesSquare,
  MessageSquare,
  Pin,
  Plus,
  Radio,
  ScanText,
  Search,
  Send,
  Settings,
  Sheet,
  ShieldCheck,
  Sparkles,
  StickyNote,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { RevealSection, Stagger, StaggerItem } from "@/components/motion/reveal";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

const PRIMARY = "#818cf8";
const PRIMARY_FOREGROUND = "#0f0720";
const HERO_CAMPUS_IMAGE = "/landing/campus-hero.jpg";

const TEAM_MEMBERS = [
  { name: "Andra Rafi Irgi", nim: "231011450403" },
  { name: "Mawar Iskandar", nim: "231011450351" },
  { name: "Muhammad Haeckal Fadhilah", nim: "231011450540" },
];

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Alur", href: "#alur" },
  { label: "Tim", href: "#tim" },
  { label: "FAQ", href: "#faq" },
];

const FEATURE_STRIP: Array<{ icon: LucideIcon; label: string }> = [
  { icon: CalendarDays, label: "Jadwal" },
  { icon: ListTodo, label: "Tugas" },
  { icon: AlarmClock, label: "Reminder" },
  { icon: GraduationCap, label: "Mata Kuliah" },
  { icon: FolderClosed, label: "File" },
  { icon: Megaphone, label: "Broadcast" },
  { icon: Users, label: "Absen" },
  { icon: Bot, label: "AI" },
];

const FEATURE_MATRIX: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Ringkas",
    description: "Pantau tugas, agenda, pengumuman, dan progres kelas dalam satu tampilan utama.",
  },
  {
    icon: ListTodo,
    title: "Task Manager",
    description: "Kelola tugas dengan deadline, prioritas, status, dan konteks mata kuliah.",
  },
  {
    icon: CalendarDays,
    title: "Kalender Kelas",
    description: "Susun jadwal kuliah, praktikum, ujian, dan agenda penting kelas.",
  },
  {
    icon: AlarmClock,
    title: "Auto Reminder",
    description: "Pengingat otomatis agar deadline dan agenda penting tidak terlewat.",
  },
  {
    icon: BarChart3,
    title: "Statistik",
    description: "Lihat perkembangan tugas, kehadiran, dan aktivitas kelas dengan lebih jelas.",
  },
  {
    icon: GraduationCap,
    title: "Mata Kuliah",
    description: "Simpan detail mata kuliah, dosen, ruang, jadwal, dan informasi pengampu.",
  },
  {
    icon: BookOpen,
    title: "E-Learning",
    description: "Kelola tautan LMS, materi online, kuis, dan referensi pembelajaran.",
  },
  {
    icon: FolderOpen,
    title: "Repository",
    description: "Arsipkan materi, dokumen, dan referensi berdasarkan mata kuliah.",
  },
  {
    icon: Bell,
    title: "Pengumuman",
    description: "Susun informasi kelas dengan arsip yang mudah dicari kembali.",
  },
  {
    icon: BellRing,
    title: "Notifikasi",
    description: "Pantau pembaruan penting agar agenda kelas tidak terlewat.",
  },
  {
    icon: Megaphone,
    title: "Broadcast WhatsApp",
    description: "Kirim pengumuman ke grup kelas dengan proses yang lebih aman dan terarah.",
  },
  {
    icon: MessageCircle,
    title: "Chat Kelas",
    description: "Ruang komunikasi untuk koordinasi cepat seputar kebutuhan kelas.",
  },
  {
    icon: MessagesSquare,
    title: "Forum Diskusi",
    description: "Kelola diskusi per topik agar pembahasan tidak hilang di chat.",
  },
  {
    icon: HardDrive,
    title: "Google Drive",
    description: "Hubungkan Drive agar file kelas tersimpan lebih terstruktur.",
  },
  {
    icon: FolderClosed,
    title: "File Manager",
    description: "Atur upload, kategori, dan file penting dari satu tempat.",
  },
  {
    icon: Sheet,
    title: "Spreadsheet",
    description: "Susun rekap dan tabel kelas tanpa perlu berpindah platform.",
  },
  {
    icon: Users,
    title: "Buku Absen",
    description: "Kelola data anggota, kehadiran, dan rekap kelas yang sering dibutuhkan.",
  },
  {
    icon: StickyNote,
    title: "Sticky Notes",
    description: "Simpan catatan singkat untuk hal penting yang perlu ditindaklanjuti.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Bantu merangkum materi, merapikan pengumuman, dan menyiapkan draft.",
  },
  {
    icon: ScanText,
    title: "OCR Jadwal",
    description: "Ekstrak informasi jadwal dari gambar agar input data lebih cepat.",
  },
];

const WORKFLOW: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: FileText,
    title: "Catat arahan",
    description: "Masukkan tugas, jadwal, materi, atau pengumuman dari dosen.",
  },
  {
    icon: GraduationCap,
    title: "Hubungkan konteks",
    description: "Tambahkan mata kuliah, deadline, file, target grup, dan pengingat.",
  },
  {
    icon: Sparkles,
    title: "Rapikan pesan",
    description: "Susun draft yang siap dikirim ke kelas tanpa tulis ulang berkali-kali.",
  },
  {
    icon: Send,
    title: "Bagikan ke kelas",
    description: "Kirim pengumuman, reminder, atau broadcast WhatsApp dengan kontrol.",
  },
];

const BENEFITS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: ShieldCheck,
    title: "Koordinasi lebih aman",
    description: "Broadcast besar memakai konfirmasi dan dapat berhenti otomatis saat error beruntun.",
  },
  {
    icon: Clock,
    title: "Ritme kelas lebih jelas",
    description: "Deadline, jadwal, dan reminder tersusun agar informasi penting tidak terlambat.",
  },
  {
    icon: HardDrive,
    title: "Arsip lebih tertata",
    description: "Materi, file, tautan Drive, dan catatan penting tersimpan sesuai mata kuliah.",
  },
  {
    icon: LifeBuoy,
    title: "Siap dipakai harian",
    description: "Ketua kelas bisa berpindah dari tugas, kalender, absen, dan broadcast tanpa pindah alat.",
  },
];

const FAQS = [
  {
    question: "Ruang Ketua cocok untuk siapa?",
    answer: "Untuk ketua kelas kampus yang ingin mengelola jadwal, tugas, materi, absensi, dan komunikasi kelas dari satu ruang kerja.",
  },
  {
    question: "Apakah WhatsApp wajib dihubungkan?",
    answer: "Tidak. Ruang Ketua tetap bisa digunakan tanpa WhatsApp. Hubungkan WhatsApp hanya jika kelas membutuhkan broadcast otomatis.",
  },
  {
    question: "Bisa dipakai untuk banyak mata kuliah?",
    answer: "Bisa. Setiap mata kuliah dapat memiliki dosen, jadwal, tugas, materi, repository, dan tautan e-learning sendiri.",
  },
  {
    question: "Apakah bisa dipakai dari HP?",
    answer: "Bisa. Landing page dan dashboard dibuat responsif agar tetap nyaman digunakan dari HP.",
  },
  {
    question: "Bagaimana dengan keamanan data?",
    answer: "Data dipisahkan per akun, rute sensitif dilindungi autentikasi, dan token layanan yang terhubung disimpan secara terenkripsi.",
  },
];

const DASHBOARD_SIDEBAR = [
  {
    title: "Utama",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", active: true },
      { icon: ListTodo, label: "Task Manager" },
      { icon: CalendarDays, label: "Kalender" },
      { icon: AlarmClock, label: "Auto Reminder" },
      { icon: BarChart3, label: "Statistik" },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      { icon: GraduationCap, label: "Mata Kuliah" },
      { icon: BookOpen, label: "E-Learning" },
      { icon: FolderOpen, label: "Repository" },
    ],
  },
  {
    title: "Komunikasi",
    items: [
      { icon: Bell, label: "Pengumuman" },
      { icon: BellRing, label: "Notifikasi" },
      { icon: Megaphone, label: "Broadcast" },
      { icon: MessageCircle, label: "Global Chat" },
      { icon: MessagesSquare, label: "Forum Diskusi" },
      { icon: MessageSquare, label: "WhatsApp" },
    ],
  },
  {
    title: "Alat",
    items: [
      { icon: HardDrive, label: "Google Drive" },
      { icon: FolderClosed, label: "File Manager" },
      { icon: Sheet, label: "Spreadsheet" },
      { icon: Users, label: "Buku Absen" },
      { icon: StickyNote, label: "Sticky Notes" },
      { icon: Bot, label: "AI Assistant" },
      { icon: ScanText, label: "OCR Jadwal" },
    ],
  },
  {
    title: "Akun",
    items: [
      { icon: Activity, label: "Activity Log" },
      { icon: LifeBuoy, label: "Tiket Bantuan" },
      { icon: Settings, label: "Pengaturan" },
    ],
  },
];

const DASHBOARD_STATS = [
  { label: "Tugas Aktif", value: "12", icon: ListTodo, tone: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Selesai", value: "24", icon: CheckCircle2, tone: "text-green-400", bg: "bg-green-400/10" },
  { label: "Terlambat", value: "2", icon: AlertTriangle, tone: "text-red-400", bg: "bg-red-400/10" },
  { label: "Reminder Hari Ini", value: "4", icon: Bell, tone: "text-yellow-400", bg: "bg-yellow-400/10" },
];

const DASHBOARD_QUICK_ACTIONS = [
  { label: "Tambah Tugas", icon: Plus },
  { label: "Broadcast", icon: Radio },
  { label: "Reminder", icon: Bell },
  { label: "Pengumuman", icon: Megaphone },
  { label: "File Manager", icon: FolderOpen },
  { label: "Spreadsheet", icon: Sheet },
  { label: "Buku Absen", icon: Users },
  { label: "Sticky Notes", icon: StickyNote },
];

const DASHBOARD_DEADLINES = [
  { title: "Laporan Basis Data", course: "Basis Data", time: "Hari ini", tone: "text-orange-400" },
  { title: "Tugas Kelompok UI/UX", course: "Interaksi Manusia dan Komputer", time: "Besok", tone: "text-yellow-400" },
  { title: "Quiz Algoritma", course: "Algoritma", time: "3 hari lagi", tone: "text-emerald-400" },
];

const DASHBOARD_ANNOUNCEMENTS = [
  { title: "Perubahan ruang kuliah hari Kamis", time: "10 menit lalu", category: "Akademik" },
  { title: "Materi pertemuan 8 sudah tersedia", time: "2 jam lalu", category: "Akademik" },
  { title: "Link Zoom praktikum diperbarui", time: "Kemarin", category: "Akademik" },
];

const BROADCAST_DATA_SOURCES = [
  { label: "Tugas aktif", value: "Laporan Basis Data", icon: ListTodo },
  { label: "Pengumuman", value: "Perubahan ruang kuliah", icon: Megaphone },
  { label: "E-learning aktif", value: "Kuis Sistem Basis Data", icon: BookOpen },
  { label: "Jadwal mata kuliah", value: "Basis Data", icon: GraduationCap },
];

const BROADCAST_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const BROADCAST_GROUPS = [
  { name: "TI 2026 - Basis Data", members: "132 anggota", selected: true, pinned: true },
  { name: "Praktikum Lab 3", members: "48 anggota", selected: true, pinned: false },
  { name: "Info Akademik", members: "89 anggota", selected: true, pinned: false },
  { name: "Komti Angkatan", members: "37 anggota", selected: false, pinned: false },
];

const BROADCAST_HISTORY = [
  { message: "Reminder tugas Basis Data dikirim malam ini.", groups: "3 grup", time: "Hari ini, 19.12" },
  { message: "Jadwal praktikum Lab 3 sudah diperbarui.", groups: "2 grup", time: "Kemarin, 08.30" },
];

type AuthUser = {
  name: string;
  role: string;
};

type TeamPhotos = {
  teamPhoto1: string | null;
  teamPhoto2: string | null;
  teamPhoto3: string | null;
};

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:brightness-110"
      style={{ backgroundColor: PRIMARY, color: PRIMARY_FOREGROUND }}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-5 text-sm font-semibold text-white/72 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
    >
      {children}
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: PRIMARY }}>
        {eyebrow}
      </p>
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
      {description && <p className="mt-5 text-sm leading-7 text-white/48 sm:text-base">{description}</p>}
    </div>
  );
}

function HeroProductMockup() {
  const shouldReduceMotion = useReducedMotion();
  const mockupRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mockupRef,
    offset: ["start 80%", "start 18%"],
  });
  const rawRotateX = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const rawLiftY = useTransform(scrollYProgress, [0, 1], [-60, 0]);
  const dashboardRotateX = useSpring(rawRotateX, { stiffness: 90, damping: 24, mass: 0.55 });
  const dashboardLiftY = useSpring(rawLiftY, { stiffness: 90, damping: 24, mass: 0.55 });

  return (
    <div ref={mockupRef} data-landing-dashboard-mockup className="relative mx-auto mt-10 w-full max-w-6xl px-2 sm:px-6">
      {/* glow removed */}

      <motion.div
        className="relative z-10"
        initial={{
          opacity: 0,
          y: shouldReduceMotion ? 0 : 54,
          scale: shouldReduceMotion ? 1 : 0.94,
          filter: shouldReduceMotion ? "blur(0px)" : "blur(14px)",
        }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.28 }}
        transition={{ duration: shouldReduceMotion ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          data-landing-dashboard-panel
          className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0c12] shadow-[0_40px_140px_rgba(0,0,0,0.72)] will-change-transform [transform-style:preserve-3d]"
          style={{
            rotateX: shouldReduceMotion ? 0 : dashboardRotateX,
            transformOrigin: "center center",
            transformPerspective: 500,
            y: shouldReduceMotion ? 0 : dashboardLiftY,
          }}
        >
          <div className="flex h-12 items-center border-b border-white/8 bg-white/[0.025] px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f6c85f]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#55d6a8]" />
            </div>
            <span className="mx-auto pr-8 font-mono text-[11px] text-white/34 sm:text-xs">ruangketua.com/dashboard</span>
          </div>

           <div className="dark grid min-h-[780px] bg-background text-left text-foreground lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* ── Sidebar (matches src/components/layout/sidebar.tsx) ── */}
            <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
              <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
                <RuangKetuaLogo size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-none text-sidebar-foreground">Ruang Ketua</p>
                  <p className="mt-0.5 text-[10px] text-sidebar-foreground/40">Workspace</p>
                </div>
              </div>

              <nav className="space-y-4 overflow-y-auto px-3 py-3">
                {DASHBOARD_SIDEBAR.map((section, sectionIndex) => (
                  <motion.div
                    key={section.title}
                    className="space-y-0.5"
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: 0.35 + sectionIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{section.title}</p>
                    {section.items.map((navItem) => {
                      const Icon = navItem.icon;
                      return (
                        <div
                          key={navItem.label}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                            navItem.active
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground/70"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{navItem.label}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </nav>

              <div className="border-t border-sidebar-border px-4 py-3">
                <p className="text-center text-[10px] text-sidebar-foreground/30">Ruang Ketua v1.0</p>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="min-w-0">
              {/* Navbar (matches src/components/layout/navbar.tsx) */}
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/45 px-3 py-1.5 text-sm text-muted-foreground">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">Cari tugas, jadwal, atau file...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground">
                    <Bell className="h-[18px] w-[18px]" />
                  </div>
                  <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium leading-none">Alya Putri</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Ketua Kelas TI 2026</p>
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">AP</div>
                  </div>
                </div>
              </header>

              {/* Dashboard content (matches src/app/(dashboard)/dashboard/page.tsx) */}
              <div className="space-y-6 p-4 sm:p-6">
                {/* Page Header */}
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Dashboard</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Ringkasan aktivitas kelas hari ini</p>
                  </div>
                  <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    Tambah Tugas
                  </button>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {DASHBOARD_STATS.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-border bg-card"
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: 0.42 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                          </div>
                          <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                            <Icon className={`h-5 w-5 ${stat.tone}`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <motion.div
                  className="rounded-xl border border-border bg-card"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-6 pb-3">
                    <p className="text-base font-semibold">Quick Actions</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-4">
                    {DASHBOARD_QUICK_ACTIONS.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.div
                          key={action.label}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent"
                          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.35 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.42, delay: 0.68 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="rounded-lg bg-muted p-2.5">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-center text-sm font-medium">{action.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Deadline + Announcements */}
                <div className="grid gap-4 md:grid-cols-2">
                  <motion.div
                    className="h-full rounded-xl border border-border bg-card"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex flex-row items-center justify-between p-6 pb-3">
                      <p className="flex items-center gap-2 text-base font-semibold">
                        <Clock className="h-4 w-4 text-orange-400" />
                        Deadline Terdekat
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        Lihat Semua <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-3 px-6 pb-6">
                      {DASHBOARD_DEADLINES.map((deadline, index) => (
                        <motion.div
                          key={deadline.title}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                          initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.35 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.42, delay: 0.84 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{deadline.title}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{deadline.course}</p>
                          </div>
                          <span className={`ml-3 shrink-0 text-xs font-medium ${deadline.tone}`}>{deadline.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    className="h-full rounded-xl border border-border bg-card"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex flex-row items-center justify-between p-6 pb-3">
                      <p className="flex items-center gap-2 text-base font-semibold">
                        <Megaphone className="h-4 w-4 text-purple-400" />
                        Pengumuman Terbaru
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        Lihat Semua <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-3 px-6 pb-6">
                      {DASHBOARD_ANNOUNCEMENTS.map((announcement, index) => (
                        <motion.div
                          key={announcement.title}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                          initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.35 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.42, delay: 0.88 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{announcement.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{announcement.time}</p>
                          </div>
                          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[10px] text-secondary-foreground">{announcement.category}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Progress */}
                <motion.div
                  className="rounded-xl border border-border bg-card"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: 0.88, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-6 pb-3">
                    <p className="flex items-center gap-2 text-base font-semibold">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Progress Semester
                    </p>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                          initial={{ width: 0 }}
                          whileInView={{ width: "68%" }}
                          viewport={{ once: true }}
                          transition={{ duration: shouldReduceMotion ? 0 : 1, delay: 1.02, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureMarquee() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl border-y border-white/[0.08] py-4">
      <div className="flex flex-wrap justify-center gap-4">
        {FEATURE_STRIP.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.label}
              className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-white/58"
            >
              <Icon className="h-4 w-4 text-primary" />
              {feature.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BroadcastPreview() {
  return (
    <div className="dark relative min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-[0_30px_90px_rgba(0,0,0,0.5)]">

        {/* ── Page header (matches broadcast/page.tsx line 336-358) ── */}
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kirim kabar ke kelas</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Tulis pesan sekali, pilih grup tujuan, lalu kirim. Kalau perlu, ambil isi pesan dari tugas, pengumuman, e-learning, atau jadwal kuliah.
            </p>
          </div>
          <div className="inline-flex h-8 w-fit items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            WhatsApp tersambung
          </div>
        </div>

        {/* ── Main grid (matches xl:grid-cols-[minmax(0,1fr)_380px]) ── */}
        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_380px]">

          {/* ── Left: Compose + History ── */}
          <div className="space-y-5">
            {/* Compose card (matches broadcast/page.tsx line 377-494) */}
            <section className="rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-semibold">Pesan broadcast</p>
                  <p className="mt-1 text-sm text-muted-foreground">Mulai dari kosong, atau gunakan data kelas di bawah sebagai bahan pesan.</p>
                </div>
                <button type="button" className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Rapikan bahasa
                </button>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Data source selects + day picker */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Ambil dari data kelas</p>
                    <div className="mt-3 grid gap-3">
                      {BROADCAST_DATA_SOURCES.map((source) => {
                        const Icon = source.icon;
                        return (
                          <div key={source.label} className="flex h-10 w-full items-center gap-3 rounded-md border border-input bg-background px-3 text-sm transition-colors focus-within:border-ring">
                            <Icon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="flex-1 truncate text-muted-foreground">{source.label}</span>
                            <span className="hidden max-w-28 truncate text-xs text-foreground/70 xl:block">{source.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Jadwal per hari</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {BROADCAST_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs font-medium capitalize text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Textarea area */}
                <div className="space-y-3">
                  <div className="min-h-[360px] resize-y rounded-md border border-input bg-background p-4 text-sm leading-relaxed">
                    <p>Reminder tugas</p>
                    <p className="mt-4">Mata kuliah: Basis Data</p>
                    <p>Tugas: Laporan Basis Data</p>
                    <p>Deadline: Jumat, 23.59 WIB</p>
                    <p className="mt-4">Tolong dicek dan diselesaikan sebelum batas waktu ya.</p>
                    <p className="mt-4">Catatan:</p>
                    <p>Materi dan template laporan sudah tersedia di repository kelas.</p>
                    <p className="mt-4 text-muted-foreground">
                      --<br />Alya Putri<br />Kelas TI 2026
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>326 karakter</span>
                    <span>Draft dibuat dari data kelas. Bisa diedit sebelum dikirim.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* History card (matches broadcast/page.tsx line 496-516) */}
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-base font-semibold">Riwayat singkat</p>
              </div>
              <div className="grid gap-3">
                {BROADCAST_HISTORY.map((history) => (
                  <div key={history.time} className="rounded-md border border-border bg-background p-3">
                    <p className="line-clamp-1 text-sm text-foreground">&quot;{history.message}&quot;</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-secondary px-2 py-1 text-[10px] text-secondary-foreground">{history.groups}</span>
                      <span>{history.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right: Groups + Send (matches broadcast/page.tsx line 519-663) ── */}
          <aside className="space-y-5">
            {/* Group selector */}
            <section className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">Grup tujuan</p>
                    <p className="mt-1 text-sm text-muted-foreground">3 grup dipilih</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">3</span>
                </div>

                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-background pl-9 pr-3 text-sm text-muted-foreground">
                    Cari grup
                  </div>
                </div>
              </div>

              <div className="p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground">4 grup ditemukan</p>
                  <span className="text-xs font-semibold text-primary">Pilih semua</span>
                </div>
                <div className="max-h-[430px] space-y-2 overflow-hidden pr-1">
                  {BROADCAST_GROUPS.map((group) => (
                    <div
                      key={group.name}
                      className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                        group.selected ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                            group.selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {group.selected ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">{group.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{group.members}</span>
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted">
                        <Pin className={`h-4 w-4 ${group.pinned ? "fill-yellow-400 text-yellow-500" : ""}`} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Send card (matches broadcast/page.tsx line 620-663) */}
            <section className="rounded-lg border border-border bg-card p-5">
              <p className="text-base font-semibold">Siap dikirim?</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-4">
                  <span>Isi pesan</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Siap</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Tujuan</span>
                  <span className="text-emerald-600 dark:text-emerald-400">3 grup</span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed">Ke: TI 2026 - Basis Data, Praktikum Lab 3, Info Akademik</p>
                <div className="flex gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Kamu memilih 3 grup. Sistem akan meminta konfirmasi dan menghentikan pengiriman otomatis kalau error terlalu banyak.</p>
                </div>
              </div>
              <button type="button" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                <Send className="h-4 w-4" />
                Kirim broadcast
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FeatureSpotlight() {
  return (
    <RevealSection id="produk" className="scroll-mt-20 border-b border-white/[0.07] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            align="left"
            eyebrow="Broadcast kelas"
            title="Informasi kelas siap dikirim tanpa salin-tempel berulang."
            description="Ruang Ketua membantu ketua kelas menyusun pesan dari data tugas, pengumuman, e-learning, atau jadwal, lalu mengirimkannya ke grup tujuan dengan alur yang lebih terkontrol."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Pesan dari data kelas", "Tugas, jadwal, materi, dan pengumuman bisa dijadikan draft."],
              ["Kirim lebih terkendali", "Pilih grup tujuan dan cek isi pesan sebelum broadcast dikirim."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <BroadcastPreview />
        </div>
      </div>
    </RevealSection>
  );
}

function WorkflowSection() {
  return (
    <RevealSection id="alur" className="scroll-mt-20 border-b border-white/[0.07] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <SectionHeading
          eyebrow="Mulai dalam 4 langkah"
          title="Alur kerja ketua kelas dibuat sesederhana mungkin."
          description="Dari informasi pertama sampai pesan terkirim, semua langkah dirancang agar cepat dipahami dan tetap aman digunakan setiap hari."
        />

        <Stagger className="mt-12 grid gap-4 lg:grid-cols-4">
          {WORKFLOW.map((step, index) => {
            const Icon = step.icon;
            return (
              <StaggerItem
                key={step.title}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.22 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/35">0{index + 1}</span>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="mt-10 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{step.description}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </RevealSection>
  );
}

function FeatureGridSection() {
  return (
    <RevealSection id="fitur" className="scroll-mt-20 border-b border-white/[0.07] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <SectionHeading
            align="left"
            eyebrow="Fitur lengkap"
            title="Semua kebutuhan penting ketua kelas ada di satu dashboard."
          />
          <p className="max-w-2xl text-sm leading-7 text-white/48 lg:justify-self-end">
            Ruang Ketua lebih dari sekadar daftar tugas. Modulnya mencakup agenda akademik, komunikasi, arsip materi, rekap kelas, sampai bantuan AI untuk merapikan pekerjaan harian.
          </p>
        </div>

        <Stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_MATRIX.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem
                key={feature.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group min-h-48 rounded-2xl border border-white/10 bg-[#0d0d12] p-5 transition-colors hover:border-primary/35 hover:bg-[#11111a]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] transition-colors group-hover:bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-7 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/43">{feature.description}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </RevealSection>
  );
}

function BenefitSection() {
  return (
    <RevealSection className="border-b border-white/[0.07] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            align="left"
            eyebrow="Kenapa dipakai"
            title="Kerja ketua kelas lebih tenang karena informasi punya tempat yang jelas."
            description="Tampilan tetap clean, tapi fungsi yang dibutuhkan ketua kelas tidak dikurangi. Setiap modul dibuat untuk membantu koordinasi kelas berjalan lebih rapi."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-2xl border border-white/10 bg-[#0d0d12] p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-8 text-lg font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/45">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function TeamSection({ teamPhotos }: { teamPhotos: TeamPhotos }) {
  const photos = [teamPhotos.teamPhoto1, teamPhotos.teamPhoto2, teamPhotos.teamPhoto3];
  const shouldReduceMotion = useReducedMotion();

  return (
    <RevealSection id="tim" className="scroll-mt-20 border-b border-white/[0.07] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <SectionHeading
          eyebrow="Tim Pengembang"
          title="Tiga orang di balik Ruang Ketua."
          description="Dibuat oleh mahasiswa untuk membantu ketua kelas mengelola aktivitas kelas dengan lebih terstruktur."
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-3">
          {TEAM_MEMBERS.map((member, index) => {
            const photo = photos[index];
            const initials = member.name.split(" ").slice(0, 2).map((n) => n[0]).join("");
            return (
              <StaggerItem
                key={member.nim}
                whileHover={{ y: shouldReduceMotion ? 0 : -6 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0d0d12] p-8 text-center"
              >
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-white/10 bg-white/[0.03]">
                    {photo ? (
                      <img
                        src={photo}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/25">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{member.name}</h3>
                <p className="mt-1.5 font-mono text-sm text-white/35">{member.nim}</p>
                <div className="mt-4 h-px w-12 bg-white/8" />
                <p className="mt-4 text-sm leading-6 text-white/40">
                  Mahasiswa Teknik Informatika
                </p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </RevealSection>
  );
}

function FAQSection({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <RevealSection id="faq" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1360px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24 lg:px-12 xl:px-16">
        <div>
          <SectionHeading align="left" eyebrow="FAQ" title="Pertanyaan yang sering muncul." />
          <p className="mt-5 text-sm leading-7 text-white/42">
            Belum menemukan jawabannya?{" "}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:brightness-110" style={{ color: PRIMARY }}>
              Hubungi tim kami.
            </a>
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12]">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group border-b border-white/[0.08] last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-6 text-base font-medium text-white/82 marker:hidden sm:px-6">
                {faq.question}
                <Plus className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-[720px] px-5 pb-6 text-sm leading-7 text-white/45 sm:px-6">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

export default function LandingPageContent() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [teamPhotos, setTeamPhotos] = useState<TeamPhotos>({ teamPhoto1: null, teamPhoto2: null, teamPhoto3: null });
  const [waNumber, setWaNumber] = useState("6281234567890");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          setAuthUser({ name: data.data.name, role: data.data.role });
        }
      })
      .catch(() => {});

    fetch("/api/public/settings")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.adminWhatsapp) setWaNumber(data.data.adminWhatsapp);
          setTeamPhotos({
            teamPhoto1: data.data.teamPhoto1 ?? null,
            teamPhoto2: data.data.teamPhoto2 ?? null,
            teamPhoto3: data.data.teamPhoto3 ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    setAuthUser(null);
    setMenuOpen(false);
    router.refresh();
  };

  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo Tim Ruang Ketua, saya ingin bertanya tentang Ruang Ketua."
  )}`;

  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#08080b] text-[#fafafa]">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08080b]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ruang Ketua">
            <RuangKetuaLogo size={32} />
            <span className="whitespace-nowrap text-sm font-bold leading-none text-white">Ruang Ketua</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-white/52 transition-colors hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {authUser ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-white/62 transition-colors hover:text-white">
                  {authUser.name || "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar"
                  title="Keluar"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/45 transition-colors hover:border-white/20 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white/55 transition-colors hover:text-white">
                  Masuk
                </Link>
                <PrimaryButton href="/register">Mulai sekarang</PrimaryButton>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/60 md:hidden"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.06] bg-[#0c0c0f] px-5 py-4 md:hidden">
            <div className="grid w-full gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-3 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
                <Link href={authUser ? "/dashboard" : "/login"} className="rounded-md border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white/70">
                  {authUser ? "Dashboard" : "Masuk"}
                </Link>
                {authUser ? (
                  <button type="button" onClick={handleLogout} className="rounded-md px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: PRIMARY, color: PRIMARY_FOREGROUND }}>
                    Keluar
                  </button>
                ) : (
                  <Link href="/register" className="rounded-md px-4 py-2.5 text-center text-sm font-semibold" style={{ backgroundColor: PRIMARY, color: PRIMARY_FOREGROUND }}>
                    Mulai sekarang
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/[0.07] pb-16 pt-12 sm:pb-20 sm:pt-14">
          {/* Background image — capped height so it doesn't zoom on tall section */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[750px] sm:h-[820px]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-55 saturate-[0.88]"
              style={{ backgroundImage: `url(${HERO_CAMPUS_IMAGE})` }}
            />
            <div className="absolute inset-0 bg-[#08080b]/55" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,11,0.38)_0%,rgba(8,8,11,0.62)_50%,#08080b_100%)]" />
          </div>

          <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
            <motion.h1
              className="mx-auto max-w-4xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[68px]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              Kelola kelas lebih terstruktur dalam satu platform.
            </motion.h1>

            <motion.p
              className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/56 sm:text-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16 }}
            >
              Platform manajemen kelas yang mengintegrasikan jadwal, tugas, materi, pengumuman, absensi, dan komunikasi dalam satu workspace terpusat.
            </motion.p>

            <motion.div
              className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24 }}
            >
              <PrimaryButton href="/register">
                Mulai kelola kelas
                <ArrowRight className="h-3.5 w-3.5" />
              </PrimaryButton>
              <SecondaryButton href="#fitur">Lihat fitur utama</SecondaryButton>
            </motion.div>

            <motion.div
              className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.32 }}
            >
              {[
                ["20+", "modul terintegrasi"],
                ["All-in-One", "workspace terpusat"],
                ["QRIS", "aktivasi instan"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-lg font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/42">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <HeroProductMockup />
          <div className="px-5 sm:px-8">
            <FeatureMarquee />
          </div>
        </section>

        <FeatureSpotlight />
        <WorkflowSection />
        <FeatureGridSection />
        <BenefitSection />
        <TeamSection teamPhotos={teamPhotos} />
        <FAQSection whatsappUrl={whatsappUrl} />

        <RevealSection className="border-t border-white/[0.07] py-16">
          <div className="mx-auto flex w-full max-w-[1360px] flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-12 xl:px-16">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Mulai kelola kelas dengan lebih rapi.</h2>
              <p className="mt-2 text-sm text-white/42">Bangun ruang kerja kelas yang siap dipakai dalam beberapa menit.</p>
            </div>
            <PrimaryButton href="/register">
              Mulai kelola kelas
              <ArrowRight className="h-3.5 w-3.5" />
            </PrimaryButton>
          </div>
        </RevealSection>
      </main>

      <footer className="border-t border-white/[0.07] py-8">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-16">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ruang Ketua">
            <RuangKetuaLogo size={32} />
            <span className="whitespace-nowrap text-sm font-bold leading-none text-white">Ruang Ketua</span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-white/38">Platform kerja digital untuk membantu ketua kelas mengatur agenda, arsip, dan komunikasi kelas dengan lebih profesional.</p>
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Ruang Ketua</p>
        </div>
      </footer>
    </div>
  );
}
