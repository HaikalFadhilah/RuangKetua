"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store";
import { ForumPost, ForumPostDetail, ForumComment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, Building2, Plus, MessageCircle, Clock,
  Trash2, Send, ArrowLeft, Loader2, AlertCircle, ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { container, item } from "@/lib/animations";
import { id as idLocale } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TabType = "PUBLIC" | "INTERNAL_CAMPUS";

// Extend types to carry role
type UserWithRole = { id: string; name: string; avatar?: string | null; className?: string | null; university?: string | null; role?: string };
type ForumPostWithRole = Omit<ForumPost, "user"> & { user: UserWithRole };
type ForumCommentWithRole = Omit<ForumComment, "user"> & { user: UserWithRole };
type ForumPostDetailWithRole = Omit<ForumPostDetail, "user" | "comments"> & { user: UserWithRole; comments: ForumCommentWithRole[] };

const itemAnimation = item;

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// ── Post Card ────────────────────────────────────────────
function PostCard({
  post, currentUserId, currentUserRole, onOpen, onDelete,
}: {
  post: ForumPostWithRole;
  currentUserId: string;
  currentUserRole?: string;
  onOpen: (post: ForumPostWithRole) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const isAuthorAdmin = post.user?.role === "admin";
  const canDelete = post.userId === currentUserId || currentUserRole === "admin";

  return (
    <Card
      className={`cursor-pointer hover:border-primary/40 transition-colors ${isAuthorAdmin ? "border-amber-500/30 bg-amber-500/[0.03]" : ""}`}
      onClick={() => onOpen(post)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className={`text-xs ${isAuthorAdmin ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
                {isAuthorAdmin ? <ShieldAlert className="h-4 w-4" /> : getInitials(post.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {isAuthorAdmin ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    {t("forum.admin")}
                  </span>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm truncate">{post.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {post.user.className && `${post.user.className} · `}
                    {post.user.university || t("forum.universityNotSet")}
                  </p>
                </>
              )}
            </div>
          </div>
          {canDelete && (
            <button
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-semibold text-base mb-1 line-clamp-2">{post.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {t("forum.commentsCount", { count: post._count.comments })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Comment Item ─────────────────────────────────────────
function CommentItem({
  comment, currentUserId, currentUserRole, postId, onDeleted,
}: {
  comment: ForumCommentWithRole;
  currentUserId: string;
  currentUserRole?: string;
  postId: string;
  onDeleted: (id: string) => void;
}) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const isAuthorAdmin = comment.user?.role === "admin";
  const canDelete = comment.userId === currentUserId || currentUserRole === "admin";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/forum/${postId}/comments?commentId=${comment.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onDeleted(comment.id);
      toast.success(t("forum.commentDeleted"));
    } catch {
      toast.error(t("forum.commentDeleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex gap-3 py-3 border-b border-border/50 last:border-0 ${isAuthorAdmin ? "bg-amber-500/[0.04] -mx-1 px-1 rounded-lg" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback className={`text-xs ${isAuthorAdmin ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-secondary text-secondary-foreground"}`}>
          {isAuthorAdmin ? <ShieldAlert className="h-4 w-4" /> : getInitials(comment.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isAuthorAdmin ? (
            <span className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              {t("forum.admin")}
            </span>
          ) : (
            <>
              <span className="font-semibold text-sm">{comment.user.name}</span>
              {comment.user.university && (
                <span className="text-xs text-muted-foreground">{comment.user.university}</span>
              )}
            </>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90">{comment.content}</p>
      </div>
      {canDelete && (
        <button
          disabled={deleting}
          onClick={handleDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors pt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Post List ─────────────────────────────────────────────
function PostList({
  posts, loading, currentUserId, currentUserRole, onOpen, onDelete, hasMore, onLoadMore,
}: {
  posts: ForumPostWithRole[];
  loading: boolean;
  currentUserId: string;
  currentUserRole?: string;
  onOpen: (p: ForumPostWithRole) => void;
  onDelete: (id: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useI18n();
  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!loading && posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">{t("forum.emptyTitle")}</p>
        <p className="text-sm mt-1">{t("forum.emptyDesc")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" disabled={loading} onClick={onLoadMore}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("forum.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ForumPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("PUBLIC");

  const [posts, setPosts] = useState<ForumPostWithRole[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [openPost, setOpenPost] = useState<ForumPostDetailWithRole | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);

  // ── Fetch posts ──────────────────────────────────────
  const fetchPosts = useCallback(
    async (reset = false) => {
      setLoadingPosts(true);
      const currentPage = reset ? 1 : page;
      try {
        const res = await fetch(`/api/forum?category=${activeTab}&page=${currentPage}&limit=15`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        if (reset) { setPosts(data.data); setPage(1); }
        else { setPosts((prev) => [...prev, ...data.data]); }
        setHasMore(data.pagination ? currentPage < data.pagination.totalPages : false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("forum.loadError"));
      } finally {
        setLoadingPosts(false);
      }
    },
    [activeTab, page]
  );

  useEffect(() => { fetchPosts(true); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open detail ──────────────────────────────────────
  const handleOpenPost = async (post: ForumPostWithRole) => {
    setLoadingDetail(true);
    setOpenPost(null);
    try {
      const res = await fetch(`/api/forum/${post.id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setOpenPost(data.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("forum.openError"));
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Delete post ──────────────────────────────────────
  const handleDeletePost = async (id: string) => {
    setDeletePostTarget(id);
  };

  const confirmDeletePost = async () => {
    if (!deletePostTarget) return;
    setDeletingPost(true);
    try {
      const res = await fetch(`/api/forum/${deletePostTarget}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPosts((prev) => prev.filter((p) => p.id !== deletePostTarget));
      toast.success(t("forum.postDeleted"));
    } catch {
      toast.error(t("forum.postDeleteError"));
    } finally {
      setDeletingPost(false);
      setDeletePostTarget(null);
    }
  };

  // ── Send comment ─────────────────────────────────────
  const handleSendComment = async () => {
    if (!commentInput.trim() || !openPost) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/forum/${openPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setOpenPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.data], _count: { comments: prev._count.comments + 1 } } : prev
      );
      setPosts((prev) =>
        prev.map((p) => p.id === openPost.id ? { ...p, _count: { comments: p._count.comments + 1 } } : p)
      );
      setCommentInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("forum.commentSendError"));
    } finally {
      setSendingComment(false);
    }
  };

  // ── Create post ──────────────────────────────────────
  const handleCreatePost = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error(t("forum.titleContentRequired"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, category: activeTab }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPosts((prev) => [data.data, ...prev]);
      setCreateForm({ title: "", content: "" });
      setShowCreateDialog(false);
      toast.success(t("forum.createSuccess"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("forum.createError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemAnimation} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("forum.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("forum.subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("forum.createPost")}
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemAnimation}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
            <TabsTrigger value="PUBLIC" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> {t("forum.public")}
            </TabsTrigger>
            <TabsTrigger value="INTERNAL_CAMPUS" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {t("forum.myCampus")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="PUBLIC" className="space-y-4 m-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {t("forum.publicInfo")}
            </div>
            <PostList
              posts={posts} loading={loadingPosts}
              currentUserId={user?.userId ?? ""}
              currentUserRole={user?.role}
              onOpen={handleOpenPost} onDelete={handleDeletePost}
              hasMore={hasMore} onLoadMore={() => { const n = page + 1; setPage(n); fetchPosts(false); }}
            />
          </TabsContent>

          <TabsContent value="INTERNAL_CAMPUS" className="space-y-4 m-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {t("forum.campusInfoPrefix")}{" "}
              <span className="font-semibold text-foreground">{user?.university || t("forum.campusInfoDefault")}</span>{" "}
              {t("forum.campusInfoSuffix")}
              {!user?.university && user?.role !== "admin" && (
                <span className="ml-1 text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {t("forum.campusNotSetProfile")}
                </span>
              )}
            </div>
            <PostList
              posts={posts} loading={loadingPosts}
              currentUserId={user?.userId ?? ""}
              currentUserRole={user?.role}
              onOpen={handleOpenPost} onDelete={handleDeletePost}
              hasMore={hasMore} onLoadMore={() => { const n = page + 1; setPage(n); fetchPosts(false); }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Detail Post Dialog ── */}
      <Dialog
        open={!!openPost || loadingDetail}
        onOpenChange={(open) => { if (!open) { setOpenPost(null); setCommentInput(""); } }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          {loadingDetail ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : openPost ? (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => { setOpenPost(null); setCommentInput(""); }} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Badge variant="outline" className="text-xs">
                    {openPost.category === "PUBLIC" ? <><Globe className="h-3 w-3 mr-1" />{t("forum.public")}</> : <><Building2 className="h-3 w-3 mr-1" />{t("forum.myCampus")}</>}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{openPost.title}</DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={`text-xs ${openPost.user?.role === "admin" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
                      {openPost.user?.role === "admin" ? <ShieldAlert className="h-4 w-4" /> : getInitials(openPost.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 flex-wrap">
                    {openPost.user?.role === "admin" ? (
                      <span className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        {t("forum.admin")}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{openPost.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {openPost.user.className && `${openPost.user.className} · `}
                          {openPost.user.university || t("forum.universityNotSet")}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">{timeAgo(openPost.createdAt)}</span>
                </div>
              </DialogHeader>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-6">{openPost.content}</p>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-3">{t("forum.commentsHeading", { count: openPost._count.comments })}</h4>
                  {openPost.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{t("forum.noComments")}</p>
                  ) : (
                    openPost.comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        currentUserId={user?.userId ?? ""}
                        currentUserRole={user?.role}
                        postId={openPost.id}
                        onDeleted={(cid) =>
                          setOpenPost((prev) =>
                            prev ? { ...prev, comments: prev.comments.filter((x) => x.id !== cid), _count: { comments: prev._count.comments - 1 } } : prev
                          )
                        }
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Comment input */}
              <div className="border-t border-border px-6 py-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("forum.commentPlaceholder")}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    className="flex-1"
                  />
                  <Button size="icon" disabled={!commentInput.trim() || sendingComment} onClick={handleSendComment}>
                    {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Create Post Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("forum.createDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              {activeTab === "PUBLIC"
                ? <><Globe className="h-3.5 w-3.5" />{t("forum.postToTabPrefix")} <strong>{t("forum.public")}</strong>{t("forum.postToPublicSuffix")}</>
                : <><Building2 className="h-3.5 w-3.5" />{t("forum.postToTabPrefix")} <strong>{t("forum.myCampus")}</strong>{t("forum.postToCampusSuffix")}</>}
            </div>
            <div className="space-y-2">
              <Label>{t("forum.labelTitle")}</Label>
              <Input
                placeholder={t("forum.titlePlaceholder")}
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("forum.labelContent")}</Label>
              <Textarea
                placeholder={t("forum.contentPlaceholder")}
                rows={5}
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("action.cancel")}</Button>
            <Button disabled={creating} onClick={handleCreatePost}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("forum.post")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletePostTarget}
        onOpenChange={(o) => { if (!o) setDeletePostTarget(null); }}
        title="Hapus postingan ini?"
        description="Postingan beserta semua komentar di dalamnya akan dihapus secara permanen."
        confirmLabel="Hapus Postingan"
        loading={deletingPost}
        onConfirm={confirmDeletePost}
      />
    </motion.div>
  );
}
