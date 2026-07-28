"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { BlogManager } from "@/components/admin/blog-manager";
import { useI18n } from "@/lib/i18n";

export default function AdminBlogPage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/rk-dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("nav.dashboard")}
          </Link>
          <span className="text-border">/</span>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" /> {t("blog.manage")}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 space-y-4">
        <BlogManager />
      </main>
    </div>
  );
}
