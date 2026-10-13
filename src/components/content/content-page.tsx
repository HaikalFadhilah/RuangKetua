import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Reveal, RevealSection } from "@/components/motion/reveal";

export function ContentPage({
  title,
  eyebrow = "Ruang Ketua",
  updated,
  children,
}: {
  title: string;
  eyebrow?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <RevealSection className="relative overflow-hidden border-b border-border pt-28 pb-14">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.06),transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {updated && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Terakhir diperbarui: {updated}
            </div>
          )}
        </div>
      </RevealSection>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Reveal>
          <article className="space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-2 [&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:marker:text-primary [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </article>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
