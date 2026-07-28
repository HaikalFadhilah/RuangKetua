"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Star,
  BookOpen,
  CalendarDays,
  MessageSquare,
  FileText,
  Megaphone,
  Bot,
  BarChart3,
  Send,
  ShieldCheck,
  Zap,
  TrendingUp,
  GraduationCap,
  Clock,
  Bell,
  ListTodo,
  AlertTriangle,
  Plus,
  Radio,
  Sparkles,
  ChevronDown,
  Globe,
  Lock,
  Award,
  HeartHandshake,
  Smartphone,
  HardDrive,
  Cloud,
  FolderOpen,
  Sheet,
  Users,
  StickyNote,
} from "lucide-react";

// ─────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Harga", href: "#harga" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES_MAIN = [
  {
    icon: ListTodo,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Manajemen Tugas & Deadline",
    desc: "Pantau seluruh tugas kelas dari semua mata kuliah dalam satu tampilan. Sistem otomatis mengirim pengingat deadline ke grup WhatsApp sebelum batas waktu habis.",
    badges: ["Reminder Otomatis", "Per Mata Kuliah", "Status Tracking"],
  },
  {
    icon: Megaphone,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "Pusat Pengumuman Kelas",
    desc: "Buat dan kelola pengumuman resmi kelas dengan dukungan AI untuk penyusunan teks otomatis. Distribusi langsung ke WhatsApp, tidak ada anggota yang ketinggalan info.",
    badges: ["AI Drafting", "Broadcast WA", "Arsip Permanen"],
  },
  {
    icon: Send,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Broadcast WhatsApp Terintegrasi",
    desc: "Kirim pesan ke seluruh grup WhatsApp sekaligus. Auto-template dari data tugas, jadwal e-Learning, atau pengumuman terbaru. Tandai grup favorit untuk akses cepat.",
    badges: ["Multi-Grup", "Auto-Template", "Sign Otomatis"],
  },
  {
    icon: CalendarDays,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Kalender & Jadwal Terpadu",
    desc: "Satu kalender untuk semua: jadwal kuliah, ujian, pertemuan dosen, deadline tugas, dan acara kelas. Didukung OCR — foto jadwal tercetak, langsung masuk kalender.",
    badges: ["OCR Jadwal", "Sync Deadline", "Filter Cerdas"],
  },
  {
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    title: "Manajemen Mata Kuliah & E-Learning",
    desc: "Simpan info lengkap tiap mata kuliah: dosen, SKS, jadwal, link e-Learning. Pantau jadwal pertemuan online dan kelola seluruh sumber belajar dalam satu tempat.",
    badges: ["Info Dosen", "Link LMS", "Jadwal Online"],
  },
  {
    icon: FileText,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    title: "Penyimpanan File & Repository",
    desc: "Simpan modul, soal ujian, materi perkuliahan, dan dokumen kelas. Bagikan file dengan tautan publik yang bisa diakses tanpa login. Kategorisasi per mata kuliah.",
    badges: ["Share Link", "Per MK", "Akses Publik"],
  },
  {
    icon: MessageSquare,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    title: "Forum Diskusi & Live Chat",
    desc: "Forum interaktif untuk berdiskusi, berbagi pengalaman, dan bertanya antar sesama pengguna dari berbagai kampus secara global. Live chat real-time agar tidak perlu grup WA pribadi.",
    badges: ["Forum Ketua Kelas", "Real-time Chat", "Komunitas"],
  },
  {
    icon: Bot,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "Asisten AI Akademik",
    desc: "Asisten cerdas yang memahami konteks kampus: rangkum materi kuliah, buat draf pesan dosen, analisis catatan, bantu susun pengumuman kelas.",
    badges: ["Asisten AI", "Rangkum Materi", "Draf Pesan Dosen"],
  },
  {
    icon: Bell,
    color: "text-red-500",
    bg: "bg-red-500/10",
    title: "Sistem Notifikasi Cerdas",
    desc: "Notifikasi in-app real-time untuk setiap aktivitas penting: tugas baru, pengumuman, pesan forum, dan reminder deadline. Tidak ada yang terlewat.",
    badges: ["Real-time", "In-App", "Reminder"],
  },
  {
    icon: Smartphone,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "WhatsApp Gateway",
    desc: "Hubungkan nomor WhatsApp kelas ke platform. Scan QR sekali, sistem siap siarkan pesan kapan saja. Monitor status koneksi dan aktivitas broadcast langsung.",
    badges: ["QR Login", "Status Monitor", "Multi-sesi"],
  },
  {
    icon: HardDrive,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    title: "Google Drive Multi-Akun",
    desc: "Hubungkan beberapa akun Google Drive sekaligus dan atur strategi distribusi file secara otomatis. Upload file dari mana saja — platform akan memilih akun terbaik berdasarkan kapasitas yang tersisa. Tidak perlu khawatir storage penuh.",
    badges: ["Multi-Akun", "Auto Allocation", "File Manager"],
  },
  {
    icon: Sheet,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Otomatisasi Spreadsheet Terpusat",
    desc: "Hasilkan dokumen Google Sheets terstruktur untuk rekapitulasi data kelas secara instan. Tersedia template khusus untuk pencatatan uang kas, pembagian kelompok tugas, hingga presensi harian, tersinkronisasi langsung ke cloud Anda.",
    badges: ["Auto-Generate", "Template Uang Kas", "Sync Google Drive"],
  },
];

