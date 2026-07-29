import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: "published" },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artikel Tidak Ditemukan - Ruang Ketua" };
  return { title: `${post.title} - Ruang Ketua`, description: post.excerpt || undefined };
}

const markdownClass =
  "space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-1 [&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:marker:text-primary [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:rounded-xl [&_img]:border [&_img]:border-border";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <article className="relative pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/5 to-background" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Blog
          </Link>

          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {post.category}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {post.coverEmoji ? `${post.coverEmoji} ` : ""}{post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {post.readingTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {post.readingTime}
              </span>
            )}
          </div>

          <div className={`mt-10 border-t border-border pt-10 ${markdownClass}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{post.content}</ReactMarkdown>
          </div>
        </div>
      </article>

      <div className="h-16" />
      <SiteFooter />
    </div>
  );
}
