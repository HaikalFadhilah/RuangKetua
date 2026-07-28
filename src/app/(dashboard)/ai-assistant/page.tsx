"use client";

import { useI18n } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { container, item } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, FileText, Megaphone, MessagesSquare, CalendarDays, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { label: "ai.quickAnnouncement" as const, icon: FileText, prompt: "Buatkan pengumuman kelas untuk tugas baru mata kuliah Pemrograman Web dengan deadline minggu depan." },
  { label: "ai.quickBroadcast" as const, icon: Megaphone, prompt: "Bagaimana cara menggunakan fitur Broadcast WhatsApp untuk mengirim pesan ke banyak grup sekaligus?" },
  { label: "ai.quickForum" as const, icon: MessagesSquare, prompt: "Apa itu Forum Diskusi di Ruang Ketua dan bagaimana cara membuat diskusi baru?" },
  { label: "ai.quickTaskCalendar" as const, icon: CalendarDays, prompt: "Apa bedanya Task Manager dan Kalender? Kapan saya harus pakai masing-masing?" },
];

export default function AIAssistantPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: updatedMessages }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.data.reply };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        toast.error(data.error || t("ai.noResponse"));
      }
    } catch {
      toast.error(t("ai.contactError"));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success(t("ai.chatCleared"));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            {t("nav.aiAssistant")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("ai.subtitle")}</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-3.5 w-3.5" />
            {t("ai.clearChat")}
          </Button>
        )}
      </motion.div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickPrompts.map((qp) => (
            <Card key={qp.label} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => sendMessage(qp.prompt)}>
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className="p-2 rounded-lg bg-primary/10">
                  <qp.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{t(qp.label)}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Chat Area */}
      <motion.div variants={item} className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <RuangKetuaLogo size={64} className="opacity-20 mb-4" />
            <h2 className="text-xl font-semibold">{t("ai.greeting")}</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              {t("ai.greetingDesc")}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <RuangKetuaLogo size={32} />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="shrink-0 mt-1">
                <RuangKetuaLogo size={32} />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t("ai.typing")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </motion.div>

      {/* Input Area */}
      <motion.div variants={item} className="flex gap-3 items-end">
        <Textarea
          placeholder={t("ai.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} size="icon" className="h-[52px] w-[52px]">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </motion.div>
    </motion.div>
  );
}
