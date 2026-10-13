"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  Pin,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/store";
import { container, item } from "@/lib/animations";
import {
  getBroadcastStopMessage,
  WA_BROADCAST_WARNING_GROUP_THRESHOLD,
  type WhatsAppBroadcastResult,
} from "@/lib/whatsapp/safety";

interface WAGroup {
  id: string;
  subject: string;
  size: number;
}

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"] as const;

export default function BroadcastPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");

  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [elearnings, setElearnings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [groups, setGroups] = useState<WAGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchGroup, setSearchGroup] = useState("");
  const [frequentGroups, setFrequentGroups] = useState<string[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [largeBroadcastOpen, setLargeBroadcastOpen] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<{ message: string; groups: number; time: string }[]>([]);

  const fetchIntegrationData = useCallback(async () => {
    try {
      const [resTasks, resAnn, resLearn, resCourses] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/announcements?limit=5"),
        fetch("/api/elearning"),
        fetch("/api/courses"),
      ]);

      const [dTasks, dAnn, dLearn, dCourses] = await Promise.all([
        resTasks.json(),
        resAnn.json(),
        resLearn.json(),
        resCourses.json(),
      ]);

      if (dTasks.success) setTasks(dTasks.data.filter((task: any) => task.status !== "COMPLETED"));
      if (dAnn.success) setAnnouncements(dAnn.data);
      if (dLearn.success) setElearnings(dLearn.data.filter((entry: any) => entry.isActive));
      if (dCourses.success) setCourses(dCourses.data);
    } catch {
      console.warn("Gagal load integrasi data");
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setIsConnected(data.data.connected);
        setGroups(data.data.groups || []);
      }
    } catch {
      /* silent */
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchIntegrationData();

    const savedFav = localStorage.getItem("fav_wa_groups");
    if (savedFav) setFrequentGroups(JSON.parse(savedFav));
  }, [fetchStatus, fetchIntegrationData]);

  const getSignature = () => {
    const className = user?.className ? `Kelas ${user.className}` : "Ketua Kelas";
    const university = user?.university ? `\n${user.university}` : "";
    return `\n\n--\n${user?.name || "Ketua"}\n${className}${university}`;
  };

  const handleIntegrationSelect = (type: string, data: any) => {
    setTemplate(type);
    let draft = "";

    if (type === "task") {
      const courseName = data.course?.name ? `Mata kuliah: ${data.course.name}\n` : "";
      const deadline = data.deadline ? format(new Date(data.deadline), "EEEE, dd MMM yyyy HH:mm", { locale: idLocale }) : "Belum ditentukan";
      draft = `Reminder tugas\n\n${courseName}Tugas: ${data.title}\nDeadline: ${deadline}\n\nTolong dicek dan diselesaikan sebelum batas waktu ya.`;
      if (data.description) draft += `\n\nCatatan:\n${data.description}`;
    } else if (type === "announcement") {
      draft = `Pengumuman kelas\n\n${data.title}\n\n${data.content}`;
    } else if (type === "elearning") {
      const courseName = data.course?.name || "Mata Kuliah Umum";
      const end = format(new Date(data.endDate), "dd MMM yyyy HH:mm", { locale: idLocale });
      draft = `Info e-learning\n\nMata kuliah: ${courseName}\nTopik: ${data.title}\nDitutup pada: ${end}\n\nSilakan cek portal e-learning kampus dan selesaikan bagian yang diperlukan.`;
    } else if (type === "course") {
      draft = `Info jadwal kuliah\n\nMata kuliah: ${data.name}\nDosen: ${data.dosenName || "-"}\nJadwal: ${data.schedule || "-"}\n\nPastikan hadir tepat waktu dan siapkan materi yang dibutuhkan.`;
    }

    setMessage(draft + getSignature());
  };

  const handleDaySchedule = (day: string) => {
    const dayLabel = t(`courses.day.${day}`);
    const matched = courses.filter((course: any) => course.scheduleDay && course.scheduleDay.toLowerCase() === day);

    if (matched.length === 0) {
      toast.error(t("broadcast.noCourseOnDay", { day: dayLabel }));
      return;
    }

    const sorted = [...matched].sort((a: any, b: any) => {
      const tA = a.scheduleStart || "99:99";
      const tB = b.scheduleStart || "99:99";
      return tA.localeCompare(tB);
    });

    setTemplate("daily_schedule");

    let draft = `Jadwal kuliah hari ${dayLabel}\n\n`;
    draft += `Berikut ${sorted.length} mata kuliah yang terjadwal:\n\n`;

    sorted.forEach((course: any, index: number) => {
      const time = course.scheduleStart && course.scheduleEnd
        ? `${course.scheduleStart} - ${course.scheduleEnd} WIB`
        : course.schedule || "-";

      draft += `${index + 1}. ${course.name}\n`;
      draft += `   Dosen: ${course.dosenName || "-"}\n`;
      draft += `   Jam: ${time}\n`;
      if (course.sks) draft += `   SKS: ${course.sks}\n`;
      draft += "\n";
    });

    draft += "Mohon cek jadwal dan hadir tepat waktu ya.";
    setMessage(draft + getSignature());
    toast.success(t("broadcast.courseCount", { count: sorted.length }));
  };

  const handleAIGenerate = async () => {
    if (!message.trim()) {
      toast.error(t("broadcast.toast.writeFirst"));
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, type: template || "general" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const cleaned = data.data.replace(/--[\s\S]*/g, "");
        setMessage(cleaned.trim() + getSignature());
        toast.success(t("broadcast.toast.aiDone"));
      } else {
        toast.error(t("broadcast.toast.aiError"));
      }
    } catch {
      toast.error(t("broadcast.toast.aiUnavailable"));
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredGroups = useMemo(
    () =>
      groups
        .filter((group) => group.subject.toLowerCase().includes(searchGroup.toLowerCase()))
        .sort((a, b) => {
          const aPinned = frequentGroups.includes(a.id);
          const bPinned = frequentGroups.includes(b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return a.subject.localeCompare(b.subject);
        }),
    [frequentGroups, groups, searchGroup]
  );

  const selectedGroupNames = useMemo(
    () => groups.filter((group) => selectedGroups.includes(group.id)).map((group) => group.subject),
    [groups, selectedGroups]
  );

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => prev.includes(id) ? prev.filter((groupId) => groupId !== id) : [...prev, id]);
  };

  const selectAllFilteredGroups = () => {
    const filteredIds = filteredGroups.map((group) => group.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedGroups.includes(id));
    setSelectedGroups((prev) => {
      if (allFilteredSelected) return prev.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  const toggleFrequentGroup = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    const newFavs = frequentGroups.includes(id)
      ? frequentGroups.filter((groupId) => groupId !== id)
      : [...frequentGroups, id];

    setFrequentGroups(newFavs);
    localStorage.setItem("fav_wa_groups", JSON.stringify(newFavs));
  };

  const validateBroadcast = () => {
    if (!message.trim()) {
      toast.error(t("broadcast.toast.emptyMessage"));
      return false;
    }

    if (selectedGroups.length === 0) {
      toast.error(t("broadcast.toast.selectGroup"));
      return false;
    }

    return true;
  };

  const sendBroadcast = async (confirmLargeBroadcast = false) => {
    if (!validateBroadcast()) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, groupIds: selectedGroups, confirmLargeBroadcast }),
      });
      const data = await res.json();

      if (data.success) {
        const result = data.data as WhatsAppBroadcastResult;
        const sentCount = result?.success?.length ?? selectedGroups.length;

        if (result?.stopped) {
          const stopMessage = getBroadcastStopMessage(result.stoppedReason);
          toast.error(data.message || stopMessage || "Broadcast dihentikan otomatis");
        } else {
          toast.success(data.message || t("broadcast.toast.success", { count: sentCount }));
        }

        setBroadcastHistory((prev) => [
          { message: message.substring(0, 100), groups: sentCount, time: new Date().toLocaleString("id-ID") },
          ...prev,
        ]);

        if (result?.stopped && result.skipped.length > 0) {
          setSelectedGroups(result.skipped);
        } else {
          setMessage("");
          setTemplate("");
          setSelectedGroups([]);
        }
      } else {
        if (res.status === 409) {
          setLargeBroadcastOpen(true);
          return;
        }

        toast.error(data.error || t("broadcast.toast.sendError"));
      }
    } catch {
      toast.error(t("broadcast.toast.serviceError"));
    } finally {
      setIsSending(false);
    }
  };

  const handleBroadcast = () => {
    if (!validateBroadcast()) return;

    if (selectedGroups.length >= WA_BROADCAST_WARNING_GROUP_THRESHOLD) {
      setLargeBroadcastOpen(true);
      return;
    }

    void sendBroadcast(false);
  };

  const handleConfirmLargeBroadcast = () => {
    setLargeBroadcastOpen(false);
    void sendBroadcast(true);
  };

  const hasTargets = selectedGroups.length > 0;
  const canSend = isConnected && hasTargets && message.trim().length > 0 && !isSending;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kirim kabar ke kelas</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Tulis pesan sekali, pilih grup tujuan, lalu kirim. Kalau perlu, ambil isi pesan dari tugas, pengumuman, e-learning, atau jadwal kuliah.
          </p>
        </div>

        {isLoadingStatus ? (
          <Skeleton className="h-9 w-44 rounded-md" />
        ) : isConnected ? (
          <Badge variant="success" className="h-8 gap-2 px-3">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            WhatsApp tersambung
          </Badge>
        ) : (
          <Button asChild size="sm" variant="outline" className="w-fit gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            <a href="/whatsapp">
              <WifiOff className="h-4 w-4" />
              Hubungkan WhatsApp
            </a>
          </Button>
        )}
      </motion.div>

      {!isLoadingStatus && !isConnected && (
        <motion.div variants={item} className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">{t("broadcast.notLinked")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("broadcast.notLinkedDesc")}</p>
            </div>
            <Button asChild size="sm" className="w-fit bg-destructive text-white hover:bg-destructive/90">
              <a href="/whatsapp">{t("broadcast.integrateNow")}</a>
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <motion.div variants={item} className="space-y-5">
          <section className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold">Pesan broadcast</h2>
                <p className="mt-1 text-sm text-muted-foreground">Mulai dari kosong, atau gunakan data kelas di bawah sebagai bahan pesan.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIGenerate}
                disabled={isGenerating || !message.trim()}
                className="w-fit gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Rapikan bahasa
              </Button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Ambil dari data kelas</Label>
                  <div className="mt-3 grid gap-3">
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                      defaultValue=""
                      onChange={(event) => {
                        const task = tasks.find((entry) => entry.id === event.target.value);
                        if (task) handleIntegrationSelect("task", task);
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>Tugas aktif</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>{task.title}</option>
                      ))}
                    </select>

                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                      defaultValue=""
                      onChange={(event) => {
                        const announcement = announcements.find((entry) => entry.id === event.target.value);
                        if (announcement) handleIntegrationSelect("announcement", announcement);
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>Pengumuman</option>
                      {announcements.map((announcement) => (
                        <option key={announcement.id} value={announcement.id}>{announcement.title}</option>
                      ))}
                    </select>

                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                      defaultValue=""
                      onChange={(event) => {
                        const elearning = elearnings.find((entry) => entry.id === event.target.value);
                        if (elearning) handleIntegrationSelect("elearning", elearning);
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>E-learning aktif</option>
                      {elearnings.map((elearning) => (
                        <option key={elearning.id} value={elearning.id}>{elearning.title}</option>
                      ))}
                    </select>

                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                      defaultValue=""
                      onChange={(event) => {
                        const course = courses.find((entry) => entry.id === event.target.value);
                        if (course) handleIntegrationSelect("course", course);
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>Jadwal mata kuliah</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Jadwal per hari</Label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDaySchedule(day)}
                        className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs font-medium capitalize text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        {t(`courses.day.${day}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Contoh: Halo teman-teman, jangan lupa tugas Basis Data dikumpulkan malam ini pukul 23.59."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={16}
                  className="min-h-[360px] resize-y rounded-md bg-background p-4 text-sm leading-relaxed"
                />
                <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>{message.length} karakter</span>
                  <span>{template ? "Draft dibuat dari data kelas. Bisa diedit sebelum dikirim." : "Pesan bisa ditulis manual kapan saja."}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Riwayat singkat</h2>
            </div>
            {broadcastHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada broadcast yang dikirim dari sesi ini.</p>
            ) : (
              <div className="grid gap-3">
                {broadcastHistory.slice(0, 3).map((history, index) => (
                  <div key={`${history.time}-${index}`} className="rounded-md border border-border bg-background p-3">
                    <p className="line-clamp-1 text-sm text-foreground">&quot;{history.message}&quot;</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{history.groups} grup</Badge>
                      <span>{history.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>

        <motion.aside variants={item} className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Grup tujuan</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedGroups.length} grup dipilih</p>
                </div>
                {hasTargets && <Badge>{selectedGroups.length}</Badge>}
              </div>

              {isConnected && (
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari grup"
                    className="h-10 pl-9"
                    value={searchGroup}
                    onChange={(event) => setSearchGroup(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="p-3">
              {!isConnected ? (
                <div className="py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">{t("broadcast.accessClosed")}</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">{t("broadcast.noGroups")}</p>
                  <Button variant="outline" size="sm" onClick={fetchStatus} className="mt-4 gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("broadcast.refreshDb")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-xs font-medium text-muted-foreground">{filteredGroups.length} grup ditemukan</p>
                    <button type="button" onClick={selectAllFilteredGroups} className="text-xs font-semibold text-primary hover:underline">
                      {filteredGroups.length > 0 && filteredGroups.every((group) => selectedGroups.includes(group.id)) ? "Batal pilih" : "Pilih semua"}
                    </button>
                  </div>

                  <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                    {filteredGroups.map((group) => {
                      const isSelected = selectedGroups.includes(group.id);
                      const isPinned = frequentGroups.includes(group.id);

                      return (
                        <div
                          key={group.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleGroup(group.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleGroup(group.id);
                            }
                          }}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors",
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-background hover:border-primary/30"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
                            )}>
                              {isSelected ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">{group.subject}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">{group.size} anggota</span>
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={(event) => toggleFrequentGroup(event, group.id)}
                            title={isPinned ? t("broadcast.unpin") : t("broadcast.pinTop")}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pin className={cn("h-4 w-4", isPinned && "fill-yellow-400 text-yellow-500")} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Siap dikirim?</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-4">
                <span>Isi pesan</span>
                <span className={message.trim() ? "text-emerald-600" : ""}>{message.trim() ? "Siap" : "Kosong"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Tujuan</span>
                <span className={hasTargets ? "text-emerald-600" : ""}>{hasTargets ? `${selectedGroups.length} grup` : "Belum dipilih"}</span>
              </div>
              {selectedGroupNames.length > 0 && (
                <p className="line-clamp-2 text-xs leading-relaxed">Ke: {selectedGroupNames.join(", ")}</p>
              )}
              {selectedGroups.length >= WA_BROADCAST_WARNING_GROUP_THRESHOLD && (
                <div className="flex gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Kamu memilih {selectedGroups.length} grup. Sistem akan meminta konfirmasi dan menghentikan pengiriman otomatis kalau error terlalu banyak.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleBroadcast}
              disabled={!canSend}
              size="lg"
              className="mt-5 h-11 w-full gap-2 rounded-md font-semibold"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim broadcast
                </>
              )}
            </Button>
          </section>
        </motion.aside>
      </div>

      <ConfirmDialog
        open={largeBroadcastOpen}
        onOpenChange={setLargeBroadcastOpen}
        title="Kirim ke banyak grup?"
        description={`Kamu akan mengirim pesan ke ${selectedGroups.length} grup sekaligus. Pastikan grup tujuan memang relevan. Jika terlalu banyak pengiriman gagal, sistem akan menghentikan broadcast otomatis.`}
        confirmLabel="Tetap kirim"
        cancelLabel="Cek lagi"
        variant="default"
        loading={isSending}
        onConfirm={handleConfirmLargeBroadcast}
      />
    </motion.div>
  );
}
