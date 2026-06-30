import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 30) return `${days} hari lalu`;
    return formatDate(d);
  } else {
    if (minutes < 1) return "Sekarang";
    if (minutes < 60) return `${minutes} menit lagi`;
    if (hours < 24) return `${hours} jam lagi`;
    if (days < 30) return `${days} hari lagi`;
    return formatDate(d);
  }
}

export function getDeadlineColor(deadline: Date | string): string {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "text-red-500";
  if (days <= 1) return "text-red-400";
  if (days <= 3) return "text-orange-400";
  if (days <= 7) return "text-yellow-400";
  return "text-green-400";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "HIGH": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "MEDIUM": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "LOW": return "bg-green-500/10 text-green-500 border-green-500/20";
    default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "IN_PROGRESS": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "PENDING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "OVERDUE": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
