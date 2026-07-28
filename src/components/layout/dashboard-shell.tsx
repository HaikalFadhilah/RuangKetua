"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BroadcastBanner } from "@/components/system/broadcast-banner";
import { useSidebarStore } from "@/store";
import { cn } from "@/lib/utils";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "lg:ml-64" : "lg:ml-[70px]"
        )}
      >
        <Navbar />
        <BroadcastBanner />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
