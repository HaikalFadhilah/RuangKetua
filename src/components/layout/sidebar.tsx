"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
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
  ChevronLeft,
  X,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Task Manager", href: "/tasks", icon: ListTodo },
  { label: "E-Learning", href: "/elearning", icon: BookOpen },
  { label: "Kalender", href: "/calendar", icon: CalendarDays },
  { label: "Broadcast", href: "/broadcast", icon: Megaphone },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
  { label: "Dosen", href: "/dosen", icon: GraduationCap },
  { label: "Repository", href: "/repository", icon: FolderOpen },
  { label: "Pengumuman", href: "/announcements", icon: Bell },
  { label: "Statistik", href: "/statistics", icon: BarChart3 },
  { label: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { label: "OCR Screenshot", href: "/ocr", icon: ScanText },
  { label: "File Sharing", href: "/files", icon: Share2 },
  { label: "Sticky Notes", href: "/notes", icon: StickyNote },
  { label: "Activity Log", href: "/activity", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebarStore();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-[70px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <RuangKetuaLogo size={36} />
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-base font-bold text-sidebar-foreground whitespace-nowrap"
              >
                Ruang Ketua
              </motion.span>
            )}
          </Link>

          {/* Close mobile */}
          <button onClick={closeMobile} className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>

          {/* Toggle desktop */}
          <button
            onClick={toggle}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-accent/10 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/5 hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70")} />
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-[11px] text-sidebar-foreground/40 text-center">
              Ruang Ketua v1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
