"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Building2, Send, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { container, item } from "@/lib/animations";
import { useI18n } from "@/lib/i18n";

type TabType = "PUBLIC" | "INTERNAL_CAMPUS";

const itemAnimation = item;

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

type ChatMessageWithRole = ChatMessage & { user: ChatMessage["user"] & { role?: string } };

export default function ChatPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("PUBLIC");
  const [messages, setMessages] = useState<ChatMessageWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`/api/chat?category=${activeTab}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const reversed = (data.data as ChatMessageWithRole[]).reverse();
      setMessages(reversed);
    } catch {
      if (!isBackground) toast.error(t("chat.loadError"));
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim()) return;

    if (activeTab === "INTERNAL_CAMPUS" && !user?.university && user?.role !== "admin") {
      toast.error(t("chat.campusNotSet"));
      return;
    }

    setSending(true);
    const tempMsg = inputMsg.trim();
    setInputMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMsg, category: activeTab }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages((prev) => [...prev, data.data]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("chat.sendError"));
      setInputMsg(tempMsg);
    } finally {
      setSending(false);
    }
  };

  const renderMessageBubble = (msg: ChatMessageWithRole) => {
    const isMe = msg.userId === user?.userId;
    const isAdmin = msg.user?.role === "admin";

    const bubbleClass = isMe
      ? isAdmin
        ? "bg-amber-500 text-white rounded-tr-sm shadow-md"
        : "bg-primary text-primary-foreground rounded-tr-sm"
      : isAdmin
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-tl-sm"
        : "bg-muted text-foreground border border-border rounded-tl-sm";

    const avatarClass = isAdmin
      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
      : "bg-secondary text-secondary-foreground";

    return (
      <div key={msg.id} className={`flex gap-3 mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && (
          <Avatar className="h-8 w-8 mt-1 shrink-0">
            <AvatarFallback className={`text-[10px] ${avatarClass}`}>
              {isAdmin ? <ShieldAlert className="h-4 w-4" /> : getInitials(msg.user.name)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {!isMe && (
            <div className="flex items-center gap-1.5 ml-1 mb-1">
              {isAdmin ? (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {t("chat.admin")}
                </span>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  {msg.user.name}
                  {msg.user.university && ` • ${msg.user.university}`}
                </span>
              )}
            </div>
          )}

          {isMe && isAdmin && (
            <div className="flex items-center gap-1 mr-1 mb-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> {t("chat.admin")}
              </span>
            </div>
          )}

          <div
            className={`px-4 py-2.5 rounded-2xl text-sm ${bubbleClass}`}
            style={{ wordBreak: "break-word" }}
          >
            {msg.content}
          </div>

          <span className="text-[10px] text-muted-foreground mt-1 opacity-70">
            {format(new Date(msg.createdAt), "HH:mm")}
          </span>
        </div>
      </div>
    );
  };

  const canSendInCampus = user?.role === "admin" || !!user?.university;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      <motion.div variants={itemAnimation}>
        <h1 className="text-2xl font-bold tracking-tight">{t("chat.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("chat.subtitle")}</p>
      </motion.div>

      <motion.div variants={itemAnimation} className="flex flex-col flex-1 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4 shrink-0">
            <TabsTrigger value="PUBLIC" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> {t("chat.public")}
            </TabsTrigger>
            <TabsTrigger value="INTERNAL_CAMPUS" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {t("chat.myCampus")}
            </TabsTrigger>
          </TabsList>

          {activeTab === "INTERNAL_CAMPUS" && !canSendInCampus && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 shrink-0">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{t("chat.campusWarnPrefix")}<b>{t("chat.campusWarnUniversity")}</b>{t("chat.campusWarnMiddle")}<a href="/settings" className="underline font-semibold">{t("chat.campusWarnSettings")}</a>{t("chat.campusWarnSuffix")}</p>
            </div>
          )}

          <TabsContent value={activeTab} className="flex-1 min-h-0 m-0 mt-0 data-[state=active]:flex flex-col">
            <div className="flex-1 bg-card border border-border sm:rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden relative">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <Globe className="h-12 w-12 mb-2" />
                    <p>{t("chat.empty")}</p>
                  </div>
                ) : (
                  messages.map(renderMessageBubble)
                )}
              </div>

              <div className="p-3 border-t border-border bg-muted/20 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <Input
                    placeholder={t("chat.placeholder")}
                    className="flex-1 rounded-full bg-background pr-12 focus-visible:ring-primary/50 border-input shadow-sm"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    disabled={sending || (activeTab === "INTERNAL_CAMPUS" && !canSendInCampus)}
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full shadow-md shrink-0 absolute right-1 top-1 h-8 w-8"
                    disabled={!inputMsg.trim() || sending || (activeTab === "INTERNAL_CAMPUS" && !canSendInCampus)}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
