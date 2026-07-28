"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  Search,
  ListTodo,
  Megaphone,
  BookOpen,
  CalendarDays,
  Pin
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store";
import { useI18n } from "@/lib/i18n";

interface WAGroup {
  id: string;
  subject: string;
  size: number;
}

import { container, item } from "@/lib/animations";

export default function BroadcastPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");
  
  // States untuk data integrasi
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [elearnings, setElearnings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  // States Whatsapp & Groups
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [groups, setGroups] = useState<WAGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchGroup, setSearchGroup] = useState("");
  const [frequentGroups, setFrequentGroups] = useState<string[]>([]);
  
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [broadcastHistory, setBroadcastHistory] = useState<{ message: string; groups: number; time: string }[]>([]);

  // 1. Fetch seluruh data terintegrasi (Tasks, Pengumuman, ELearning, Jadwal)
  const fetchIntegrationData = useCallback(async () => {
    try {
      const [resTasks, resAnn, resLearn, resCourses] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/announcements?limit=5"), // Ambil 5 pengumuman terakhir
        fetch("/api/elearning"),
        fetch("/api/courses")
      ]);
      
      const [dTasks, dAnn, dLearn, dCourses] = await Promise.all([
        resTasks.json(), resAnn.json(), resLearn.json(), resCourses.json()
      ]);
      
      if (dTasks.success) setTasks(dTasks.data.filter((t:any) => t.status !== "COMPLETED"));
      if (dAnn.success) setAnnouncements(dAnn.data);
      if (dLearn.success) setElearnings(dLearn.data.filter((e:any) => e.isActive));
      if (dCourses.success) setCourses(dCourses.data);
    } catch {
      console.warn("Gagal load integrasi data");
    }
  }, []);

  // 2. Fetch WA Status & Groups
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

  useEffect(() => { 
    fetchStatus(); 
    fetchIntegrationData();
    // Load frequent groups (pinned behavior) dari local storage user
    const savedFav = localStorage.getItem("fav_wa_groups");
    if(savedFav) setFrequentGroups(JSON.parse(savedFav));
  }, [fetchStatus, fetchIntegrationData]);

  // Generate Auto-Signature berdasarkan profile User
  const getSignature = () => {
    const className = user?.className ? `Kelas ${user.className}` : "Ketua Kelas";
    const university = user?.university ? `\n🏫 ${user.university}` : "";
    return `\n\n━━━━━━━━━━━━━━━━\n👤 *${user?.name || "Ketua"}*\n📌 ${className}${university}`;
  };

  // 3. Logic Pemilihan Template Data Integrasi
  const handleIntegrationSelect = (type: string, data: any) => {
    setTemplate(type);
    let draft = "";
    
    if (type === "task") {
      const courseName = data.course?.name ? `📚 Mata Kuliah: ${data.course.name}\n` : "";
      const deadline = data.deadline ? format(new Date(data.deadline), "EEEE, dd MMM yyyy HH:mm", { locale: idLocale }) : "Belum ditentukan";
      draft = `🚨 *REMINDER TUGAS PENTING* 🚨\n\n${courseName}📝 Tugas: *${data.title}*\n⏳ Deadline: *${deadline}*\n\n⚠️ Harap segera diselesaikan dan jangan sampai terlambat!`;
      if(data.description) draft += `\n\nCatatan:\n_${data.description}_`;
    } 
    else if (type === "announcement") {
      draft = `📢 *PENGUMUMAN KELAS* 📢\n\n*${data.title}*\n\n${data.content}`;
    }
    else if (type === "elearning") {
      const courseName = data.course?.name || "Mata Kuliah Umum";
      const end = format(new Date(data.endDate), "dd MMM yyyy HH:mm", { locale: idLocale });
      draft = `💻 *INFO E-LEARNING* 💻\n\n📚 Mata Kuliah: *${courseName}*\n📑 Topik: ${data.title}\n⏰ Ditutup pada: *${end}*\n\nMohon segera login ke portal E-Learning kampus dan selesaikan absen / tugasnya!`;
    }
    else if (type === "course") {
      draft = `📆 *INFO JADWAL KULIAH* 📆\n\n📚 Mata Kuliah: *${data.name}*\n👨‍🏫 Dosen: ${data.dosenName || "-"}\n⏰ Jadwal: ${data.schedule || "-"}\n\nPersiapkan materi dan pastikan hadir tepat waktu ya.`;
    }

    setMessage(draft + getSignature());
  };

  // 4. Generate AI Berbasis Integrasi Content
  const handleAIGenerate = async () => {
    if (!message.trim()) { toast.error(t("broadcast.toast.writeFirst")); return; }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, type: template || "general" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Hapus auto-sign lama jika AI meregenerate ulang, lalu tempel tanda tangan paten kita
        let aiMsg = data.data.replace(/━━━━━━━━━━━━━━━━[\s\S]*/g, ""); 
        setMessage(aiMsg.trim() + getSignature());
        toast.success(t("broadcast.toast.aiDone"));
      } else {
        toast.error(t("broadcast.toast.aiError"));
      }
    } catch { toast.error(t("broadcast.toast.aiUnavailable")); }
    finally { setIsGenerating(false); }
  };

  // Logic Toggle & Search Groups
  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };
  const selectAllFilteredGroups = () => {
    if (selectedGroups.length === filteredGroups.length) setSelectedGroups([]);
    else setSelectedGroups(filteredGroups.map((g) => g.id));
  };
  
  // Toggling Pin Favorite Group
  const toggleFrequentGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let newFavs = [];
    if(frequentGroups.includes(id)) {
      newFavs = frequentGroups.filter(x => x !== id);
    } else {
      newFavs = [...frequentGroups, id];
    }
    setFrequentGroups(newFavs);
    localStorage.setItem("fav_wa_groups", JSON.stringify(newFavs));
  }

  // Pengurutan Grup (Favorite di atas, sisa nyusul)
  const filteredGroups = groups
    .filter(g => g.subject.toLowerCase().includes(searchGroup.toLowerCase()))
    .sort((a, b) => {
      const aPinned = frequentGroups.includes(a.id);
      const bPinned = frequentGroups.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

  // Action Broadcast
  const handleBroadcast = async () => {
    if (!message.trim()) { toast.error(t("broadcast.toast.emptyMessage")); return; }
    if (selectedGroups.length === 0) { toast.error(t("broadcast.toast.selectGroup")); return; }
    
    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, groupIds: selectedGroups }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("broadcast.toast.success", { count: selectedGroups.length }));
        setBroadcastHistory((prev) => [
          { message: message.substring(0, 100), groups: selectedGroups.length, time: new Date().toLocaleString("id-ID") },
          ...prev,
        ]);
        setMessage("");
        setTemplate("");
        setSelectedGroups([]);
      } else {
        toast.error(data.error || t("broadcast.toast.sendError"));
      }
    } catch { toast.error(t("broadcast.toast.serviceError")); }
    finally { setIsSending(false); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("broadcast.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("broadcast.subtitle")}</p>
        </div>
      </motion.div>

      {/* Connection Status Banner */}
      <motion.div variants={item}>
        {isLoadingStatus ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : !isConnected ? (
          <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10"><WifiOff className="h-5 w-5 text-destructive" /></div>
                <div>
                  <h3 className="text-sm font-bold text-destructive">{t("broadcast.notLinked")}</h3>
                  <p className="text-xs text-muted-foreground">{t("broadcast.notLinkedDesc")}</p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-destructive hover:bg-destructive/90 text-white shadow-sm shrink-0">
                <a href="/whatsapp">{t("broadcast.integrateNow")}</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-2 px-1 mb-2">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
             </span>
             <span className="text-xs font-semibold text-green-600">{t("broadcast.connected")}</span>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* KOLOM KIRI: Integrator & Pesan */}
        <div className="space-y-6">
          
          <motion.div variants={item}>
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> {t("broadcast.autoTemplate")}</span>
                </CardTitle>
                <CardDescription className="text-xs">{t("broadcast.autoTemplateDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {/* 1. Task Integration */}
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                     <ListTodo className="h-3.5 w-3.5 text-orange-500"/> {t("broadcast.taskDeadline")}
                   </Label>
                   <select className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors cursor-pointer"
                     onChange={(e) => {
                       const taskId = e.target.value;
                       if(!taskId) return;
                       const selectedTask = tasks.find(x => x.id === taskId);
                       if(selectedTask) handleIntegrationSelect("task", selectedTask);
                     }}
                     defaultValue=""
                   >
                     <option value="" disabled className="text-muted-foreground">{t("broadcast.selectTask")}</option>
                     {tasks.map(task => <option key={task.id} value={task.id}>{task.title} ({task.course?.name || t("broadcast.general")})</option>)}
                   </select>
                 </div>
                 
                 {/* 2. Pengumuman Integration */}
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                     <Megaphone className="h-3.5 w-3.5 text-purple-500"/> {t("nav.announcements")}
                   </Label>
                   <select className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors cursor-pointer"
                     onChange={(e) => {
                       const annId = e.target.value;
                       if(!annId) return;
                       const a = announcements.find(x => x.id === annId);
                       if(a) handleIntegrationSelect("announcement", a);
                     }}
                     defaultValue=""
                   >
                     <option value="" disabled className="text-muted-foreground">{t("broadcast.selectAnnouncement")}</option>
                     {announcements.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                   </select>
                 </div>

                 {/* 3. ELearning Integration */}
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                     <BookOpen className="h-3.5 w-3.5 text-blue-500"/> {t("nav.elearning")}
                   </Label>
                   <select className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors cursor-pointer"
                     onChange={(e) => {
                       const elId = e.target.value;
                       if(!elId) return;
                       const el = elearnings.find(x => x.id === elId);
                       if(el) handleIntegrationSelect("elearning", el);
                     }}
                     defaultValue=""
                   >
                     <option value="" disabled className="text-muted-foreground">{t("broadcast.selectElearning")}</option>
                     {elearnings.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                   </select>
                 </div>

                 {/* 4. Course Schedule Integration */}
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                     <CalendarDays className="h-3.5 w-3.5 text-emerald-500"/> {t("broadcast.courseSchedule")}
                   </Label>
                   <select className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors cursor-pointer"
                     onChange={(e) => {
                       const cId = e.target.value;
                       if(!cId) return;
                       const c = courses.find(x => x.id === cId);
                       if(c) handleIntegrationSelect("course", c);
                     }}
                     defaultValue=""
                   >
                     <option value="" disabled>{t("broadcast.selectCourse")}</option>
                     {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-card">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />{t("broadcast.composer")}</CardTitle>
                   <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={isGenerating} className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                     {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                     {t("broadcast.aiPolish")}
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 relative">
                  <Textarea 
                     placeholder={t("broadcast.messagePlaceholder")} 
                     value={message} 
                     onChange={(e) => setMessage(e.target.value)} 
                     rows={10} 
                     className="resize-y p-4 text-sm font-medium leading-relaxed bg-muted/20 focus:bg-background border-border shadow-inner"
                  />
                  <div className="absolute bottom-4 right-4 max-w-xs text-right">
                     <p className="text-[10px] text-muted-foreground bg-background border px-2 py-1 flex items-center shrink-0">
                       <span className="font-bold text-foreground mr-1">{message.length}</span> {t("broadcast.charCount")}
                     </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* KOLOM KANAN: Manajemen Grup & Send Button */}
        <div className="space-y-6 flex flex-col h-full">
          <motion.div variants={item} className="flex-1">
            <Card className="border-border shadow-sm flex flex-col h-full bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" />{t("broadcast.groupDestination")}</CardTitle>
                     {groups.length > 0 && selectedGroups.length > 0 && (
                        <Badge className="bg-primary hover:bg-primary/90 shadow-sm animate-in zoom-in font-bold text-[10px]">
                           {t("broadcast.targetsLocked", { count: selectedGroups.length })}
                        </Badge>
                     )}
                   </div>
                   {isConnected && (
                     <div className="relative w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input 
                           placeholder={t("broadcast.searchGroup")} 
                           className="pl-8 h-9 text-xs bg-background shadow-sm border-border"
                           value={searchGroup}
                           onChange={(e) => setSearchGroup(e.target.value)}
                        />
                     </div>
                   )}
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {!isConnected ? (
                  <p className="text-sm text-muted-foreground text-center py-10 opacity-70">{t("broadcast.accessClosed")}</p>
                ) : groups.length === 0 ? (
                  <div className="text-center py-10 opacity-70">
                    <p className="text-xs text-muted-foreground font-medium mb-3">{t("broadcast.noGroups")}</p>
                    <Button variant="outline" size="sm" onClick={fetchStatus}><RefreshCw className="h-3 w-3 mr-2" />{t("broadcast.refreshDb")}</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mt-1 mb-2 px-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("broadcast.detected", { count: filteredGroups.length })}</p>
                      <button className="text-[10px] py-1 px-2 font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors" onClick={selectAllFilteredGroups}>
                         {selectedGroups.length === filteredGroups.length ? t("broadcast.deselectAll") : t("broadcast.selectAll")}
                      </button>
                    </div>
                    
                    <div className="max-h-[360px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                      {filteredGroups.map((g) => {
                        const isSelected = selectedGroups.includes(g.id);
                        const isPinned = frequentGroups.includes(g.id);
                        return (
                          <div 
                            key={g.id}
                            onClick={() => toggleGroup(g.id)}
                            className={cn(
                              "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                              isSelected 
                                ? "border-primary/50 bg-primary/5 shadow-sm" 
                                : "border-border hover:border-primary/30 hover:bg-muted/50 bg-card"
                            )}
                          >
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "h-9 w-9 rounded-full flex items-center justify-center border font-bold text-[10px]",
                                 isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
                               )}>
                                 <Users className="h-4 w-4" />
                               </div>
                               <div>
                                 <p className={cn("text-xs font-bold leading-tight", isSelected ? "text-primary" : "text-foreground")}>{g.subject}</p>
                                 <p className="text-[10px] text-muted-foreground">{t("broadcast.memberCount", { count: g.size })}</p>
                               </div>
                            </div>

                            {/* Pin / Favorite Action (Cukup klik pada tombol pinggir untuk nge-pin secara independen) */}
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={(e) => toggleFrequentGroup(e, g.id)}
                                 title={isPinned ? t("broadcast.unpin") : t("broadcast.pinTop")} 
                                 className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                               >
                                 <Pin className={cn("h-3.5 w-3.5", isPinned ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/30")} />
                               </button>

                               <div className={cn(
                                 "h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center",
                                 isSelected ? "bg-primary border-primary" : "bg-background border-border"
                               )}>
                                 {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                               </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <Button 
             onClick={handleBroadcast} 
             disabled={isSending || !isConnected || selectedGroups.length === 0} 
             size="lg"
             className="w-full text-base font-bold shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
             {isSending ? (
               <><Loader2 className="h-5 w-5 animate-spin mr-2" />{t("broadcast.sending", { count: selectedGroups.length })}</>
             ) : (
               <><Send className="h-5 w-5 mr-2" />{t("broadcast.launch", { count: selectedGroups.length })}</>
             )}
          </Button>

          {/* Broadcast History Preview */}
          <motion.div variants={item}>
            {broadcastHistory.length > 0 && (
              <div className="space-y-3 mt-4">
                 <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Radio className="h-3 w-3 text-destructive animate-pulse" /> {t("broadcast.history")}</p>
                 <div className="space-y-2">
                    {broadcastHistory.slice(0,3).map((h, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-muted/10">
                        <p className="text-xs line-clamp-1 italic">"{h.message}"</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 font-medium">
                          <Badge variant="secondary" className="px-1.5 rounded-sm">{t("broadcast.received", { count: h.groups })}</Badge>
                          <span>{h.time}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