// Pricing plan structure (prices overridden from DB at runtime)
const PRICING_PLANS = [
  {
    key: "monthly",
    name: "Bulanan",
    tagline: "Fleksibel, bayar per bulan",
    defaultPrice: 29000,
    period: "per bulan",
    highlight: false,
    badge: null as string | null,
    features: [
      "Manajemen tugas & deadline",
      "Broadcast WhatsApp ke multi-grup",
      "Google Drive multi-akun",
      "Otomatisasi Spreadsheet & Buku Induk",
      "Asisten AI tidak terbatas",
      "Notifikasi real-time",
      "Support via email",
      "13+ fitur lainnya termasuk",
    ],
    cta: "Berlangganan Sekarang",
    variant: "outline" as const,
  },
  {
    key: "halfyear",
    name: "6 Bulan",
    tagline: "Hemat lebih banyak, tenang lebih lama",
    defaultPrice: 149000,
    period: "per 6 bulan",
    highlight: true,
    badge: "Paling Hemat" as string | null,
    features: [
      "Manajemen tugas & deadline",
      "Broadcast WhatsApp ke multi-grup",
      "Google Drive multi-akun",
      "Otomatisasi Spreadsheet & Buku Induk",
      "Asisten AI tidak terbatas",
      "Notifikasi real-time",
      "Priority support",
      "13+ fitur lainnya termasuk",
    ],
    cta: "Berlangganan 6 Bulan",
    variant: "primary" as const,
  },
  {
    key: "yearly",
    name: "Tahunan",
    tagline: "Nilai terbaik untuk satu tahun penuh",
    defaultPrice: 269000,
    period: "per tahun",
    highlight: false,
    badge: "Terbaik" as string | null,
    features: [
      "Manajemen tugas & deadline",
      "Broadcast WhatsApp ke multi-grup",
      "Google Drive multi-akun",
      "Otomatisasi Spreadsheet & Buku Induk",
      "Asisten AI tidak terbatas",
      "Notifikasi real-time",
      "Priority support sepanjang tahun",
      "13+ fitur lainnya termasuk",
    ],
    cta: "Berlangganan Tahunan",
    variant: "outline" as const,
  },
];

