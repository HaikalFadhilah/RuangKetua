"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, Trash2, Pencil, BookOpen, ClipboardList, Bell, GraduationCap } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  color: string;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const EVENT_TYPES = [
  { value: "academic", label: "Akademik", color: "#3b82f6", icon: GraduationCap },
  { value: "deadline", label: "Deadline", color: "#ef4444", icon: ClipboardList },
  { value: "elearning", label: "E-Learning", color: "#8b5cf6", icon: BookOpen },
  { value: "reminder", label: "Reminder", color: "#f59e0b", icon: Bell },
  { value: "personal", label: "Personal", color: "#10b981", icon: CalendarIcon },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function CalendarPage() {
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
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "academic",
    color: "#3b82f6",
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch { toast.error("Gagal mengambil data"); }
    finally { setIsLoading(false); }
  }, [currentMonth, currentYear]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const pad = (n: number) => String(n).padStart(2, "0");

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return events.filter((e) => {
      const start = e.startDate.substring(0, 10);
      const end = e.endDate ? e.endDate.substring(0, 10) : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

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
    // Map backend type back to frontend type
    const typeReverseMap: Record<string, string> = {
      KULIAH: "academic", DEADLINE: "deadline", ELEARNING: "elearning", OTHER: "personal",
      PRAKTIKUM: "academic", SEMINAR: "academic", PRESENTASI: "academic", UTS: "deadline", UAS: "deadline",
      HOLIDAY: "personal",
    };
    const frontendType = typeReverseMap[ev.type] || "personal";
    const typeInfo = EVENT_TYPES.find((t) => t.value === frontendType);

    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      startDate: formatDatetimeLocal(ev.startDate),
      endDate: ev.endDate ? formatDatetimeLocal(ev.endDate) : "",
      type: frontendType,
      color: typeInfo?.color || ev.color || "#3b82f6",
    });
    setIsDialogOpen(true);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate) { toast.error("Judul dan tanggal wajib diisi"); return; }
    setIsSaving(true);
    try {
      const url = editingEvent ? `/api/calendar/${editingEvent.id}` : "/api/calendar";
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(editingEvent ? "Event diupdate" : "Event ditambahkan");
      setIsDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyimpan"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      toast.success("Event dihapus");
      fetchEvents();
    } catch { toast.error("Gagal menghapus"); }
  };

  const selectedDayEvents = selectedDate
    ? events.filter((e) => {
        const start = e.startDate.substring(0, 10);
        const end = e.endDate ? e.endDate.substring(0, 10) : start;
        return selectedDate >= start && selectedDate <= end;
      })
    : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender Akademik</h1>
          <p className="text-muted-foreground text-sm mt-1">Jadwal dan deadline penting</p>
        </div>
        <Button onClick={() => openCreate()}><Plus className="h-4 w-4" />Tambah Event</Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-lg font-semibold min-w-[200px] text-center">{MONTHS[currentMonth]} {currentYear}</h2>
                <Button variant="ghost" size="icon-sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToday}>Hari Ini</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-xl" />
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => day && handleDayClick(day)}
                      onDoubleClick={() => day && openCreate(day)}
                      disabled={!day}
                      className={`relative min-h-[80px] md:min-h-[100px] p-1.5 rounded-lg border text-left transition-all ${
                        !day ? "bg-transparent border-transparent cursor-default" :
                        selectedDate === `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30" :
                        isToday(day) ? "border-primary/50 bg-primary/5" :
                        "border-border/50 hover:border-primary/30 hover:bg-accent/30 cursor-pointer"
                      }`}
                    >
                      {day && (
                        <>
                          <span className={`text-xs font-medium ${isToday(day) ? "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center" : "text-foreground"}`}>
                            {day}
                          </span>
                          <div className="mt-1 space-y-0.5 overflow-hidden">
                            {getEventsForDay(day).slice(0, 3).map((ev) => (
                              <div key={ev.id} className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color || "#3b82f6" }} />
                                <span className="text-[10px] truncate leading-tight">{ev.title}</span>
                              </div>
                            ))}
                            {getEventsForDay(day).length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{getEventsForDay(day).length - 3} lagi</span>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={item} className="flex items-center gap-4 flex-wrap">
        {EVENT_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Selected day events panel */}
      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Events — {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada event pada tanggal ini</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => {
                    const typeInfo = EVENT_TYPES.find((t) => t.value === ev.type) || EVENT_TYPES[4];
                    const Icon = typeInfo?.icon || CalendarIcon;
                    return (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 group hover:border-primary/20 transition-all">
                        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${ev.color}20` }}>
                          <Icon className="h-4 w-4" style={{ color: ev.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ev.title}</p>
                          {ev.description && <p className="text-xs text-muted-foreground line-clamp-1">{ev.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{typeInfo?.label}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(ev)} className="hover:text-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ev.id)} className="hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openCreate(parseInt(selectedDate.split("-")[2]))}>
                <Plus className="h-3.5 w-3.5" />Tambah Event
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEvent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Tambah Event"}</DialogTitle>
            <DialogDescription>{editingEvent ? "Edit detail event kalender" : "Buat event baru di kalender"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Judul</Label><Input placeholder="Nama event" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea placeholder="Detail event..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tanggal Mulai</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tanggal Selesai</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipe Event</Label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value, color: t.color })}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                      form.type === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingEvent(null); }}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingEvent ? "Update" : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
