"use client";

import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2,
  Trash2, Pencil, BookOpen, ClipboardList, Bell, GraduationCap, ScanText,
  Upload, RotateCcw, X, Check, CheckCheck, Search, Clock,
} from "lucide-react";
import { container, item } from "@/lib/animations";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  color: string;
}

interface OcrEvent {
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  color: string;
  selected: boolean;
}

const OCR_TYPE_COLORS: Record<string, string> = {
  KULIAH: "#3b82f6", UTS: "#ef4444", UAS: "#dc2626", HOLIDAY: "#22c55e",
  DEADLINE: "#f97316", ELEARNING: "#a855f7", PRAKTIKUM: "#8b5cf6",
  SEMINAR: "#06b6d4", PRESENTASI: "#f59e0b", OTHER: "#6b7280",
};

type ListSortMode = "upcoming" | "newest";

const isTaskEvent = (event: CalendarEvent) => event.id.startsWith("task_");
const getTaskId = (event: CalendarEvent) => event.id.replace(/^task_/, "");

export default function CalendarPage() {
  const { t } = useI18n();
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", startDate: "", endDate: "", type: "academic", color: "#3b82f6",
  });

  // OCR State
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrEvents, setOcrEvents] = useState<OcrEvent[]>([]);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isOcrSaving, setIsOcrSaving] = useState(false);
  const [ocrStep, setOcrStep] = useState<"input" | "review">("input");
  const [ocrDragOver, setOcrDragOver] = useState(false);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // List State
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const [listTypeFilter, setListTypeFilter] = useState("");
  const [listSort, setListSort] = useState<ListSortMode>("upcoming");

  const MONTHS = [
    t("calendar.month.jan"), t("calendar.month.feb"), t("calendar.month.mar"),
    t("calendar.month.apr"), t("calendar.month.mei"), t("calendar.month.jun"),
    t("calendar.month.jul"), t("calendar.month.aug"), t("calendar.month.sep"),
    t("calendar.month.okt"), t("calendar.month.nov"), t("calendar.month.des"),
  ];
  const DAYS = [
    t("calendar.day.sun"), t("calendar.day.mon"), t("calendar.day.tue"),
    t("calendar.day.wed"), t("calendar.day.thu"), t("calendar.day.fri"), t("calendar.day.sat"),
  ];
  const EVENT_TYPES = [
    { value: "academic", label: t("calendar.type.academic"), color: "#3b82f6", icon: GraduationCap },
    { value: "deadline", label: t("calendar.type.deadline"), color: "#ef4444", icon: ClipboardList },
    { value: "elearning", label: t("calendar.type.elearning"), color: "#8b5cf6", icon: BookOpen },
    { value: "reminder", label: t("calendar.type.reminder"), color: "#f59e0b", icon: Bell },
    { value: "personal", label: t("calendar.type.personal"), color: "#10b981", icon: CalendarIcon },
  ];
  const ALL_EVENT_TYPES = [
    { value: "", label: t("calendar.filter.all") },
    { value: "KULIAH", label: t("calendar.filter.kuliah"), color: "#3b82f6" },
    { value: "PRAKTIKUM", label: t("calendar.filter.praktikum"), color: "#8b5cf6" },
    { value: "SEMINAR", label: t("calendar.filter.seminar"), color: "#06b6d4" },
    { value: "PRESENTASI", label: t("calendar.filter.presentasi"), color: "#f59e0b" },
    { value: "UTS", label: t("calendar.filter.uts"), color: "#ef4444" },
    { value: "UAS", label: t("calendar.filter.uas"), color: "#dc2626" },
    { value: "HOLIDAY", label: t("calendar.filter.holiday"), color: "#22c55e" },
    { value: "DEADLINE", label: t("calendar.filter.deadline"), color: "#f97316" },
    { value: "ELEARNING", label: t("calendar.filter.elearning"), color: "#a855f7" },
    { value: "OTHER", label: t("calendar.filter.other"), color: "#6b7280" },
  ];

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch { toast.error(t("calendar.fetchError")); }
    finally { setIsLoading(false); }
  }, [currentMonth, currentYear]);

  const fetchAllEvents = useCallback(async () => {
    setIsListLoading(true);
    try {
      const params = new URLSearchParams({ mode: "all" });
      if (listTypeFilter) params.set("type", listTypeFilter);
      if (listSearch) params.set("search", listSearch);
      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();
      if (data.success) setAllEvents(data.data);
    } catch { /* silent */ }
    finally { setIsListLoading(false); }
  }, [listTypeFilter, listSearch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchAllEvents(); }, [fetchAllEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const pad = (n: number) => String(n).padStart(2, "0");

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return events.filter((e) => {
      const start = e.startDate.substring(0, 10);
      const end = e.endDate ? e.endDate.substring(0, 10) : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  const isTodayFn = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const formatDatetimeLocal = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
  };

  const openCreate = (day?: number) => {
    const d = day || today.getDate();
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}T09:00`;
    setEditingEvent(null);
    setForm({ title: "", description: "", startDate: dateStr, endDate: "", type: "academic", color: "#3b82f6" });
    setIsDialogOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    if (isTaskEvent(ev)) {
      router.push(`/tasks/${getTaskId(ev)}`);
      return;
    }

    const typeReverseMap: Record<string, string> = {
      KULIAH: "academic", DEADLINE: "deadline", ELEARNING: "elearning", OTHER: "personal",
      PRAKTIKUM: "academic", SEMINAR: "academic", PRESENTASI: "academic", UTS: "deadline",
      UAS: "deadline", HOLIDAY: "personal",
    };
    const frontendType = typeReverseMap[ev.type] || "personal";
    const typeInfo = EVENT_TYPES.find((t) => t.value === frontendType);
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description || "",
      startDate: formatDatetimeLocal(ev.startDate),
      endDate: ev.endDate ? formatDatetimeLocal(ev.endDate) : "",
      type: frontendType, color: typeInfo?.color || ev.color || "#3b82f6",
    });
    setIsDialogOpen(true);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate) { toast.error(t("calendar.titleDateRequired")); return; }
    setIsSaving(true);
    try {
      const url = editingEvent ? `/api/calendar/${editingEvent.id}` : "/api/calendar";
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(editingEvent ? t("calendar.updateSuccess") : t("calendar.createSuccess"));
      setIsDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
      fetchAllEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("calendar.saveError")); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("task_")) {
      router.push(`/tasks/${id.replace(/^task_/, "")}`);
      return;
    }

    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("calendar.deleteSuccess"));
      fetchEvents();
      fetchAllEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("calendar.deleteError"));
    }
  };

  // OCR Handlers
  const handleOcrFileSelect = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error(t("calendar.ocrImageOnly")); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error(t("calendar.ocrFileTooLarge")); return; }
    setOcrFile(f);
    if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    setOcrPreview(URL.createObjectURL(f));
  };
  const handleOcrDrop = (e: React.DragEvent) => {
    e.preventDefault(); setOcrDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleOcrFileSelect(f);
  };
  const handleOcrProcess = async () => {
    if (!ocrText.trim() && !ocrFile) { toast.error(t("calendar.ocrEmpty")); return; }
    setIsOcrProcessing(true);
    try {
      let imageBase64: string | undefined;
      if (ocrFile) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(ocrFile);
        });
      }
      const res = await fetch("/api/ai/ocr-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText.trim() || undefined, image: imageBase64 || undefined }),
      });
      const data = await res.json();
      if (data.success && data.data?.events?.length > 0) {
        setOcrEvents(data.data.events.map((ev: Omit<OcrEvent, "selected">) => ({ ...ev, selected: true })));
        setOcrStep("review");
        toast.success(t("calendar.ocrExtracted", { count: data.data.events.length }));
      } else {
        toast.error(data.data?.message || t("calendar.ocrNoEvents"));
      }
    } catch { toast.error(t("calendar.ocrProcessError")); }
    finally { setIsOcrProcessing(false); }
  };
  const handleOcrBulkSave = async () => {
    const selectedEvents = ocrEvents.filter(ev => ev.selected);
    if (selectedEvents.length === 0) { toast.error(t("calendar.ocrSelectMin")); return; }
    setIsOcrSaving(true);
    try {
      const res = await fetch("/api/calendar/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: selectedEvents.map((event) => {
            const { selected, ...rest } = event;
            void selected;
            return rest;
          }),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("calendar.ocrBulkSuccess", { count: data.data.created }));
      handleOcrReset();
      setIsOcrDialogOpen(false);
      fetchEvents();
      fetchAllEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("calendar.ocrSaveError")); }
    finally { setIsOcrSaving(false); }
  };
  const handleOcrReset = () => {
    if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    setOcrFile(null); setOcrPreview(null); setOcrText("");
    setOcrEvents([]); setOcrStep("input");
    if (ocrFileInputRef.current) ocrFileInputRef.current.value = "";
  };
  const selectedOcrCount = ocrEvents.filter(ev => ev.selected).length;

  const selectedDayEvents = selectedDate
    ? events.filter((e) => {
        const start = e.startDate.substring(0, 10);
        const end = e.endDate ? e.endDate.substring(0, 10) : start;
        return selectedDate >= start && selectedDate <= end;
      })
    : [];

  const todayStr = today.toISOString().substring(0, 10);

  const sortedListEvents = [...allEvents].sort((a, b) => {
    const aStart = a.startDate.substring(0, 10);
    const bStart = b.startDate.substring(0, 10);
    if (listSort === "upcoming") {
      const aFuture = aStart >= todayStr;
      const bFuture = bStart >= todayStr;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return aFuture ? aStart.localeCompare(bStart) : bStart.localeCompare(aStart);
    }
    return bStart.localeCompare(aStart);
  });

  const getEventStatus = (ev: CalendarEvent) => {
    const start = ev.startDate.substring(0, 10);
    const end = ev.endDate ? ev.endDate.substring(0, 10) : start;
    if (end < todayStr) return { label: t("calendar.status.done"), cls: "text-muted-foreground/70 bg-muted" };
    if (start <= todayStr && end >= todayStr) return { label: t("calendar.status.ongoing"), cls: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" };
    const daysLeft = Math.ceil((new Date(start).getTime() - today.getTime()) / 86400000);
    if (daysLeft <= 3) return { label: t("calendar.status.daysLeft", { days: daysLeft }), cls: "text-red-500 bg-red-500/10" };
    if (daysLeft <= 7) return { label: t("calendar.status.daysLeft", { days: daysLeft }), cls: "text-amber-500 bg-amber-500/10" };
    return { label: t("calendar.status.daysLeft", { days: daysLeft }), cls: "text-muted-foreground bg-muted" };
  };

  const getTypeColor = (type: string) =>
    ALL_EVENT_TYPES.find(t => t.value === type)?.color ?? "#6b7280";

  const getTypeLabel = (type: string) =>
    ALL_EVENT_TYPES.find(t => t.value === type)?.label ?? type;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("calendar.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("calendar.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { handleOcrReset(); setIsOcrDialogOpen(true); }} className="gap-2">
            <ScanText className="h-4 w-4" />
            {t("calendar.scanButton")}
          </Button>
          <Button size="sm" onClick={() => openCreate()} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("calendar.new")}
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── LEFT: Calendar Grid ── */}
        <motion.div variants={item} className="lg:col-span-3 space-y-4">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {MONTHS[currentMonth]} <span className="text-muted-foreground font-normal">{currentYear}</span>
                </h2>
                <button
                  onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Hari Ini
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextMonth} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 border-b border-border/40">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-px bg-border/30 p-px">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-none" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 bg-border/20 gap-px">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="min-h-[100px] bg-muted/20" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
                  const dayEvents = getEventsForDay(d);
                  const isToday = isTodayFn(d);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={d}
                      onClick={() => handleDayClick(d)}
                      onDoubleClick={() => openCreate(d)}
                      className={`min-h-[100px] bg-background p-1.5 cursor-pointer transition-colors group relative
                        ${isToday ? "bg-primary/[0.03]" : ""}
                        ${isSelected ? "ring-1 ring-inset ring-primary/50 bg-primary/[0.04]" : "hover:bg-muted/30"}
                      `}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between mb-1 px-0.5">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold transition-colors
                          ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}
                        `}>
                          {d}
                        </span>
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-muted-foreground/60 font-medium">
                            +{dayEvents.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Event chips — max 2 visible */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                            title={ev.title}
                            className="text-[10px] px-1.5 py-[2px] rounded font-medium truncate leading-tight hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${ev.color}22`, color: ev.color, borderLeft: `2px solid ${ev.color}` }}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap px-1">
            {EVENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT: Sidebar ── */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">

          {/* Selected Day Panel */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <Card className="border-primary/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-3">
                    {selectedDayEvents.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-sm text-muted-foreground">{t("calendar.noEventsOnDate")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEvents.map((ev) => {
                          const typeInfo = EVENT_TYPES.find((tp) => tp.value === ev.type) || EVENT_TYPES[4];
                          const Icon = typeInfo?.icon || CalendarIcon;
                          return (
                            <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/40 group hover:border-primary/20 transition-all relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ backgroundColor: ev.color }} />
                              <div className="p-1.5 rounded-md shrink-0" style={{ backgroundColor: `${ev.color}18` }}>
                                <Icon className="h-3.5 w-3.5" style={{ color: ev.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight truncate">{ev.title}</p>
                                {ev.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => openEdit(ev)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                  {isTaskEvent(ev) ? <ChevronRight className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                                </button>
                                {!isTaskEvent(ev) && (
                                  <button onClick={() => handleDelete(ev.id)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => openCreate(parseInt(selectedDate.split("-")[2]))}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("calendar.new")} di tanggal ini
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agenda List */}
          <Card className="border-border/60 shadow-sm flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border/40 space-y-3">
              {/* Title + Sort */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Daftar Agenda
                  {!isListLoading && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">({sortedListEvents.length})</span>
                  )}
                </CardTitle>
                <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                  {(["upcoming", "newest"] as ListSortMode[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setListSort(s)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
                        listSort === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s === "upcoming" ? "Terdekat" : "Terbaru"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari agenda..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/30 border-border/50 focus-visible:bg-background"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {ALL_EVENT_TYPES.map((tp) => (
                  <button
                    key={tp.value}
                    onClick={() => setListTypeFilter(tp.value)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border shrink-0 transition-all ${
                      listTypeFilter === tp.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                    }`}
                  >
                    {tp.value && (
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: listTypeFilter === tp.value ? "#fff" : tp.color }} />
                    )}
                    {tp.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: "460px" }}>
              {isListLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg w-full" />)}
                </div>
              ) : sortedListEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{t("calendar.empty")}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                    {listSearch || listTypeFilter ? t("calendar.emptyFilterHint") : t("calendar.emptyHint")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {sortedListEvents.map((ev) => {
                    const status = getEventStatus(ev);
                    const typeColor = getTypeColor(ev.type);
                    const isPast = (ev.endDate ? ev.endDate.substring(0, 10) : ev.startDate.substring(0, 10)) < todayStr;

                    return (
                      <div
                        key={ev.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/20 group transition-colors relative ${isPast ? "opacity-60" : ""}`}
                      >
                        {/* Color bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: typeColor }} />

                        {/* Date */}
                        <div className="flex flex-col items-center min-w-[36px] shrink-0 pt-0.5">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground leading-none">
                            {new Date(ev.startDate).toLocaleDateString("id-ID", { month: "short" })}
                          </span>
                          <span className="text-xl font-black leading-none text-foreground mt-0.5">
                            {new Date(ev.startDate).getDate()}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground leading-tight truncate">{ev.title}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0 ${status.cls}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
                            <span className="text-[10px] text-muted-foreground font-medium">{getTypeLabel(ev.type)}</span>
                          </div>
                          {ev.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{ev.description}</p>
                          )}
                        </div>

                        {/* Hover actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => {
                              const d = new Date(ev.startDate);
                              setCurrentMonth(d.getMonth());
                              setCurrentYear(d.getFullYear());
                              setSelectedDate(ev.startDate.substring(0, 10));
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title={t("calendar.viewInCalendar")}
                          >
                            <CalendarIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openEdit(ev)}
                            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            {isTaskEvent(ev) ? <ChevronRight className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                          </button>
                          {!isTaskEvent(ev) && (
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEvent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? t("calendar.editTitle") : t("calendar.createTitle")}</DialogTitle>
            <DialogDescription>{editingEvent ? t("calendar.editDesc") : t("calendar.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("calendar.eventTitle")}</Label>
              <Input placeholder={t("calendar.titlePlaceholder")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("calendar.description")}</Label>
              <Textarea placeholder={t("calendar.descriptionPlaceholder")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("calendar.startDate")}</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("calendar.endDate")}</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("calendar.type")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((tp) => (
                  <button
                    key={tp.value}
                    onClick={() => setForm({ ...form, type: tp.value, color: tp.color })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                      form.type === tp.value ? "border-primary bg-primary/5 font-semibold" : "border-border/50 hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tp.color }} />
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => { setIsDialogOpen(false); setEditingEvent(null); }}>{t("action.cancel")}</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingEvent ? t("calendar.update") : t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── OCR Dialog ── */}
      <Dialog open={isOcrDialogOpen} onOpenChange={(open) => { setIsOcrDialogOpen(open); if (!open) handleOcrReset(); }}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanText className="h-4 w-4" />
              {t("calendar.ocrTitle")}
            </DialogTitle>
            <DialogDescription>{t("calendar.ocrDesc")}</DialogDescription>
          </DialogHeader>

          {ocrStep === "input" ? (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setOcrDragOver(true); }}
                onDragLeave={() => setOcrDragOver(false)}
                onDrop={handleOcrDrop}
                onClick={() => !ocrFile && ocrFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  ocrDragOver ? "border-primary bg-primary/5" :
                  ocrPreview ? "border-border" :
                  "border-border/50 hover:border-primary/30 cursor-pointer"
                }`}
              >
                {ocrPreview ? (
                  <div className="relative">
                    <img src={ocrPreview} alt={t("calendar.previewAlt")} className="max-h-40 mx-auto rounded-lg shadow" />
                    <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 bg-background/80"
                      onClick={(e) => { e.stopPropagation(); setOcrFile(null); setOcrPreview(null); if (ocrFileInputRef.current) ocrFileInputRef.current.value = ""; }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t("calendar.ocrDragDrop")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t("calendar.ocrFileHint")}</p>
                  </>
                )}
              </div>
              <input ref={ocrFileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcrFileSelect(f); }} className="hidden" />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("calendar.ocrTextLabel")}</Label>
                <Textarea placeholder={t("calendar.ocrTextPlaceholder")} value={ocrText} onChange={(e) => setOcrText(e.target.value)} rows={7} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">{t("calendar.ocrTextHint")}</p>
              </div>

              <Button onClick={handleOcrProcess} disabled={isOcrProcessing || (!ocrText.trim() && !ocrFile)} className="w-full gap-2">
                {isOcrProcessing ? <><Loader2 className="h-4 w-4 animate-spin" />{t("calendar.ocrProcessing")}</> : <><ScanText className="h-4 w-4" />{t("calendar.ocrExtract")}</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{t("calendar.ocrFound", { count: ocrEvents.length })}</Badge>
                  <Badge variant={selectedOcrCount === ocrEvents.length ? "default" : "outline"} className="text-xs">{t("calendar.ocrSelected", { count: selectedOcrCount })}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => { const all = ocrEvents.every(ev => ev.selected); setOcrEvents(prev => prev.map(ev => ({ ...ev, selected: !all }))); }}>
                    <CheckCheck className="h-3.5 w-3.5" />
                    {ocrEvents.every(ev => ev.selected) ? t("calendar.ocrDeselectAll") : t("calendar.ocrSelectAll")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOcrStep("input")}>
                    <RotateCcw className="h-3.5 w-3.5" />{t("calendar.ocrRescan")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {ocrEvents.map((ev, index) => (
                  <div key={index} className={`p-3 rounded-lg border transition-all ${ev.selected ? "border-primary/30 bg-primary/5" : "border-border/40 opacity-55"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setOcrEvents(prev => prev.map((e, i) => i === index ? { ...e, selected: !e.selected } : e))}
                        className={`mt-0.5 shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${ev.selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}
                      >
                        {ev.selected && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: ev.color || "#6b7280" }} />
                          <Input value={ev.title} onChange={(e) => setOcrEvents(prev => prev.map((o, i) => i === index ? { ...o, title: e.target.value } : o))} className="h-8 text-sm font-medium" placeholder={t("calendar.titlePlaceholder")} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("calendar.ocrStart")}</span>
                            <Input type="date" value={ev.startDate} onChange={(e) => setOcrEvents(prev => prev.map((o, i) => i === index ? { ...o, startDate: e.target.value } : o))} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("calendar.ocrEnd")}</span>
                            <Input type="date" value={ev.endDate || ""} onChange={(e) => setOcrEvents(prev => prev.map((o, i) => i === index ? { ...o, endDate: e.target.value } : o))} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={ev.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              setOcrEvents(prev => prev.map((o, i) => i === index ? { ...o, type: newType, color: OCR_TYPE_COLORS[newType] || "#6b7280" } : o));
                            }}
                            className="flex h-8 rounded-md border border-border/50 bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {Object.keys(OCR_TYPE_COLORS).map(k => (
                              <option key={k} value={k}>{getTypeLabel(k)}</option>
                            ))}
                          </select>
                          <div className="ml-auto">
                            <button onClick={() => setOcrEvents(prev => prev.filter((_, i) => i !== index))} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {ocrEvents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">{t("calendar.ocrAllRemoved")}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setOcrStep("input")}>{t("calendar.ocrRescan")}</Button>
                </div>
              )}
            </div>
          )}

          {ocrStep === "review" && ocrEvents.length > 0 && (
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => { setIsOcrDialogOpen(false); handleOcrReset(); }}>{t("action.cancel")}</Button>
              <Button size="sm" onClick={handleOcrBulkSave} disabled={isOcrSaving || selectedOcrCount === 0}>
                {isOcrSaving ? <><Loader2 className="h-4 w-4 animate-spin" />{t("calendar.saving")}</> : <><CheckCheck className="h-4 w-4" />{t("calendar.ocrSave", { count: selectedOcrCount })}</>}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
