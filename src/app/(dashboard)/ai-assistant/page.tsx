"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, Sparkles, FileText, Bell, MessageSquare, Search as SearchIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { label: "Buat Pengumuman", icon: FileText, prompt: "Buatkan pengumuman kelas untuk tugas baru mata kuliah Pemrograman Web dengan deadline minggu depan." },
  { label: "Pesan Dosen", icon: MessageSquare, prompt: "Buatkan pesan sopan untuk mengingatkan dosen agar mengupload materi kuliah minggu ini." },
  { label: "Buat Reminder", icon: Bell, prompt: "Buatkan reminder untuk e-learning yang akan ditutup 3 hari lagi." },
  { label: "Cari Deadline", icon: SearchIcon, prompt: "Carikan deadline tugas terdekat yang belum selesai." },
];

export default function AIAssistantPage() {
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
        toast.error(data.error || "AI tidak dapat merespons");
      }
    } catch {
      toast.error("Gagal menghubungi AI");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat dibersihkan");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Asisten AI untuk membantu tugas Ketua Kelas</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan Chat
          </Button>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickPrompts.map((qp) => (
            <Card key={qp.label} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => sendMessage(qp.prompt)}>
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className="p-2 rounded-lg bg-primary/10">
                  <qp.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{qp.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <RuangKetuaLogo size={64} className="opacity-20 mb-4" />
            <h2 className="text-xl font-semibold">Halo! Saya AI Assistant</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Saya bisa membantu membuat pengumuman, pesan dosen, reminder, merangkum materi, dan banyak lagi.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <RuangKetuaLogo size={28} />
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
                <RuangKetuaLogo size={28} />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Mengetik...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        <Textarea
          placeholder="Ketik pesan untuk AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} size="icon" className="h-[52px] w-[52px]">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </motion.div>
  );
}