const TESTIMONIALS = [
  {
    name: "Rizki Pratama",
    role: "Ketua Kelas — Teknik Informatika, Universitas Brawijaya",
    avatar: "RP",
    content:
      "Sebelum pakai Ruang Ketua, saya harus manage grup WA, spreadsheet tugas, dan Google Form pengumuman sendiri. Sekarang semua dalam satu platform. Broadcast ke beberapa grup sekaligus — keren banget!",
    stars: 5,
  },
  {
    name: "Siti Nuraini",
    role: "Ketua Kelas — Akuntansi, Universitas Padjadjaran",
    avatar: "SN",
    content:
      "Fitur AI-nya yang paling sering saya pakai. Tinggal ketik konteks, langsung keluar draf pengumuman atau pesan untuk dosen yang proper. Hemat waktu banget buat ketua kelas.",
    stars: 5,
  },
  {
    name: "Amanda Putri",
    role: "Ketua Kelas — Kedokteran, Universitas Indonesia",
    avatar: "AP",
    content:
      "Tugas saya sebagai ketua kelas jadi jauh lebih mudah sejak ada fitur Buku Absen dan Spreadsheet otomatis. Rekap uang kas dan absensi langsung nyambung ke Google Drive tanpa pusing bikin tabel dari nol!",
    stars: 5,
  },
  {
    name: "Fajar Nugroho",
    role: "Ketua Kelas — Teknik Elektro, Institut Teknologi Sepuluh Nopember",
    avatar: "FN",
    content:
      "Fitur Google Drive multi-akunnya ini beda dari yang lain. Saya connect 3 akun Drive sekaligus — platform otomatis pilih yang paling banyak kosongnya waktu ada file masuk. Tidak perlu lagi repot cek storage satu-satu. File Manager-nya juga rapi, bisa share link pendek langsung ke grup WA kelas.",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "Apa saja fitur utama Ruang Ketua?",
    a: "Manajemen tugas & deadline, pengumuman, kalender kelas, forum diskusi, penyimpanan file & repository, Google Drive multi-akun dengan auto-alokasi upload, File Manager dengan share link, Otomatisasi Spreadsheet Terpusat (termasuk template Uang Kas, Tugas, Buku Induk), Sticky Notes, WhatsApp Gateway & broadcast, Asisten AI, dan notifikasi real-time — semua terpadu dalam satu dashboard.",
  },
  {
    q: "Bagaimana cara kerja WhatsApp Gateway & Broadcast?",
    a: "Anda cukup menghubungkan nomor WhatsApp pribadi melalui proses scan QR Code. Setelah sesi aktif, sistem memfasilitasi pengiriman pesan massal, pengumuman, atau pengingat deadline tugas secara otomatis ke berbagai grup, didukung template yang terintegrasi dengan data kalender dan tugas.",
  },
  {
    q: "Apakah ada fitur AI?",
    a: "Ya. Asisten AI Ruang Ketua dapat membantu membuat draf pengumuman, menulis pesan ke dosen, merangkum materi, dan menjawab pertanyaan seputar kelas Anda — langsung dari dalam platform.",
  },
  {
    q: "Apakah jadwal kuliah dan deadline bisa diatur dengan mudah?",
    a: "Sangat bisa. Anda dapat memasukkan jadwal perkuliahan, pertemuan dengan dosen, serta deadline tugas ke dalam satu kalender terpadu. Sistem akan secara otomatis mengurutkannya berdasarkan prioritas dan mengingatkan Anda sebelum jatuh tempo.",
  },
  {
    q: "Bagaimana keamanan data kelas saya?",
    a: "Password dienkripsi dengan bcrypt, autentikasi menggunakan JWT, dan setiap request API diverifikasi. Data per kelas terisolasi penuh — kelas lain tidak dapat mengakses data kelas Anda.",
  },
  {
    q: "Paket apa saja yang tersedia dan bagaimana cara berlangganan?",
    a: "Tersedia tiga pilihan durasi berlangganan: Bulanan, 6 Bulan, dan Tahunan. Pembayaran mendukung QRIS — praktis, cepat, dan aman.",
  },
];

// ─────────────────────────────────────────────
//  ANIMATION VARIANTS
// ─────────────────────────────────────────────

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary mb-4">
      <GraduationCap className="h-3 w-3" />
      {children}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm hover:bg-muted/50 transition-colors"
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
//  USER MENU (logged-in nav)
// ─────────────────────────────────────────────

