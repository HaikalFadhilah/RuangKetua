import { extra1 } from "./extra-1";
import { extra2 } from "./extra-2";
import { extra3 } from "./extra-3";
import { extra4 } from "./extra-4";
import { extra5 } from "./extra-5";
import { extra6 } from "./extra-6";
import { extra7 } from "./extra-7";
import { extra8 } from "./extra-8";
import { extra9 } from "./extra-9";
import { extra10 } from "./extra-10";
import { extra11 } from "./extra-11";
import { extra12 } from "./extra-12";
import { extra13 } from "./extra-13";
import { extra14 } from "./extra-14";

export const SUPPORTED_LOCALES = ["id", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_LABELS: Record<Locale, string> = {
  id: "Indonesia",
  en: "English",
};

export const translations: Record<Locale, Record<string, string>> = {
  id: {
    // ── Common actions ──
    "action.save": "Simpan",
    "action.cancel": "Batal",
    "action.delete": "Hapus",
    "action.edit": "Edit",
    "action.create": "Buat",
    "action.close": "Tutup",
    "action.confirm": "Konfirmasi",
    "action.back": "Kembali",
    "action.loading": "Memuat...",
    "action.search": "Cari",
    "action.upload": "Unggah",
    "action.download": "Unduh",
    "action.refresh": "Segarkan",
    "action.add": "Tambah",
    "action.connect": "Hubungkan",
    "action.disconnect": "Putuskan",

    // ── Navbar / sidebar ──
    "nav.section.main": "Utama",
    "nav.section.learning": "Pembelajaran",
    "nav.section.communication": "Komunikasi",
    "nav.section.tools": "Alat",
    "nav.section.account": "Akun",
    "nav.dashboard": "Dashboard",
    "nav.files": "File Manager",
    "nav.drive": "Google Drive",
    "nav.settings": "Pengaturan",
    "nav.profile": "Profil",
    "nav.logout": "Keluar",
    "nav.language": "Bahasa",
    "nav.theme": "Tema",
    "nav.classChair": "Ketua Kelas",
    "nav.tasks": "Task Manager",
    "nav.calendar": "Kalender",
    "nav.courses": "Mata Kuliah",
    "nav.elearning": "E-Learning",
    "nav.statistics": "Statistik",
    "nav.notifications": "Notifikasi",
    "nav.announcements": "Pengumuman",
    "nav.broadcast": "Broadcast",
    "nav.whatsapp": "WhatsApp",
    "nav.forum": "Forum Diskusi",
    "nav.chat": "Global Chat",
    "nav.repository": "Repository",
    "nav.notes": "Sticky Notes",
    "nav.aiAssistant": "AI Assistant",
    "nav.ocr": "OCR Jadwal",
    "nav.activity": "Activity Log",
    "nav.tickets": "Tiket Bantuan",
    "nav.adminPanel": "Admin Panel",
    "nav.members": "Buku Absen",
    "nav.spreadsheets": "Spreadsheet",

    // ── Drive ──
    "drive.title": "Google Drive",
    "drive.subtitle": "Akses, kelola, dan unggah file langsung dari Ruang Ketua.",
    "drive.connectAccount": "Hubungkan Akun",
    "drive.noAccounts": "Belum ada Google Drive terhubung",
    "drive.noAccountsDesc": "Klik “Hubungkan Akun” untuk menautkan Google Drive kamu dan mulai mengelola file di sini.",
    "drive.connectDrive": "Hubungkan Google Drive",
    "drive.connectedAccounts": "Akun Terhubung",
    "drive.overview": "Overview",
    "drive.allocation": "Allocation",
    "drive.files": "Files",
    "drive.totalStorage": "Total Penyimpanan",
    "drive.used": "Terpakai",
    "drive.available": "Tersedia",
    "drive.allocationTitle": "Alokasi Penyimpanan",
    "drive.allocationDesc": "Distribusi penggunaan storage di antara akun Google Drive yang terhubung.",
    "drive.allocationPerAccount": "Detail Alokasi per Akun",
    "drive.allocationPerAccountDesc": "Ruangan tersedia pada tiap akun (urutan prioritas unggah).",
    "drive.selectAccount": "Pilih akun Google Drive",
    "drive.selectAccountDesc": "Pilih salah satu akun di atas untuk mulai menjelajahi file.",
    "drive.emptyFolder": "Folder ini kosong.",
    "drive.folder": "Folder",
    "drive.newFolder": "Folder Baru",
    "drive.createFolder": "Buat Folder Baru",
    "drive.createFolderDesc": "Folder akan dibuat di dalam {name}.",
    "drive.folderName": "Nama folder",
    "drive.create": "Buat",
    "drive.deleteFile": "Hapus file",
    "drive.deleteFileDesc": "Yakin ingin menghapus {name} dari Google Drive? Tindakan ini tidak dapat dibatalkan.",
    "drive.uploadMode": "Mode Unggah",
    "drive.uploadModeManual": "Manual",
    "drive.uploadModeAuto": "Otomatis",
    "drive.uploadModeManualDesc": "Pilih sendiri akun tujuan.",
    "drive.uploadModeAutoDesc": "Sistem memilih akun otomatis sesuai metode alokasi.",
    "drive.strategy": "Metode Alokasi",
    "drive.strategyDesc": "Tentukan bagaimana file didistribusikan ke akun terhubung.",
    "drive.customOrder": "Urutan Custom",
    "drive.customOrderDesc": "Atur prioritas akun untuk metode Custom order.",
    "drive.moveUp": "Naik",
    "drive.moveDown": "Turun",
    "drive.storageInfo": "Penyimpanan: {used} dari {total}",

    // ── Allocation strategies ──
    "alloc.round_robin": "Round Robin",
    "alloc.weighted_round_robin": "Weighted Round Robin",
    "alloc.least_used": "Least Used",
    "alloc.most_free": "Most Free Space",
    "alloc.custom": "Custom order",

    // ── Settings / language ──
    "settings.language": "Bahasa",
    "settings.languageDesc": "Pilih bahasa antarmuka aplikasi.",

    // ── Extra translations (merged) ──
    ...extra1.id,
    ...extra2.id,
    ...extra3.id,
    ...extra4.id,
    ...extra5.id,
    ...extra6.id,
    ...extra7.id,
    ...extra8.id,
    ...extra9.id,
    ...extra10.id,
    ...extra11.id,
    ...extra12.id,
    ...extra13.id,
    ...extra14.id,
  },
  en: {
    // ── Common actions ──
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.create": "Create",
    "action.close": "Close",
    "action.confirm": "Confirm",
    "action.back": "Back",
    "action.loading": "Loading...",
    "action.search": "Search",
    "action.upload": "Upload",
    "action.download": "Download",
    "action.refresh": "Refresh",
    "action.add": "Add",
    "action.connect": "Connect",
    "action.disconnect": "Disconnect",

    // ── Navbar / sidebar ──
    "nav.section.main": "Main",
    "nav.section.learning": "Learning",
    "nav.section.communication": "Communication",
    "nav.section.tools": "Tools",
    "nav.section.account": "Account",
    "nav.dashboard": "Dashboard",
    "nav.files": "File Manager",
    "nav.drive": "Google Drive",
    "nav.settings": "Settings",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    "nav.language": "Language",
    "nav.theme": "Theme",
    "nav.classChair": "Class Chair",
    "nav.tasks": "Task Manager",
    "nav.calendar": "Calendar",
    "nav.courses": "Courses",
    "nav.elearning": "E-Learning",
    "nav.statistics": "Statistics",
    "nav.notifications": "Notifications",
    "nav.announcements": "Announcements",
    "nav.broadcast": "Broadcast",
    "nav.whatsapp": "WhatsApp",
    "nav.forum": "Discussion Forum",
    "nav.chat": "Global Chat",
    "nav.repository": "Repository",
    "nav.notes": "Sticky Notes",
    "nav.aiAssistant": "AI Assistant",
    "nav.ocr": "Schedule OCR",
    "nav.activity": "Activity Log",
    "nav.tickets": "Support Tickets",
    "nav.adminPanel": "Admin Panel",
    "nav.members": "Class Members",
    "nav.spreadsheets": "Spreadsheets",

    // ── Drive ──
    "drive.title": "Google Drive",
    "drive.subtitle": "Access, manage, and upload files directly from Ruang Ketua.",
    "drive.connectAccount": "Connect Account",
    "drive.noAccounts": "No Google Drive connected yet",
    "drive.noAccountsDesc": "Click “Connect Account” to link your Google Drive and start managing files here.",
    "drive.connectDrive": "Connect Google Drive",
    "drive.connectedAccounts": "Connected Accounts",
    "drive.overview": "Overview",
    "drive.allocation": "Allocation",
    "drive.files": "Files",
    "drive.totalStorage": "Total Storage",
    "drive.used": "Used",
    "drive.available": "Available",
    "drive.allocationTitle": "Storage Allocation",
    "drive.allocationDesc": "Distribution of storage usage across connected Google Drive accounts.",
    "drive.allocationPerAccount": "Allocation per Account",
    "drive.allocationPerAccountDesc": "Free space on each account (upload priority order).",
    "drive.selectAccount": "Select a Google Drive account",
    "drive.selectAccountDesc": "Pick one of the accounts above to start browsing files.",
    "drive.emptyFolder": "This folder is empty.",
    "drive.folder": "Folder",
    "drive.newFolder": "New Folder",
    "drive.createFolder": "Create New Folder",
    "drive.createFolderDesc": "The folder will be created inside {name}.",
    "drive.folderName": "Folder name",
    "drive.create": "Create",
    "drive.deleteFile": "Delete file",
    "drive.deleteFileDesc": "Delete {name} from Google Drive? This action cannot be undone.",
    "drive.uploadMode": "Upload Mode",
    "drive.uploadModeManual": "Manual",
    "drive.uploadModeAuto": "Auto",
    "drive.uploadModeManualDesc": "Pick the destination account yourself.",
    "drive.uploadModeAutoDesc": "The system picks an account automatically by allocation method.",
    "drive.strategy": "Allocation Method",
    "drive.strategyDesc": "Decide how files are distributed across connected accounts.",
    "drive.customOrder": "Custom Order",
    "drive.customOrderDesc": "Set account priority for the Custom order method.",
    "drive.moveUp": "Move up",
    "drive.moveDown": "Move down",
    "drive.storageInfo": "Storage: {used} of {total}",

    // ── Allocation strategies ──
    "alloc.round_robin": "Round Robin",
    "alloc.weighted_round_robin": "Weighted Round Robin",
    "alloc.least_used": "Least Used",
    "alloc.most_free": "Most Free Space",
    "alloc.custom": "Custom order",

    // ── Settings / language ──
    "settings.language": "Language",
    "settings.languageDesc": "Choose the interface language.",

    // ── Extra translations (merged) ──
    ...extra1.en,
    ...extra2.en,
    ...extra3.en,
    ...extra4.en,
    ...extra5.en,
    ...extra6.en,
    ...extra7.en,
    ...extra8.en,
    ...extra9.en,
    ...extra10.en,
    ...extra11.en,
    ...extra12.en,
    ...extra13.en,
    ...extra14.en,
  },
};

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
  let value = dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}
