"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuthStore, useSidebarStore } from "@/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationPanel } from "@/components/layout/notification-panel";
import {
  Menu,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, setUser, logout } = useAuthStore();
  const { toggleMobile } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch {
        // Not logged in
      }
    }
    fetchUser();
  }, [setUser]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobile}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Command Palette Search */}
        <CommandPalette />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          {mounted ? (
            theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px] opacity-0" />
          )}
        </Button>

        {/* Notifications */}
        <NotificationPanel />

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium leading-none">{user?.name || "Loading..."}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Ketua Kelas{user?.className ? ` ${user.className}` : ""}
            </span>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user?.name ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            className="text-muted-foreground hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
