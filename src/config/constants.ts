export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Ruang Ketua",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  description: "Dashboard Ketua Kelas - Asisten Digital untuk Mengelola Aktivitas Kelas",
} as const;

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "green" },
  { value: "MEDIUM", label: "Medium", color: "yellow" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "URGENT", label: "Urgent", color: "red" },
] as const;

export const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "OVERDUE", label: "Overdue" },
] as const;

export const REMINDER_OPTIONS = [
  { value: "H-7", label: "H-7 (7 hari sebelum)" },
  { value: "H-3", label: "H-3 (3 hari sebelum)" },
  { value: "H-1", label: "H-1 (1 hari sebelum)" },
  { value: "H-0", label: "Hari H" },
  { value: "2H", label: "2 Jam sebelum deadline" },
] as const;

export const ANNOUNCEMENT_CATEGORIES = [
  { value: "general", label: "Umum" },
  { value: "tugas", label: "Tugas Baru" },
  { value: "jadwal", label: "Perubahan Jadwal" },
  { value: "praktikum", label: "Praktikum" },
  { value: "ujian", label: "Ujian" },
  { value: "elearning_open", label: "E-Learning Dibuka" },
  { value: "elearning_close", label: "E-Learning Ditutup" },
] as const;

export const CALENDAR_TYPES = [
  { value: "KULIAH", label: "Kuliah", color: "#3b82f6" },
  { value: "PRAKTIKUM", label: "Praktikum", color: "#8b5cf6" },
  { value: "SEMINAR", label: "Seminar", color: "#06b6d4" },
  { value: "PRESENTASI", label: "Presentasi", color: "#f59e0b" },
  { value: "UTS", label: "UTS", color: "#ef4444" },
  { value: "UAS", label: "UAS", color: "#dc2626" },
  { value: "HOLIDAY", label: "Hari Libur", color: "#22c55e" },
  { value: "DEADLINE", label: "Deadline", color: "#f97316" },
  { value: "ELEARNING", label: "E-Learning", color: "#a855f7" },
  { value: "OTHER", label: "Lainnya", color: "#6b7280" },
] as const;

export const NOTE_COLORS = [
  { value: "yellow", label: "Kuning", class: "bg-yellow-200 dark:bg-yellow-900/50" },
  { value: "blue", label: "Biru", class: "bg-blue-200 dark:bg-blue-900/50" },
  { value: "green", label: "Hijau", class: "bg-green-200 dark:bg-green-900/50" },
  { value: "pink", label: "Pink", class: "bg-pink-200 dark:bg-pink-900/50" },
  { value: "purple", label: "Ungu", class: "bg-purple-200 dark:bg-purple-900/50" },
  { value: "orange", label: "Orange", class: "bg-orange-200 dark:bg-orange-900/50" },
] as const;

export const FILE_TYPES_ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "video/mp4",
  "video/webm",
  "image/png",
  "image/jpeg",
  "image/gif",
] as const;
