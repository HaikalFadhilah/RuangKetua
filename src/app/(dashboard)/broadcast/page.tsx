"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radio,
  Send,
  Users,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Sparkles,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { ANNOUNCEMENT_CATEGORIES } from "@/config/constants";
import toast from "react-hot-toast";

interface WAGroup {
  id: string;
  subject: string;
  size: number;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const TEMPLATES: Record<string, string> = {
  deadline: "📋 *REMINDER TUGAS*\n\nHai teman-teman! Jangan lupa ada tugas yang harus dikerjakan:\n\n📚 Mata Kuliah: {mataKuliah}\n📝 Tugas: {judul}\n📅 Deadline: {deadline}\n\nJangan sampai telat ya! 💪",
  announcement: "📢 *PENGUMUMAN KELAS*\n\n{pesan}\n\n— Ketua Kelas",
  elearning: "🖥️ *REMINDER E-LEARNING*\n\nHai teman-teman! E-Learning sudah dibuka:\n\n📚 {mataKuliah}\n📅 Batas pengerjaan: {deadline}\n\nKerjakan sebelum ditutup ya! 🔥",
  schedule: "📅 *INFO JADWAL*\n\n{pesan}\n\nMohon diperhatikan. Terima kasih! 🙏",
};

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [groups, setGroups] = useState<WAGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [broadcastHistory, setBroadcastHistory] = useState<{ message: string; groups: number; time: string }[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setIsConnected(data.data.connected);
        setGroups(data.data.groups || []);
      }
    } catch { /* silent */ }
    finally { setIsLoadingStatus(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    if (val && TEMPLATES[val]) {
      setMessage(TEMPLATES[val]);
    }
  };

  const handleAIGenerate = async () => {
    if (!message.trim()) { toast.error("Tulis draft pesan terlebih dahulu"); return; }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, type: template || "general" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessage(data.data);
        toast.success("Pesan di-generate oleh AI!");
      } else {
        toast.error("Gagal generate pesan AI");
      }
    } catch { toast.error("AI API tidak tersedia"); }
    finally { setIsGenerating(false); }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const selectAllGroups = () => {
    if (selectedGroups.length === groups.length) setSelectedGroups([]);
    else setSelectedGroups(groups.map((g) => g.id));
  };

  const handleBroadcast = async () => {
    if (!message.trim()) { toast.error("Pesan tidak boleh kosong"); return; }
    if (selectedGroups.length === 0) { toast.error("Pilih minimal 1 grup target"); return; }
    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, groupIds: selectedGroups }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Broadcast berhasil dikirim ke ${selectedGroups.length} grup!`);
        setBroadcastHistory((prev) => [
          { message: message.substring(0, 100), groups: selectedGroups.length, time: new Date().toLocaleString("id-ID") },
          ...prev,
        ]);
        setMessage("");
        setSelectedGroups([]);
      } else {
        toast.error(data.error || "Gagal mengirim broadcast");
      }
    } catch { toast.error("Gagal mengirim broadcast"); }
    finally { setIsSending(false); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-muted-foreground text-sm mt-1">Kirim pesan broadcast ke grup WhatsApp</p>
      </motion.div>

      {/* Connection Status */}
      <motion.div variants={item}>
        {isLoadingStatus ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : !isConnected ? (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">WhatsApp belum terhubung. Hubungkan terlebih dahulu di halaman WhatsApp.</span>
              </div>
              <Button variant="outline" size="sm" asChild><a href="/whatsapp">Hubungkan</a></Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-400">WhatsApp terhubung • {groups.length} grup tersedia</span>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Compose */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Radio className="h-4 w-4 text-green-400" />Tulis Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <select
                  value={template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih template (opsional)</option>
                  <option value="deadline">📋 Reminder Tugas</option>
                  <option value="announcement">📢 Pengumuman</option>
                  <option value="elearning">🖥️ Reminder E-Learning</option>
                  <option value="schedule">📅 Info Jadwal</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pesan</Label>
                  <Button variant="ghost" size="sm" onClick={handleAIGenerate} disabled={isGenerating} className="text-xs h-7">
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generate AI
                  </Button>
                </div>
                <Textarea placeholder="Tulis pesan broadcast..." value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
                <p className="text-xs text-muted-foreground">{message.length} karakter • Gunakan *bold* dan _italic_ untuk formatting WhatsApp</p>
              </div>
              <Button onClick={handleBroadcast} disabled={isSending || !isConnected} className="w-full">
                {isSending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Mengirim ke {selectedGroups.length} grup...</>
                ) : (
                  <><Send className="h-4 w-4" />Kirim Broadcast ({selectedGroups.length} grup)</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          {/* Target Groups */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" />Target Grup</span>
                  {groups.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllGroups}>
                      {selectedGroups.length === groups.length ? "Batal Semua" : "Pilih Semua"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Hubungkan WhatsApp untuk memilih grup target</p>
                ) : groups.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Tidak ada grup ditemukan</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchStatus}><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border w-full text-left transition-all cursor-pointer ${
                          selectedGroups.includes(g.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          selectedGroups.includes(g.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {selectedGroups.includes(g.id) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{g.subject}</p>
                          <p className="text-xs text-muted-foreground">{g.size} anggota</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Broadcast History (session-only) */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-400" />Riwayat Broadcast</CardTitle>
              </CardHeader>
              <CardContent>
                {broadcastHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada broadcast yang dikirim</p>
                ) : (
                  <div className="space-y-2">
                    {broadcastHistory.map((h, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border/50 space-y-1">
                        <p className="text-sm line-clamp-2">{h.message}...</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">{h.groups} grup</Badge>
                          <span>{h.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
