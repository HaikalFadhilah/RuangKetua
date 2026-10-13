"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebarStore, useAuthStore } from "@/store";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  ListTodo,
  BookOpen,
  CalendarDays,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  MessageCircle,
  GraduationCap,
  FolderOpen,
  Bell,
  BarChart3,
  Bot,
  FolderClosed,
  Users,
  StickyNote,
  Activity,
  Settings,
  ChevronLeft,
  X,
  ShieldAlert,
  LifeBuoy,
  BellRing,
  HardDrive,
  Sheet,
  AlarmClock,
  ScanText,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    titleKey: "nav.section.main",
    items: [
      { key: "nav.dashboard",   href: "/dashboard",   icon: LayoutDashboard },
      { key: "nav.tasks",       href: "/tasks",        icon: ListTodo },
      { key: "nav.calendar",    href: "/calendar",     icon: CalendarDays },
      { key: "nav.reminders",   href: "/reminders",    icon: AlarmClock },
      { key: "nav.statistics",  href: "/statistics",   icon: BarChart3 },
    ],
  },
  {
    titleKey: "nav.section.learning",
    items: [
      { key: "nav.courses",    href: "/courses",    icon: GraduationCap },
      { key: "nav.elearning",  href: "/elearning",  icon: BookOpen },
      { key: "nav.repository", href: "/repository", icon: FolderOpen },
    ],
  },
  {
    titleKey: "nav.section.communication",
    items: [
      { key: "nav.announcements", href: "/announcements", icon: Bell },
      { key: "nav.notifications", href: "/notifications", icon: BellRing },
      { key: "nav.broadcast",     href: "/broadcast",     icon: Megaphone },
      { key: "nav.chat",          href: "/chat",           icon: MessageCircle },
      { key: "nav.forum",         href: "/forum",          icon: MessagesSquare },
      { key: "nav.whatsapp",      href: "/whatsapp",       icon: MessageSquare },
    ],
  },
  {
    titleKey: "nav.section.tools",
    items: [
      { key: "nav.drive",         href: "/drive",         icon: HardDrive },
      { key: "nav.files",         href: "/files",         icon: FolderClosed },
      { key: "nav.spreadsheets",  href: "/spreadsheets",  icon: Sheet },
      { key: "nav.members",       href: "/members",       icon: Users },
      { key: "nav.notes",       href: "/notes",        icon: StickyNote },
      { key: "nav.aiAssistant", href: "/ai-assistant", icon: Bot },
      { key: "nav.ocr",         href: "/ocr",          icon: ScanText },
    ],
  },
  {
    titleKey: "nav.section.account",
    items: [
      { key: "nav.activity", href: "/activity", icon: Activity },
      { key: "nav.tickets",  href: "/tickets",  icon: LifeBuoy },
      { key: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebarStore();
  const { user } = useAuthStore();
  const { t } = useI18n();

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
          isOpen ? "w-60" : "w-[70px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <RuangKetuaLogo size={32} />
            {isOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold leading-none text-sidebar-foreground whitespace-nowrap">Ruang Ketua</p>
                <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Workspace</p>
              </div>
            )}
          </Link>

          {/* Close mobile */}
          <button onClick={closeMobile} className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>

          {/* Toggle desktop */}
          <button
            onClick={toggle}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md hover:bg-sidebar-accent/10 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.titleKey} className="space-y-0.5">
              {/* Section heading — only when expanded */}
              {isOpen && (
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {t(section.titleKey)}
                </p>
              )}
              {/* Divider when collapsed */}
              {!isOpen && (
                <div className="mx-3 mb-1 mt-1 h-px bg-sidebar-border/60" />
              )}

              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    title={!isOpen ? t(item.key) : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">{t(item.key)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin Panel — bottom sticky */}
        {user?.role === "admin" && (
          <div className="border-t border-sidebar-border p-3 shrink-0">
            <Link
              href="/rk-dashboard"
              onClick={closeMobile}
              title={!isOpen ? t("nav.adminPanel") : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150",
                pathname === "/rk-dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-foreground hover:bg-muted/60 border border-sidebar-border"
              )}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {isOpen && (
                <span className="whitespace-nowrap truncate">{t("nav.adminPanel")}</span>
              )}
            </Link>
          </div>
        )}

        {/* Footer */}
        {isOpen && (
          <div className="border-t border-sidebar-border px-4 py-3 shrink-0">
            <p className="text-[10px] text-sidebar-foreground/30 text-center">
              Ruang Ketua v1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