function UserMenu({
  user,
  onLogout,
}: {
  user: { name: string; role: string };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (user.name?.charAt(0) || "U").toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {initial}
        </span>
        <span className="hidden sm:block max-w-[140px] truncate">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-50">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-muted/60 transition-colors"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  WHATSAPP FLOATING WIDGET
// ─────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.984-1.04zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const [waNumber, setWaNumber] = useState("6281234567890");

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.adminWhatsapp) setWaNumber(d.data.adminWhatsapp);
      })
      .catch(() => {});
  }, []);

  const message =
    "Halo Tim Ruang Ketua, saya ingin mengetahui informasi lebih lanjut mengenai platform Ruang Ketua.";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  const logoGradient = "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)";

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-64 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: logoGradient }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <WhatsAppIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Tim Ruang Ketua</div>
                <div className="text-[11px] text-white/80">Online &middot; siap membantu Anda</div>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-foreground leading-relaxed">
                Halo! 👋 Ada pertanyaan seputar Ruang Ketua? Tim kami siap membantu Anda
                terkait fitur, langganan, maupun kendala teknis.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: logoGradient }}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Mulai Chat di WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-indigo-500/60 animate-ping" />
        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Hubungi Tim Ruang Ketua via WhatsApp"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-indigo-500/40 ring-4 ring-background"
          style={{ background: logoGradient }}
        >
          <WhatsAppIcon className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pricing, setPricing] = useState<{
    priceMonthly: number; priceHalfYear: number; priceYearly: number;
    pricingEnabled: boolean; pakasirEnabled: boolean;
  } | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch harga dari DB
  useEffect(() => {
    fetch("/api/public/pricing")
      .then(r => r.json())
      .then(d => { if (d.success) setPricing(d.data); })
      .catch(() => {/* gunakan defaultPrice */});
  }, []);

  // Cek sesi login untuk menampilkan nav yang sesuai
  const [authUser, setAuthUser] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAuthUser({ name: d.data.name, role: d.data.role });
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setAuthUser(null);
    router.push("/login");
  };

  const handleSubscribe = (planKey: string) => {
    // Alur yang diinginkan: klik Berlangganan -> daftar akun dulu.
    // Setelah akun dibuat, user otomatis terkunci (paywall) dan diarahkan
    // ke halaman /locked yang berisi pilihan paket.
    setPayingPlan(planKey);
    window.location.href = "/register";
  };

  const heroRef = useRef(null);
  const featRef = useRef(null);
  const priceRef = useRef(null);
  const faqRef = useRef(null);

  const featInView = useInView(featRef, { once: true, margin: "-80px" });
  const priceInView = useInView(priceRef, { once: true, margin: "-80px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* ── GLOBAL DECORATIVE BACKGROUND ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[80vh] bg-gradient-to-b from-primary/[0.10] to-transparent" />
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full bg-primary/30 blur-[150px]" />
        <div className="absolute top-[16%] -right-28 w-[520px] h-[520px] rounded-full bg-violet-500/25 blur-[150px]" />
        <div className="absolute top-[52%] -left-28 w-[500px] h-[500px] rounded-full bg-fuchsia-500/20 blur-[150px]" />
        <div className="absolute bottom-10 right-1/3 w-[420px] h-[420px] rounded-full bg-sky-500/15 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent)",
          }}
        />
      </div>

      {/* ── NAVBAR ─────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-base">
              <RuangKetuaLogo size={44} />
              <span className="hidden sm:block">
                Ruang<span className="text-primary">Ketua</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              {authUser ? (
                <UserMenu user={authUser} onLogout={handleLogout} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/60 transition-colors"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-4 pb-4 space-y-1"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                {authUser ? (
                  <>
                    <Link href="/dashboard" className="block px-4 py-3 rounded-lg text-sm font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="block w-full px-4 py-3 rounded-lg text-sm font-medium text-center border border-border text-red-500 hover:bg-muted/60 transition-colors">
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-3 rounded-lg text-sm font-medium text-center border border-border hover:bg-muted/60 transition-colors">
                      Masuk
                    </Link>
                    <Link href="/register" className="block px-4 py-3 rounded-lg text-sm font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ───────────────────────────────── */}
      <section ref={heroRef} className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Background grid + glows */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
            }}
          />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -top-10 left-[12%] w-[360px] h-[360px] rounded-full bg-fuchsia-500/20 blur-[110px]" />
          <div className="absolute top-10 right-[10%] w-[320px] h-[320px] rounded-full bg-violet-500/15 blur-[110px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <motion.span
                animate={{ scale: [1, 1.04, 1], boxShadow: ["0 0 0 0 rgba(139,92,246,0.0)", "0 0 18px 2px rgba(139,92,246,0.25)", "0 0 0 0 rgba(139,92,246,0.0)"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-semibold shadow-sm"
              >
                <motion.span
                  animate={{ rotate: [0, 22, -22, 0], scale: [1, 1.18, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                Platform Manajemen Kelas #1 untuk Mahasiswa Indonesia
              </motion.span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6"
            >
              Satu Platform untuk{" "}
              <span className="gradient-text">Semua Urusan Kelas</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Ruang Ketua adalah asisten digital Ketua Kelas — dari manajemen tugas, broadcast WhatsApp, kalender perkuliahan, forum diskusi, penyimpanan cloud multi-akun, hingga AI akademik. Semua terpadu dalam satu dashboard yang elegan.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                href={authUser ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 text-sm"
              >
                 {authUser ? "Buka Dashboard" : "Mulai Sekarang"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#fitur"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-border hover:bg-muted/60 transition-all text-sm"
              >
                Lihat Semua Fitur
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p variants={fadeUp} className="mt-6 text-xs text-muted-foreground">
              Tanpa kartu kredit. Berlangganan fleksibel tiap Bulanan, 6 Bulan, atau Tahunan.
            </motion.p>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 overflow-hidden">
              {/* Fake browser bar */}
              <div className="bg-muted/60 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                  <span className="w-3 h-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 ml-2">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground max-w-xs mx-auto text-center border border-border/50">
                    ruangketua.my.id/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard preview content — mirrors the real app dashboard */}
              <div className="bg-muted/20 p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold tracking-tight">Dashboard</div>
                    <div className="text-[11px] text-muted-foreground">Ringkasan aktivitas kelas hari ini</div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold">
                    <Plus className="h-3 w-3" /> Tambah Tugas
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Tugas Aktif", val: "8", icon: ListTodo, color: "text-blue-400", bg: "bg-blue-400/10" },
                    { label: "Selesai", val: "14", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
                    { label: "Terlambat", val: "2", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
                    { label: "Reminder Hari Ini", val: "3", icon: Bell, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-medium">{s.label}</div>
                          <div className="text-xl font-bold mt-0.5">{s.val}</div>
                        </div>
                        <div className={`p-2 rounded-xl ${s.bg}`}>
                          <s.icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border border-border bg-card p-3.5">
                  <div className="text-xs font-semibold mb-2.5">Quick Actions</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Tambah Tugas", icon: Plus },
                      { label: "Broadcast", icon: Radio },
                      { label: "Pengumuman", icon: Megaphone },
                      { label: "Reminder", icon: Bell },
                      { label: "File Manager", icon: FolderOpen },
                      { label: "Spreadsheet", icon: Sheet },
                      { label: "Buku Induk", icon: Users },
                      { label: "Sticky Notes", icon: StickyNote },
                    ].map((a) => (
                      <div key={a.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 bg-background">
                        <div className="p-1.5 rounded-md bg-muted">
                          <a.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-[9px] font-medium text-center leading-tight">{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Deadline Terdekat */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-400" /> Deadline Terdekat
                      </div>
                      <div className="text-[10px] text-muted-foreground">Lihat Semua</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { title: "Laporan Praktikum Basis Data", mk: "Basis Data", due: "2 hari lagi", urgent: true },
                        { title: "Essay Hukum Internasional", mk: "HI", due: "5 hari lagi", urgent: false },
                        { title: "Presentasi Riset Operasi", mk: "Riset Operasi", due: "1 minggu", urgent: false },
                      ].map((t) => (
                        <div key={t.title} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{t.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{t.mk}</div>
                          </div>
                          <span className={`text-[10px] font-medium ml-3 ${t.urgent ? "text-red-400" : "text-muted-foreground"}`}>
                            {t.due}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pengumuman Terbaru */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <Megaphone className="h-3.5 w-3.5 text-purple-400" /> Pengumuman Terbaru
                      </div>
                      <div className="text-[10px] text-muted-foreground">Lihat Semua</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { title: "Jadwal UTS sudah keluar", cat: "KAMPUS", time: "2 jam lalu" },
                        { title: "Libur Nasional Pengganti", cat: "PUBLIC", time: "1 hari lalu" },
                        { title: "Pengumpulan Tugas Akhir", cat: "KAMPUS", time: "3 hari lalu" },
                      ].map((a) => (
                        <div key={a.title} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{a.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{a.time}</div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 ml-3">
                            {a.cat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Semester */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" /> Progress Semester
                    </div>
                    <div className="font-medium">62%</div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500" style={{ width: "62%" }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/20 blur-2xl rounded-full -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAND ─────────────────────────── */}
      <section className="border-y border-border bg-muted/15">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
        >
          <motion.div variants={fadeIn} className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Mengapa Ruang Ketua
            </span>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Dipercaya untuk mengelola kelas dengan rapi
            </h3>
          </motion.div>
          <div className="rounded-2xl border border-border bg-card divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {[
                {
                  icon: GraduationCap,
                  title: "Satu Ruang per Kelas",
                  desc: "Setiap kelas mendapat ruang kerja sendiri yang terisolasi dan aman.",
                },
                {
                  icon: Lock,
                  title: "Tanpa Kartu Kredit",
                  desc: "Mulai langsung tanpa perlu memasukkan data pembayaran apa pun.",
                },
                {
                  icon: Globe,
                  title: "Untuk Kampus di Indonesia",
                  desc: "Cocok untuk PTN, PTS, politeknik, hingga organisasi kemahasiswaan.",
                },
              ].map((t) => (
                <motion.div key={t.title} variants={scaleIn} className="flex items-start gap-4 p-7">
                  <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="fitur" ref={featRef} className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={featInView ? "show" : "hidden"}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <SectionBadge>Fitur Lengkap</SectionBadge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Semua yang Dibutuhkan Ketua Kelas
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
              Dari tugas harian hingga komunikasi WhatsApp massal — Ruang Ketua menyediakan ekosistem digital lengkap yang dirancang khusus untuk konteks perkuliahan Indonesia.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={featInView ? "show" : "hidden"}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES_MAIN.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${f.bg} mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.badges.map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                      {b}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── WHY SECTION ────────────────────────── */}
      <section className="py-24 bg-muted/15 border-y border-border">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeRight}>
              <SectionBadge>Mengapa Ruang Ketua?</SectionBadge>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 leading-snug">
                Dibuat Khusus untuk Ekosistem Kampus Indonesia
              </h2>
              <div className="space-y-5">
                {[
                  {
                    icon: Globe,
                    title: "Database Universitas Lengkap",
                    desc: "Database PTN, PTS, Politeknik, IAIN/UIN, Poltekkes, hingga Universitas Terbuka — tidak perlu input manual info kampus.",
                  },
                  {
                    icon: Lock,
                    title: "Privasi & Isolasi Data Penuh",
                    desc: "Data tiap kelas sepenuhnya terisolasi. Tidak ada kelas lain yang bisa mengakses data Anda. Enkripsi end-to-end untuk semua data sensitif.",
                  },
                  {
                    icon: Zap,
                    title: "Performa Cepat & Andal",
                    desc: "Dibangun di atas Next.js 16 + React 19 + MariaDB. Notifikasi real-time dan load halaman instan.",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Dukungan Aktif & Komunitas",
                    desc: "Tim support responsif, dokumentasi lengkap dalam Bahasa Indonesia, dan komunitas pengguna yang aktif untuk saling berbagi tips.",
                  },
                ].map((w) => (
                  <motion.div key={w.title} variants={fadeUp} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <w.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1">{w.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{w.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Decorative card stack */}
            <motion.div variants={fadeLeft} className="relative hidden md:block">
              <div className="absolute top-4 right-4 w-full h-full rounded-2xl border border-border bg-card opacity-40" />
              <div className="absolute top-2 right-2 w-full h-full rounded-2xl border border-border bg-card opacity-60" />
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <RuangKetuaLogo size={36} />
                  <div>
                    <div className="font-bold text-sm">Teknik Informatika — TI 3A</div>
                    <div className="text-xs text-muted-foreground">Universitas Brawijaya</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Secure & Sync
                  </div>
                </div>
                {[
                  { icon: Lock, color: "text-green-500", label: "Workspace terenkripsi & terisolasi aktif" },
                  { icon: Globe, color: "text-blue-500", label: "Terhubung ke database Universitas Brawijaya" },
                  { icon: Zap, color: "text-yellow-500", label: "Sinkronisasi realtime Next.js berjalan" },
                  { icon: Bot, color: "text-pink-500", label: "AI Akademik siap menganalisis data kelas" },
                  { icon: Smartphone, color: "text-violet-500", label: "WhatsApp Gateway standby untuk broadcast" },
                  { icon: HardDrive, color: "text-sky-500", label: "Google Drive Multi-Akun terhubung (80% Free)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-1">
                    <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── PRICING ────────────────────────────── */}
      <section id="harga" ref={priceRef} className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={priceInView ? "show" : "hidden"}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <SectionBadge>Harga Transparan</SectionBadge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Pilih Durasi Berlangganan
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto text-sm">
              Akses penuh semua fitur di setiap paket. Tidak ada biaya tersembunyi.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PRICING_PLANS.map((plan, idx) => {
              const livePrice =
                plan.key === "monthly"  ? (pricing?.priceMonthly  ?? plan.defaultPrice) :
                plan.key === "halfyear" ? (pricing?.priceHalfYear ?? plan.defaultPrice) :
                                          (pricing?.priceYearly   ?? plan.defaultPrice);
              const priceLabel = `Rp ${livePrice.toLocaleString("id-ID")}`;
              const isLoading = payingPlan === plan.key;
              const paymentActive = pricing?.pakasirEnabled ?? false;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 32 }}
                  animate={priceInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className={`relative flex flex-col rounded-2xl border overflow-hidden ${
                    plan.highlight
                      ? "border-primary shadow-xl shadow-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Top accent bar for highlighted */}
                  {plan.highlight && (
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />
                  )}

                  <div className={`flex flex-col flex-1 p-7 ${plan.highlight ? "bg-card" : ""}`}>
                    {/* Plan name + badge */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      {plan.badge && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          plan.highlight
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {pricing === null ? (
                        <div className="w-32 h-10 bg-muted/60 rounded-xl animate-pulse" />
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={priceInView ? { opacity: 1, scale: 1 } : {}}
                          transition={{ duration: 0.4, delay: 0.2 + idx * 0.12 }}
                        >
                          <div className={`text-4xl font-extrabold tracking-tight leading-none ${plan.highlight ? "text-primary" : ""}`}>
                            {priceLabel}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1.5">{plan.period}</div>
                        </motion.div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border mb-6" />

                    {/* Feature list */}
                    <ul className="space-y-3 flex-1 mb-8">
                      {plan.features.map((f, fi) => {
                        const isMore = f.startsWith("13+");
                        return (
                          <motion.li
                            key={f}
                            initial={{ opacity: 0, x: -6 }}
                            animate={priceInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.3, delay: 0.3 + idx * 0.12 + fi * 0.04 }}
                            className={`flex items-center gap-3 ${isMore ? "pt-1" : ""}`}
                          >
                            {isMore ? (
                              <span className="text-xs text-muted-foreground/60 italic">
                                + 13 fitur lainnya tersedia
                              </span>
                            ) : (
                              <>
                                <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                                  plan.highlight ? "bg-primary/15" : "bg-emerald-500/10"
                                }`}>
                                  <CheckCircle2 className={`h-2.5 w-2.5 ${plan.highlight ? "text-primary" : "text-emerald-500"}`} />
                                </span>
                                <span className="text-sm text-muted-foreground">{f}</span>
                              </>
                            )}
                          </motion.li>
                        );
                      })}
                    </ul>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={priceInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 + idx * 0.12 }}
                    >
                      {paymentActive ? (
                        <button
                          onClick={() => handleSubscribe(plan.key)}
                          disabled={isLoading}
                          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            plan.highlight
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                              : "border border-border hover:bg-muted/60"
                          }`}
                        >
                          {isLoading ? "Memproses..." : plan.cta}
                        </button>
                      ) : (
                        <Link
                          href="/register"
                          className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                            plan.highlight
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                              : "border border-border hover:bg-muted/60"
                          }`}
                        >
                          {plan.cta}
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={priceInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-muted-foreground mt-8"
          >
            Pembayaran via QRIS · Mulai berlangganan kapan saja, tanpa kartu kredit.
          </motion.p>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────── */}
      <section id="testimoni" className="py-24 bg-muted/15 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionBadge>Testimoni</SectionBadge>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Dipercaya Ketua Kelas di Seluruh Indonesia
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Dari Sabang sampai Merauke — kelola kelas jadi lebih mudah bersama Ruang Ketua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────── */}
      <section id="faq" ref={faqRef} className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={faqInView ? "show" : "hidden"}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <SectionBadge>FAQ</SectionBadge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Pertanyaan yang Sering Diajukan
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={faqInView ? "show" : "hidden"}
            variants={stagger}
            className="space-y-3"
          >
            {FAQS.map((f) => (
              <motion.div key={f.q} variants={fadeRight}>
                <FaqItem q={f.q} a={f.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-primary/5" />
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-3xl -z-10" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-6">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Siap Kelola Kelas Lebih Profesional?
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-lg mx-auto">
              Kelola tugas, jadwal, pengumuman, dan komunikasi kelas dalam satu platform. Daftar sekarang dan berlangganan paket yang Anda butuhkan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 text-sm"
              >
                Daftar Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold border border-border hover:bg-muted/60 transition-all text-sm"
              >
                Sudah Punya Akun? Masuk
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-5">
              Berlangganan fleksibel tiap Bulanan, 6 Bulan, atau Tahunan &mdash; tanpa kartu kredit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <SiteFooter />

      <FloatingWhatsApp />
    </div>
  );
}
