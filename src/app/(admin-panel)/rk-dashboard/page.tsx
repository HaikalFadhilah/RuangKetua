"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BlogManager } from "@/components/admin/blog-manager";
import {
  Users, MessageSquare, MessagesSquare, BarChart3, ListTodo,
  Trash2, Edit, Save, ShieldAlert, Loader2, Globe, Building2,
  LogOut, RefreshCw, Search, Plus, Activity, Megaphone,
  TrendingUp, UserPlus, AlertCircle, CheckCircle2,
  Clock, XCircle, Eye, EyeOff, Menu, Lock, Unlock, Download,
  HardDrive, Settings, LifeBuoy, GraduationCap, Wifi, WifiOff,
  FileText, ToggleLeft, Send, Ticket
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const PLAN_LABEL_KEY: Record<string, string> = {
  monthly: "admin.plan.monthly",
  halfyear: "admin.plan.halfyear",
  yearly: "admin.plan.yearly",
  trial: "admin.plan.trial",
  none: "admin.plan.none",
};

type Membership = {
  key: "active" | "expiring" | "expired";
  daysLeft: number;
  label: string;
  sub: string;
};

// ─── Sidebar nav items ────────────────────────────────────
const NAV: { titleKey: string; items: { id: string; labelKey: string; icon: LucideIcon; href?: string }[] }[] = [
  {
    titleKey: "admin.nav.sectionMain",
    items: [
      { id: "overview", labelKey: "admin.nav.overview", icon: BarChart3 },
      { id: "users", labelKey: "admin.nav.users", icon: Users },
    ],
  },
  {
    titleKey: "admin.nav.sectionCommunity",
    items: [
      { id: "forums", labelKey: "admin.nav.forum", icon: MessagesSquare },
      { id: "chats", labelKey: "admin.nav.chat", icon: MessageSquare },
      { id: "announcements", labelKey: "nav.announcements", icon: Megaphone },
      { id: "blog", labelKey: "admin.nav.blog", icon: FileText },
      { id: "activity", labelKey: "nav.activity", icon: Activity },
    ],
  },
  {
    titleKey: "admin.nav.sectionOps",
    items: [
      { id: "tickets", labelKey: "nav.tickets", icon: LifeBuoy },
      { id: "files", labelKey: "admin.nav.files", icon: HardDrive },
      { id: "wa-monitor", labelKey: "admin.nav.waMonitor", icon: Wifi },
      { id: "universities", labelKey: "admin.nav.universities", icon: GraduationCap },
      { id: "vouchers", labelKey: "admin.nav.vouchers", icon: Ticket },
    ],
  },
  {
    titleKey: "admin.nav.sectionSystem",
    items: [
      { id: "settings", labelKey: "admin.nav.systemSettings", icon: Settings },
      { id: "team", labelKey: "admin.nav.team", icon: Users },
    ],
  },
];

type Stats = {
  totalUsers: number; totalForums: number; totalChats: number; totalTasks: number;
  totalAnnouncements: number; totalActivities: number;
  newUsersThisWeek: number; newUsersThisMonth: number;
  tasks: { pending: number; inProgress: number; completed: number; overdue: number };
  recentUsers: any[]; recentActivity: any[];
  forumByCategory: any[]; chatByCategory: any[];
};

// ─── Small helpers ────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, loading }:
  { label: string; value: number; icon: any; color: string; sub?: string; loading: boolean }) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="border-border/60 bg-card hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold mt-1">{loading ? "—" : value.toLocaleString()}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-16 text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 opacity-20" />
          {label}
        </div>
      </td>
    </tr>
  );
}

function TableHead({ cols, showCheckbox, isAllSelected, onSelectAll }: { cols: string[], showCheckbox?: boolean, isAllSelected?: boolean, onSelectAll?: () => void }) {
  return (
    <thead>
      <tr className="bg-muted/30 border-b border-border">
        {showCheckbox && (
          <th className="px-4 py-2.5 text-left w-10">
            <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
          </th>
        )}
        {cols.map((c, i) => (
          <th key={i} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Animation variants ───────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const MEMBER_BADGE_CLASS: Record<Membership["key"], string> = {
  active: "bg-primary/10 text-primary",
  expiring: "bg-yellow-500/15 text-yellow-600",
  expired: "bg-red-500/15 text-red-600",
};

// ─── Main component ───────────────────────────────────────
export default function AdminDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [forums, setForums] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [memberFilter, setMemberFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [searchForum, setSearchForum] = useState("");

  // bulk selections
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedForums, setSelectedForums] = useState<string[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  // edit user dialog
  const [editUser, setEditUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "ketua_kelas", password: "", university: "", className: "", isSuspended: false });
  const [savingUser, setSavingUser] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "ketua_kelas", university: "", className: "" });
  const [creating, setCreating] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);

  // create broadcast dialog
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", content: "" });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // ─── 5 Fitur Baru State ───────────────────────────────
  const [adminFiles, setAdminFiles] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [waMonitor, setWaMonitor] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [teamPhotos, setTeamPhotos] = useState<{ photo1: string | null; photo2: string | null; photo3: string | null }>({ photo1: null, photo2: null, photo3: null });
  const [uploadingMember, setUploadingMember] = useState<number | null>(null);
  const [uniForm, setUniForm] = useState({ name: "", shortName: "", city: "" });
  const [addingUni, setAddingUni] = useState(false);
  const [ticketReply, setTicketReply] = useState<{ id: string; msg: string } | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false);
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [voucherForm, setVoucherForm] = useState({ code: "", description: "", discountType: "percent", discountValue: 0, maxUses: "", validFrom: "", validUntil: "", isActive: true, applicablePlan: "" });

  // ─── Fetchers ─────────────────────────────────────────
  const [uniSearch, setUniSearch] = useState("");
  const [uniLimit, setUniLimit] = useState(10);
  const [uniPage, setUniPage] = useState(1);

  // Status langganan berdasarkan sisa waktu:
  //  - > 7 hari  → aktif (ungu)
  //  - ≤ 7 hari  → hampir habis (kuning)
  //  - lewat/expired → terlewat (merah)
  function getMembership(u: { subscriptionPlan?: string | null; subscriptionEnd?: string | Date | null }): Membership {
    const end = u.subscriptionEnd ? new Date(u.subscriptionEnd) : null;
    const now = new Date();
    const plan = u.subscriptionPlan || "none";
    if (!end || end < now) {
      return { key: "expired", daysLeft: 0, label: t("admin.member.expired"), sub: t(PLAN_LABEL_KEY[plan] ?? plan) };
    }
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 7) {
      return { key: "expiring", daysLeft, label: t("admin.member.expiring"), sub: t("admin.member.daysLeft", { count: daysLeft }) };
    }
    return { key: "active", daysLeft, label: t("admin.member.active"), sub: t("admin.member.daysLeft", { count: daysLeft }) };
  }

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    const d = await res.json();
    if (d.success) setStats(d.data);
  }, []);

  const fetchUsers = useCallback(async (q = "") => {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=100`);
    const d = await res.json();
    if (d.success) setUsers(d.data);
  }, []);

  const fetchForums = useCallback(async () => {
    const res = await fetch("/api/admin/forums?limit=100");
    const d = await res.json();
    if (d.success) setForums(d.data);
  }, []);

  const fetchChats = useCallback(async () => {
    const res = await fetch("/api/admin/chats?limit=100");
    const d = await res.json();
    if (d.success) setChats(d.data);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const res2 = await fetch("/api/announcements?limit=100");
    const d2 = await res2.json();
    if (d2.success) setAnnouncements(d2.data ?? d2.announcements ?? []);
  }, []);

  const fetchActivity = useCallback(async () => {
    const res = await fetch("/api/activity?limit=50");
    const d = await res.json();
    if (d.success) setActivityLogs(d.data ?? []);
  }, []);

  const fetchAdminFiles = useCallback(async () => {
    const res = await fetch("/api/admin/files");
    const d = await res.json();
    if (d.success) setAdminFiles(d.data ?? []);
  }, []);

  const fetchTickets = useCallback(async () => {
    const res = await fetch("/api/admin/tickets");
    const d = await res.json();
    if (d.success) setTickets(d.data ?? []);
  }, []);

  const fetchUniversities = useCallback(async () => {
    const res = await fetch("/api/admin/universities");
    const d = await res.json();
    if (d.success) setUniversities(d.data ?? []);
  }, []);

  const fetchWaMonitor = useCallback(async () => {
    const res = await fetch("/api/admin/whatsapp-monitor");
    const d = await res.json();
    if (d.success) setWaMonitor(d.data);
  }, []);

  const fetchVouchers = useCallback(async () => {
    const res = await fetch("/api/admin/vouchers");
    const d = await res.json();
    if (d.success) setVouchers(d.data);
  }, []);

  const fetchSysSettings = useCallback(async () => {
    const res = await fetch("/api/admin/system-settings");
    const d = await res.json();
    if (d.success) setSysSettings(d.data);
  }, []);

  const fetchTeamPhotos = useCallback(async () => {
    const res = await fetch("/api/public/settings");
    const d = await res.json();
    if (d.success) {
      setTeamPhotos({
        photo1: d.data?.teamPhoto1 ?? null,
        photo2: d.data?.teamPhoto2 ?? null,
        photo3: d.data?.teamPhoto3 ?? null,
      });
    }
  }, []);

  const handleTeamPhotoUpload = async (memberIndex: number, file: File) => {
    setUploadingMember(memberIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("memberIndex", String(memberIndex));
      const res = await fetch("/api/admin/team-photo", { method: "POST", body: formData });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success("Foto berhasil diupload");
      fetchTeamPhotos();
    } catch (err: any) {
      toast.error(err.message || "Gagal upload foto");
    } finally {
      setUploadingMember(null);
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(), fetchUsers(), fetchForums(), fetchChats(),
        fetchAnnouncements(), fetchActivity(),
        fetchAdminFiles(), fetchTickets(), fetchUniversities(),
        fetchWaMonitor(), fetchSysSettings(), fetchVouchers(),
        fetchTeamPhotos(),
      ]);
      setSelectedUsers([]);
      setSelectedForums([]);
      setSelectedChats([]);
      setSelectedVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchUsers, fetchForums, fetchChats, fetchAnnouncements, fetchActivity, fetchAdminFiles, fetchTickets, fetchUniversities, fetchWaMonitor, fetchSysSettings, fetchVouchers, fetchTeamPhotos]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // debounced user search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(searchUser), 350);
    return () => clearTimeout(t);
  }, [searchUser, fetchUsers]);

  // ─── Auth ──────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/rk-superadmin");
  };

  // ─── Export CSV ───────────────────────────────────────
  const exportToCSV = (filename: string, rows: object[]) => {
    if (!rows || !rows.length) {
      toast.error(t("admin.toast.noDataExport"));
      return;
    }
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows.map(row => {
        return keys.map(k => {
          const val = row[k as keyof typeof row] as any;
          let cellString = "";
          if (val !== null && val !== undefined) {
             cellString = val instanceof Date ? val.toLocaleString() : String(val);
          }
          cellString = cellString.replace(/"/g, '""');
          if (cellString.search(/("|,|\n)/g) >= 0) {
            cellString = `"${cellString}"`;
          }
          return cellString;
        }).join(separator);
      }).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ─── Bulk Delete ──────────────────────────────────────
  const handleBulkDelete = async (type: string, ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(t("admin.confirm.bulkDelete", { count: ids.length }))) return;

    try {
      const res = await fetch("/api/admin/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("admin.toast.bulkDeleted", { count: data.data.count }));
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.deleteFailed"));
    }
  };

  // ─── User Actions ─────────────────────────────────────
  const openEdit = (u: any) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, role: u.role, password: "", university: u.university || "", className: u.className || "", isSuspended: u.isSuspended || false });
  };

  const handleSaveUser = async () => {
    setSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.userUpdated"));
      setEditUser(null);
      fetchUsers(searchUser);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.userUpdateFailed"));
    } finally {
      setSavingUser(false);
    }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.userCreated"));
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", role: "ketua_kelas", password: "", university: "", className: "" });
      fetchUsers(searchUser);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.userCreateFailed"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSuspend = async (u: any) => {
    const isSuspending = !u.isSuspended;
    if (!confirm(t("admin.confirm.suspend", { action: isSuspending ? t("admin.suspendAction") : t("admin.unsuspendAction"), name: u.name }))) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: isSuspending }), // Needs the field available in the API which we added
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.suspendResult", { status: isSuspending ? t("admin.suspendedStatus") : t("admin.activatedStatus") }));
      await fetchUsers(searchUser); // PASTI UPDATE UI
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.statusFailed"));
    }
  };

  // ─── Create Broadcast ─────────────────────────────────
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.content) {
      toast.error(t("admin.toast.broadcastRequired"));
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/announcements", {
         method: "POST",
         headers: { "Content-Type" : "application/json" },
         body: JSON.stringify({ ...broadcastForm, broadcast: true, pinned: true, category: "System Announcement" })
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.broadcastSent"));
      setBroadcastOpen(false);
      setBroadcastForm({ title: "", content: "" });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.broadcastFailed"));
    } finally {
      setSendingBroadcast(false);
    }
  }

  // ─── File Storage Handlers ────────────────────────────
  const handleDeleteFile = async (id: string) => {
    if (!confirm(t("admin.confirm.deleteFile"))) return;
    try {
      const res = await fetch(`/api/admin/files?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.fileDeleted"));
      fetchAdminFiles();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.fileDeleteFailed"));
    }
  };

  // ─── Ticket Handlers ──────────────────────────────────
  const handleTicketReply = async () => {
    if (!ticketReply?.msg.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticketReply.id, replyMessage: ticketReply.msg, status: "IN_PROGRESS" }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.replySent"));
      setTicketReply(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.replyFailed"));
    } finally {
      setSendingReply(false);
    }
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.ticketUpdated"));
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.ticketFailed"));
    }
  };

  // ─── University Handlers ──────────────────────────────
  const handleAddUniversity = async () => {
    if (!uniForm.name.trim()) { toast.error(t("admin.toast.uniNameRequired")); return; }
    setAddingUni(true);
    try {
      const res = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uniForm),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.uniAdded"));
      setUniForm({ name: "", shortName: "", city: "" });
      fetchUniversities();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.uniAddFailed"));
    } finally {
      setAddingUni(false);
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (!confirm(t("admin.confirm.deleteUni"))) return;
    try {
      const res = await fetch(`/api/admin/universities?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.uniDeleted"));
      fetchUniversities();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.uniDeleteFailed"));
    }
  };

  // ─── Voucher Handlers ─────────────────────────────────
  const handleCreateVoucher = async () => {
    if (!voucherForm.code) return toast.error(t("admin.toast.voucherCodeRequired"));
    setCreatingVoucher(true);
    try {
      const payload: any = { ...voucherForm };
      payload.maxUses = payload.maxUses ? parseInt(payload.maxUses) : null;
      payload.validFrom = payload.validFrom ? new Date(payload.validFrom).toISOString() : null;
      payload.validUntil = payload.validUntil ? new Date(payload.validUntil).toISOString() : null;
      if (payload.applicablePlan === "") payload.applicablePlan = null;

      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);

      toast.success(t("admin.toast.voucherCreated"));
      setCreateVoucherOpen(false);
      setVoucherForm({ code: "", description: "", discountType: "percent", discountValue: 0, maxUses: "", validFrom: "", validUntil: "", isActive: true, applicablePlan: "" });
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.voucherFailed"));
    } finally {
      setCreatingVoucher(false);
    }
  };

  // ─── System Settings Handler ──────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sysSettings),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(t("admin.toast.settingsSaved"));
      fetchSysSettings();
    } catch (err: any) {
      toast.error(err.message || t("admin.toast.settingsFailed"));
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Filtered lists ───────────────────────────────────
  const filteredForums = forums.filter(f =>
    !searchForum || f.title?.toLowerCase().includes(searchForum.toLowerCase()) || f.user?.name?.toLowerCase().includes(searchForum.toLowerCase())
  );

  // ─── Task donut data ──────────────────────────────────
  const taskTotal = stats ? stats.tasks.pending + stats.tasks.inProgress + stats.tasks.completed + stats.tasks.overdue : 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col bg-card border-r border-border
        transform transition-transform duration-200 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-border shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Ruang Ketua</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("nav.adminPanel")}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {NAV.map((section) => (
            <div key={section.titleKey} className="space-y-0.5">
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(section.titleKey)}
              </p>
              {section.items.map(({ id, labelKey, icon: Icon, href }) =>
                href ? (
                  <Link
                    key={id}
                    href={href}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(labelKey)}
                  </Link>
                ) : (
                  <button
                    key={id}
                    onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeNav === id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(labelKey)}
                  </button>
                )
              )}
            </div>
          ))}
        </nav>

        {/* Bottom logout */}
        <div className="p-3 border-t border-border shrink-0 space-y-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ToggleLeft className="h-4 w-4" />
              {t("admin.backToApp")}
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Topbar ── */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-md hover:bg-muted" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold">
                {t(NAV.flatMap((s) => s.items).find((n) => n.id === activeNav)?.labelKey ?? "nav.dashboard")}
              </h1>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={loadAll} disabled={loading} className="h-8 text-xs gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("action.refresh")}
          </Button>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">

            {/* ══ OVERVIEW ══════════════════════════════════════════ */}
            {activeNav === "overview" && (
              <motion.div key="overview" variants={stagger} initial="hidden" animate="show" className="space-y-6">

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  <StatCard label={t("admin.stat.totalUsers")} value={stats?.totalUsers ?? 0} icon={Users} color="text-blue-500"
                    sub={stats ? t("admin.stat.weekThis", { count: stats.newUsersThisWeek }) : ""} loading={loading} />
                  <StatCard label={t("admin.stat.forumPosts")} value={stats?.totalForums ?? 0} icon={MessagesSquare} color="text-violet-500"
                    sub={t("admin.stat.allCategories")} loading={loading} />
                  <StatCard label={t("admin.stat.chatMessages")} value={stats?.totalChats ?? 0} icon={MessageSquare} color="text-emerald-500"
                    sub={t("admin.stat.globalChat")} loading={loading} />
                  <StatCard label={t("admin.stat.totalTasks")} value={stats?.totalTasks ?? 0} icon={ListTodo} color="text-orange-500"
                    sub={t("admin.stat.allUsers")} loading={loading} />
                  <StatCard label={t("admin.nav.universities")} value={universities.length} icon={GraduationCap} color="text-pink-500"
                    sub={t("admin.stat.allCategories")} loading={loading} />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Task breakdown */}
                  <motion.div variants={fadeUp}>
                    <Card className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("admin.task.statusTitle")}</CardTitle>
                        <CardDescription className="text-xs">{t("admin.task.statusDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { labelKey: "admin.task.pending", value: stats?.tasks.pending ?? 0, color: "bg-yellow-500", icon: Clock, textColor: "text-yellow-500" },
                          { labelKey: "admin.task.inProgress", value: stats?.tasks.inProgress ?? 0, color: "bg-blue-500", icon: TrendingUp, textColor: "text-blue-500" },
                          { labelKey: "admin.task.completed", value: stats?.tasks.completed ?? 0, color: "bg-emerald-500", icon: CheckCircle2, textColor: "text-emerald-500" },
                          { labelKey: "admin.task.overdue", value: stats?.tasks.overdue ?? 0, color: "bg-red-500", icon: XCircle, textColor: "text-red-500" },
                        ].map(({ labelKey, value, color, icon: Icon, textColor }) => (
                          <div key={labelKey} className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 shrink-0 ${textColor}`} />
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{t(labelKey)}</span>
                                <span className="text-muted-foreground">{value} / {taskTotal}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${color} transition-all duration-700`}
                                  style={{ width: taskTotal ? `${(value / taskTotal) * 100}%` : "0%" }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent users */}
                  <motion.div variants={fadeUp}>
                    <Card className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{t("admin.user.recent")}</CardTitle>
                        <CardDescription className="text-xs">{t("admin.user.recentDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {loading && <div className="text-sm text-muted-foreground">{t("action.loading")}</div>}
                        {!loading && (stats?.recentUsers ?? []).map((u) => (
                          <div key={u.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px] mb-0.5">
                                {u.role === "admin" ? t("admin.role.admin") : t("admin.role.ketua")}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(u.createdAt), { locale: idLocale, addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                  </Card>
                </motion.div>
                </div>
              </motion.div>
            )}

            {/* ══ USERS ══════════════════════════════════════════════ */}
            {activeNav === "users" && (
              <motion.div key="users" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.user.managementTitle")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.user.managementDesc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("users.csv", users.map(u => ({ "ID": u.id, "Nama": u.name, "Email": u.email, "Role": u.role, "Kampus": u.university, "Kelas": u.className, "Paket": PLAN_LABEL_KEY[u.subscriptionPlan || "none"] ? t(PLAN_LABEL_KEY[u.subscriptionPlan || "none"]) : (u.subscriptionPlan || "—"), "Sisa Hari": getMembership(u).daysLeft, "Status Langganan": getMembership(u).label, "Berakhir": u.subscriptionEnd || "-", "Bergabung": u.createdAt, "Status": u.isSuspended ? t("admin.suspended") : t("admin.active") })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                    </Button>
                    <Button size="sm" className="gap-2 h-9" onClick={() => setCreateOpen(true)}>
                      <UserPlus className="h-4 w-4" /> {t("admin.user.add")}
                    </Button>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("admin.user.searchPlaceholder")} className="pl-9 h-9 text-sm" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedUsers.length > 0 && (
                       <Button size="sm" variant="destructive" onClick={() => handleBulkDelete("users", selectedUsers)}>
                          {t("admin.selectedDelete", { count: selectedUsers.length })}
                       </Button>
                    )}
                    <Badge variant="outline" className="text-xs shrink-0">{t("admin.user.count", { count: users.length })}</Badge>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
                  {([["all", "admin.filter.all"], ["active", "admin.filter.long"], ["expiring", "admin.filter.expiring"], ["expired", "admin.filter.expired"]] as const).map(([k, lblKey]) => (
                    <button
                      key={k}
                      onClick={() => setMemberFilter(k)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${memberFilter === k ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {t(lblKey)}
                    </button>
                  ))}
                </motion.div>

                {(() => {
                  const displayedUsers = memberFilter === "all" ? users : users.filter(u => getMembership(u).key === memberFilter);
                  return (
                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead
                           cols={[t("admin.col.user"), t("admin.col.univClass"), t("admin.col.statusRole"), t("admin.col.subscription"), t("admin.col.joined"), t("admin.col.action")]}
                           showCheckbox
                           isAllSelected={displayedUsers.length > 0 && selectedUsers.length === displayedUsers.length}
                           onSelectAll={() => setSelectedUsers(selectedUsers.length === displayedUsers.length ? [] : displayedUsers.map(u => u.id))}
                        />
                        <tbody className="divide-y divide-border/40">
                          {displayedUsers.length === 0 && <EmptyRow cols={7} label={t("admin.user.empty")} />}
                          {displayedUsers.map(u => (
                            <tr key={u.id} className={`hover:bg-muted/20 transition-colors group ${u.isSuspended ? 'bg-destructive/5' : ''}`}>
                              <td className="px-4 py-3">
                                <Checkbox checked={selectedUsers.includes(u.id)} onCheckedChange={(checked) => setSelectedUsers(prev => checked ? [...prev, u.id] : prev.filter(id => id !== u.id))} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${u.isSuspended ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>
                                    {u.isSuspended ? <Lock className="h-3 w-3" /> : u.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className={`font-medium text-sm ${u.isSuspended ? 'line-through text-muted-foreground' : ''}`}>{u.name}</p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                 <p>{u.university || "—"}</p>
                                 <p>{u.className || "—"}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px] font-medium mb-1">
                                  {u.role === "admin" ? t("admin.role.admin") : t("admin.role.ketuaKelas")}
                                </Badge><br/>
                                {u.isSuspended && <Badge variant="destructive" className="text-[9px]">{t("admin.suspended")}</Badge>}
                              </td>
                              <td className="px-4 py-3">
                                {(() => {
                                  const m = getMembership(u);
                                  return (
                                    <>
                                      <Badge className={`text-[10px] font-medium ${MEMBER_BADGE_CLASS[m.key]}`}>
                                        {t(PLAN_LABEL_KEY[u.subscriptionPlan || "none"] ?? u.subscriptionPlan) + " · " + m.sub}
                                      </Badge>
                                      {u.subscriptionEnd && (
                                        <p className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                                          {format(new Date(u.subscriptionEnd), "dd MMM yyyy", { locale: idLocale })}
                                        </p>
                                      )}
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(u.createdAt), "dd MMM yyyy", { locale: idLocale })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                  <Button size="icon" variant="ghost" className={`h-7 w-7 ${u.isSuspended ? 'text-green-500 hover:text-green-600' : 'text-amber-500 hover:text-amber-600'}`} onClick={() => handleToggleSuspend(u)} title={u.isSuspended ? t("admin.title.unsuspend") : t("admin.title.suspend")}>
                                    {u.isSuspended ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)} title={t("admin.title.edit")}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleBulkDelete("users", [u.id])} title={t("admin.title.delete")}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
                  );
                })()}
              </motion.div>
            )}

            {/* ══ FORUM ═════════════════════════════════════════════ */}
            {activeNav === "forums" && (
              <motion.div key="forums" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.forum.managementTitle")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.forum.managementDesc")}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("forums.csv", forums.map(f => ({ "ID": f.id, "Judul": f.title, "Author": f.user?.name, "Email": f.user?.email, "Kategori": f.category, "Tanggal": f.createdAt })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t("admin.forum.searchPlaceholder")} className="pl-9 h-9 text-sm w-64" value={searchForum} onChange={e => setSearchForum(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedForums.length > 0 && (
                          <Button size="sm" variant="destructive" onClick={() => handleBulkDelete("forums", selectedForums)}>
                              {t("admin.selectedDelete", { count: selectedForums.length })}
                          </Button>
                        )}
                        <Badge variant="outline" className="text-xs shrink-0">{t("admin.forum.postCount", { count: filteredForums.length })}</Badge>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead
                           cols={[t("admin.col.post"), t("admin.col.category"), t("admin.col.author"), t("admin.col.comments"), t("admin.col.date"), t("admin.col.action")]}
                           showCheckbox
                           isAllSelected={filteredForums.length > 0 && selectedForums.length === filteredForums.length}
                           onSelectAll={() => setSelectedForums(selectedForums.length === filteredForums.length ? [] : filteredForums.map(f => f.id))}
                        />
                        <tbody className="divide-y divide-border/40">
                          {filteredForums.length === 0 && <EmptyRow cols={7} label={t("admin.forum.empty")} />}
                          {filteredForums.map(f => (
                            <tr key={f.id} className="hover:bg-muted/20 transition-colors group">
                               <td className="px-4 py-3">
                                <Checkbox checked={selectedForums.includes(f.id)} onCheckedChange={(checked) => setSelectedForums(prev => checked ? [...prev, f.id] : prev.filter(id => id !== f.id))} />
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="font-medium truncate">{f.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{f.content?.slice(0, 80)}…</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  {f.category === "PUBLIC" ? <Globe className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
                                  {f.category === "PUBLIC" ? t("admin.forum.public") : t("admin.forum.campus")}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium">{f.user?.name}</p>
                                <p className="text-xs text-muted-foreground">{f.user?.email}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="secondary" className="text-xs">{f._count?.comments ?? 0}</Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(f.createdAt), "dd MMM yyyy", { locale: idLocale })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleBulkDelete("forums", [f.id])}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ CHATS ══════════════════════════════════════════════ */}
            {activeNav === "chats" && (
              <motion.div key="chats" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                 <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.chat.managementTitle")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.chat.managementDesc")}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("chat_logs.csv", chats.map(c => ({ "ID": c.id, "Waktu": c.createdAt, "Pengirim": c.user?.name, "Pesan": c.content, "Kategori": c.category })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
                   <div className="flex items-center gap-3">
                        {selectedChats.length > 0 && (
                          <Button size="sm" variant="destructive" onClick={() => handleBulkDelete("chats", selectedChats)}>
                              {t("admin.selectedDelete", { count: selectedChats.length })}
                          </Button>
                        )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{t("admin.chat.count", { count: chats.length })}</Badge>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                         <TableHead
                           cols={[t("admin.col.time"), t("admin.col.message"), t("admin.col.category"), t("admin.col.sender"), t("admin.col.action")]}
                           showCheckbox
                           isAllSelected={chats.length > 0 && selectedChats.length === chats.length}
                           onSelectAll={() => setSelectedChats(selectedChats.length === chats.length ? [] : chats.map(c => c.id))}
                         />
                         <tbody className="divide-y divide-border/40">
                           {chats.length === 0 && <EmptyRow cols={6} label={t("admin.chat.empty")} />}
                           {chats.map(c => (
                             <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                               <td className="px-4 py-3">
                                 <Checkbox checked={selectedChats.includes(c.id)} onCheckedChange={(checked) => setSelectedChats(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                               </td>
                               <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                 {format(new Date(c.createdAt), "dd MMM, HH:mm", { locale: idLocale })}
                               </td>
                               <td className="px-4 py-3 max-w-sm">
                                 <p className="truncate text-sm">{c.content}</p>
                               </td>
                               <td className="px-4 py-3">
                                 <Badge variant="outline" className="text-[10px] gap-1">
                                   {c.category === "PUBLIC" ? <Globe className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
                                   {c.category === "PUBLIC" ? t("admin.chat.public") : `${t("admin.chat.campus")}${c.university ? ` · ${c.university}` : ""}`}
                                 </Badge>
                               </td>
                               <td className="px-4 py-3">
                                 <p className="text-sm font-medium">{c.user?.name}</p>
                                 <p className="text-xs text-muted-foreground">{c.user?.email}</p>
                               </td>
                               <td className="px-4 py-3 text-right">
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleBulkDelete("chats", [c.id])}>
                                     <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                 </div>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ ANNOUNCEMENTS ═════════════════════════════════════ */}
            {activeNav === "announcements" && (
              <motion.div key="announcements" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                 <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.announcement.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.announcement.desc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("announcements.csv", announcements.map(a => ({ "ID": a.id, "Judul": a.title, "Isi": a.content, "Pembuat": a.user?.name, "Broadcast": a.broadcast ? "Ya" : "Tidak", "Tanggal": a.createdAt })))}>
                        <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                    </Button>
                    <Button size="sm" className="gap-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setBroadcastOpen(true)}>
                      <Megaphone className="h-4 w-4" /> {t("admin.announcement.createBroadcast")}
                    </Button>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="w-full flex justify-end">
                   <Badge variant="outline">{t("admin.announcement.count", { count: announcements.length })}</Badge>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead cols={[t("admin.col.title"), t("admin.col.category"), t("admin.col.author"), t("admin.col.status"), t("admin.col.date")]} />
                        <tbody className="divide-y divide-border/40">
                          {announcements.length === 0 && <EmptyRow cols={5} label={t("admin.announcement.empty")} />}
                          {announcements.map(a => (
                            <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 max-w-xs">
                                <p className="font-medium truncate">{a.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{a.content?.slice(0, 60)}…</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px] capitalize">{a.category}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium">{a.user?.name ?? t("admin.systemAdmin")}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {a.pinned && <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{t("admin.badge.pinned")}</Badge>}
                                  {a.broadcast && <Badge className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30">{t("admin.badge.broadcast")}</Badge>}
                                  {!a.pinned && !a.broadcast && <span className="text-xs text-muted-foreground">—</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(a.createdAt), "dd MMM yyyy", { locale: idLocale })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ BLOG ══════════════════════════════════════════════ */}
            {activeNav === "blog" && (
              <motion.div key="blog" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <BlogManager />
              </motion.div>
            )}

            {/* ══ ACTIVITY LOG ══════════════════════════════════════ */}
            {activeNav === "activity" && (
              <motion.div key="activity" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                 <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.activity.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.activity.desc")}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("activity_log.csv", activityLogs.map(l => ({ "ID": l.id, "Waktu": l.createdAt, "Pelaku": l.user?.name || "System", "Aksi": l.action, "Objek": l.entity, "Deskripsi": l.description })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="w-full flex justify-end">
                   <Badge variant="outline">{t("admin.activity.count", { count: activityLogs.length })}</Badge>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead cols={[t("admin.col.time"), t("admin.col.user"), t("admin.col.action"), t("admin.col.entity"), t("admin.col.description")]} />
                        <tbody className="divide-y divide-border/40">
                          {activityLogs.length === 0 && <EmptyRow cols={5} label={t("admin.activity.empty")} />}
                          {activityLogs.map(log => (
                            <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: idLocale })}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium">{log.user?.name ?? t("admin.system")}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary" className="text-[10px] uppercase">{log.action}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px]">{log.entity}</Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-sm">
                                {log.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ FILE STORAGE ═══════════════════════════════════════ */}
            {activeNav === "files" && (
              <motion.div key="files" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{t("admin.files.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.files.desc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("files.csv", adminFiles.map(f => ({ "Nama": f.name, "Tipe": f.fileType, "Ukuran (KB)": Math.round(f.fileSize/1024), "User": f.user?.name, "Kampus": f.user?.university, "Tanggal": f.createdAt })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                    </Button>
                    <Badge variant="outline" className="text-xs">{t("admin.files.count", { count: adminFiles.length })}</Badge>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead cols={[t("admin.col.fileName"), t("admin.col.type"), t("admin.col.size"), t("admin.col.owner"), t("admin.col.campus"), t("admin.col.date"), t("admin.col.action")]} />
                        <tbody className="divide-y divide-border/40">
                          {adminFiles.length === 0 && <EmptyRow cols={7} label={t("admin.files.empty")} />}
                          {adminFiles.map(f => (
                            <tr key={f.id} className="hover:bg-muted/20 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm font-medium truncate max-w-[200px]">{f.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{f.fileType}</Badge></td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{Math.round(f.fileSize / 1024)} KB</td>
                              <td className="px-4 py-3 text-xs">{f.user?.name ?? "—"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{f.user?.university ?? "—"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(f.createdAt), "dd MMM yyyy", { locale: idLocale })}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFile(f.id)} title={t("admin.files.deleteTitle")}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ TIKET BANTUAN ══════════════════════════════════════ */}
            {activeNav === "tickets" && (
              <motion.div key="tickets" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{t("nav.tickets")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.ticket.desc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{t("admin.ticket.open", { count: tickets.filter(tk => tk.status === "OPEN").length })}</Badge>
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">{t("admin.ticket.resolved", { count: tickets.filter(tk => tk.status === "RESOLVED").length })}</Badge>
                    <Badge variant="outline" className="text-xs">{t("admin.ticket.total", { count: tickets.length })}</Badge>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  {tickets.length === 0 && (
                    <Card className="border-border/60"><CardContent className="py-16 text-center text-muted-foreground text-sm"><LifeBuoy className="h-8 w-8 opacity-20 mx-auto mb-2" />{t("admin.ticket.empty")}</CardContent></Card>
                  )}
                  {tickets.map(tk => (
                    <Card key={tk.id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{tk.subject}</p>
                              <Badge variant="outline" className={`text-[10px] ${tk.status === "OPEN" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" : tk.status === "RESOLVED" ? "bg-green-500/10 text-green-600 border-green-500/30" : tk.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-muted"}`}>{tk.status}</Badge>
                              <Badge variant="outline" className="text-[10px]">{tk.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{tk.user?.name} · {tk.user?.university ?? "—"} · {format(new Date(tk.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}</p>
                            <p className="text-sm mt-2 text-muted-foreground">{tk.message}</p>
                            {tk.replies?.length > 0 && (
                              <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
                                {tk.replies.map((r: any) => (
                                  <div key={r.id} className={`text-xs p-2 rounded-md ${r.isAdmin ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                                    <span className={`font-semibold ${r.isAdmin ? "text-primary" : ""}`}>{r.isAdmin ? t("admin.role.admin") : r.user?.name}</span>
                                    <span className="text-muted-foreground ml-2">{format(new Date(r.createdAt), "dd MMM HH:mm", { locale: idLocale })}</span>
                                    <p className="mt-1">{r.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {ticketReply?.id === tk.id && (
                              <div className="mt-3 flex gap-2">
                                <Textarea placeholder={t("admin.ticket.replyPlaceholder")} className="text-xs min-h-[60px]" value={ticketReply?.msg ?? ""} onChange={e => setTicketReply({ id: tk.id, msg: e.target.value })} />
                                <div className="flex flex-col gap-1">
                                  <Button size="sm" className="h-8" onClick={handleTicketReply} disabled={sendingReply}>
                                    {sendingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => setTicketReply(null)}><XCircle className="h-3 w-3" /></Button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {ticketReply?.id !== tk.id && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setTicketReply({ id: tk.id, msg: "" })}>
                                <Send className="h-3 w-3" /> {t("admin.ticket.reply")}
                              </Button>
                            )}
                            {tk.status !== "RESOLVED" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => handleTicketStatus(tk.id, "RESOLVED")}>
                                <CheckCircle2 className="h-3 w-3" /> {t("admin.ticket.resolve")}
                              </Button>
                            )}
                            {tk.status !== "CLOSED" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleTicketStatus(tk.id, "CLOSED")}>
                                <XCircle className="h-3 w-3" /> {t("action.close")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ══ MASTER UNIVERSITAS ═════════════════════════════════ */}
            {activeNav === "universities" && (
              <motion.div key="universities" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{t("admin.uni.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.uni.desc")}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">{universities.length}</Badge>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="p-4 border-b border-border/40 bg-muted/10 grid gap-4 grid-cols-1 md:grid-cols-2">
                       <div className="space-y-2">
                         <p className="text-xs font-semibold">{t("admin.uni.addTitle")}</p>
                         <div className="flex items-center gap-2">
                            <Input className="h-8 text-xs" placeholder={t("admin.uni.namePlaceholder")} value={uniForm.name} onChange={e => setUniForm({...uniForm, name: e.target.value})} />
                            <Input className="h-8 w-24 text-xs" placeholder={t("admin.uni.shortPlaceholder")} value={uniForm.shortName} onChange={e => setUniForm({...uniForm, shortName: e.target.value})} />
                            <Input className="h-8 w-32 text-xs" placeholder={t("admin.uni.cityPlaceholder")} value={uniForm.city} onChange={e => setUniForm({...uniForm, city: e.target.value})} />
                            <Button size="sm" className="h-8 gap-1.5 px-3 shrink-0" onClick={handleAddUniversity} disabled={addingUni}>
                              {addingUni ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} {t("action.add")}
                            </Button>
                         </div>
                       </div>

                       <div className="space-y-2 flex flex-col md:items-end justify-end">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder={t("admin.uni.searchPlaceholder")}
                                className="h-8 pl-8 text-xs"
                                value={uniSearch}
                                onChange={(e) => { setUniSearch(e.target.value); setUniPage(1); }}
                              />
                            </div>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={uniLimit}
                              onChange={(e) => { setUniLimit(Number(e.target.value)); setUniPage(1); }}
                            >
                              <option value={10}>{t("admin.uni.rows10")}</option>
                              <option value={20}>{t("admin.uni.rows20")}</option>
                              <option value={50}>{t("admin.uni.rows50")}</option>
                              <option value={100}>{t("admin.uni.rows100")}</option>
                              <option value={universities.length}>{t("admin.uni.showAll")}</option>
                            </select>
                          </div>
                       </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead cols={[t("admin.col.no"), t("admin.col.univName"), t("admin.col.short"), t("admin.col.city"), t("admin.col.status"), t("admin.col.action")]} />
                        <tbody className="divide-y divide-border/40">
                          {(() => {
                             const filtered = universities.filter(u =>
                                u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
                                (u.shortName && u.shortName.toLowerCase().includes(uniSearch.toLowerCase())) ||
                                (u.city && u.city.toLowerCase().includes(uniSearch.toLowerCase()))
                             );
                             const totalPages = Math.ceil(filtered.length / uniLimit);
                             const startIdx = (uniPage - 1) * uniLimit;
                             const paginatedList = filtered.slice(startIdx, startIdx + uniLimit);

                             if (filtered.length === 0) {
                               return <EmptyRow cols={6} label={t("admin.uni.empty")} />;
                             }

                             return (
                               <>
                                 {paginatedList.map((u, i) => (
                                    <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                                      <td className="px-4 py-3 text-xs text-muted-foreground w-12">{startIdx + i + 1}</td>
                                      <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.shortName ?? "—"}</td>
                                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.city ?? "—"}</td>
                                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">{t("admin.active")}</Badge></td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUniversity(u.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                 ))}
                                 {totalPages > 1 && (
                                   <tr>
                                      <td colSpan={6} className="px-4 py-3 border-t border-border/40 bg-muted/5">
                                         <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">
                                               {t("admin.uni.pagination", { start: startIdx + 1, end: Math.min(startIdx + uniLimit, filtered.length), filtered: filtered.length, total: universities.length })}
                                            </p>
                                            <div className="flex items-center justify-end gap-1">
                                               <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={uniPage === 1} onClick={() => setUniPage(p => Math.max(1, p - 1))}>{t("admin.prev")}</Button>
                                               <div className="bg-background border px-3 h-7 flex items-center rounded-md text-xs font-medium">{uniPage} / {totalPages}</div>
                                               <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={uniPage === totalPages} onClick={() => setUniPage(p => Math.min(totalPages, p + 1))}>{t("admin.next")}</Button>
                                            </div>
                                         </div>
                                      </td>
                                   </tr>
                                 )}
                               </>
                             );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ VOUCHERS ══════════════════════════════════════════ */}
            {activeNav === "vouchers" && (
              <motion.div key="vouchers" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{t("admin.voucher.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.voucher.desc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-2 h-9" onClick={() => exportToCSV("vouchers.csv", vouchers.map(v => ({ "Kode": v.code, "Potongan": `${v.discountValue}${v.discountType === 'percent' ? '%' : ' Rupiah'}`, "Status": v.isActive ? t("admin.voucher.active") : t("admin.voucher.inactive"), "Terpakai": v.usedCount, "Limit": v.maxUses || "Unlimited" })))}>
                      <Download className="h-4 w-4" /> {t("admin.exportCsv")}
                    </Button>
                    <Button size="sm" className="gap-2 h-9" onClick={() => setCreateVoucherOpen(true)}>
                      <Plus className="h-4 w-4" /> {t("admin.voucher.create")}
                    </Button>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
                   <div className="flex items-center gap-3">
                        {selectedVouchers.length > 0 && (
                          <Button size="sm" variant="destructive" onClick={() => handleBulkDelete("vouchers", selectedVouchers)}>
                              {t("admin.selectedDelete", { count: selectedVouchers.length })}
                          </Button>
                        )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{t("admin.voucher.count", { count: vouchers.length })}</Badge>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead
                           cols={[t("admin.col.code"), t("admin.col.discount"), t("admin.col.planLimit"), t("admin.col.used"), t("admin.col.status"), t("admin.col.validUntil"), t("admin.col.action")]}
                           showCheckbox
                           isAllSelected={vouchers.length > 0 && selectedVouchers.length === vouchers.length}
                           onSelectAll={() => setSelectedVouchers(selectedVouchers.length === vouchers.length ? [] : vouchers.map(v => v.id))}
                        />
                        <tbody className="divide-y divide-border/40">
                          {vouchers.length === 0 && <EmptyRow cols={8} label={t("admin.voucher.empty")} />}
                          {vouchers.map(v => {
                             const isExpired = v.validUntil && new Date(v.validUntil) < new Date();
                             const isExhausted = v.maxUses !== null && v.usedCount >= v.maxUses;
                             const isUsable = v.isActive && !isExpired && !isExhausted;

                             return (
                              <tr key={v.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-4 py-3">
                                  <Checkbox checked={selectedVouchers.includes(v.id)} onCheckedChange={(c) => setSelectedVouchers(prev => c ? [...prev, v.id] : prev.filter(id => id !== v.id))} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold tracking-widest uppercase text-sm">{v.code}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate" title={v.description}>{v.description || "—"}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary" className="font-mono gap-1 text-[11px] bg-primary/10 text-primary hover:bg-primary/20">
                                    {v.discountType === "percent" ? `${v.discountValue}%` : `Rp ${v.discountValue.toLocaleString('id-ID')}`}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                   {v.applicablePlan ? <Badge variant="outline" className="text-[10px] uppercase">{t("admin.plan." + v.applicablePlan)}</Badge> : t("admin.allPlans")}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <span className="font-semibold">{v.usedCount}</span> / {v.maxUses === null ? "∞" : v.maxUses}
                                </td>
                                <td className="px-4 py-3">
                                   <Badge variant="outline" className={`text-[10px] uppercase ${isUsable ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                                      {isUsable ? t("admin.voucher.active") : (isExpired ? t("admin.voucher.expired") : (isExhausted ? t("admin.voucher.exhausted") : t("admin.voucher.inactive")))}
                                   </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                  {v.validUntil ? format(new Date(v.validUntil), "dd MMM yyyy HH:mm", { locale: idLocale }) : t("admin.forever")}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleBulkDelete("vouchers", [v.id])}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ WA MONITOR ════════════════════════════════════════ */}
            {activeNav === "wa-monitor" && (
              <motion.div key="wa-monitor" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{t("admin.wa.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.wa.desc")}</p>
                  </div>
                </motion.div>
                {waMonitor && (
                  <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
                    <Card className="border-border/60"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-green-500/10"><Wifi className="h-5 w-5 text-green-500" /></div><div><p className="text-xs text-muted-foreground">{t("admin.wa.connected")}</p><p className="text-2xl font-bold">{waMonitor.stats?.connected ?? 0}</p></div></CardContent></Card>
                    <Card className="border-border/60"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-500" /></div><div><p className="text-xs text-muted-foreground">{t("admin.wa.connecting")}</p><p className="text-2xl font-bold">{waMonitor.stats?.connecting ?? 0}</p></div></CardContent></Card>
                    <Card className="border-border/60"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-destructive/10"><WifiOff className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">{t("admin.wa.disconnected")}</p><p className="text-2xl font-bold">{waMonitor.stats?.disconnected ?? 0}</p></div></CardContent></Card>
                  </motion.div>
                )}
                <motion.div variants={fadeUp}>
                  <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <TableHead cols={[t("admin.col.classChair"), t("admin.col.email"), t("admin.col.campus"), t("admin.col.waStatus"), t("admin.col.waGroup"), t("admin.col.lastUpdate")]} />
                        <tbody className="divide-y divide-border/40">
                          {!waMonitor?.sessions?.length && <EmptyRow cols={6} label={t("admin.wa.empty")} />}
                          {waMonitor?.sessions?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 font-medium text-sm">{s.user?.name ?? "—"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{s.user?.email ?? "—"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{s.user?.university ?? "—"}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={`text-[10px] ${s.status === "connected" ? "bg-green-500/10 text-green-600 border-green-500/30" : s.status === "connecting" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{s.groupName ?? "—"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(s.updatedAt), "dd MMM HH:mm", { locale: idLocale })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ══ TIM PROYEK ═══════════════════════════════════════ */}
            {activeNav === "team" && (
              <motion.div key="team" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp}>
                  <h2 className="font-semibold">Tim Proyek</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload foto anggota tim untuk ditampilkan di landing page.</p>
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { idx: 1, name: "Andra Rafi Irgi", nim: "231011450403", photo: teamPhotos.photo1 },
                    { idx: 2, name: "Mawar Iskandar", nim: "231011450351", photo: teamPhotos.photo2 },
                    { idx: 3, name: "Muhammad Haeckal Fadhilah", nim: "231011450540", photo: teamPhotos.photo3 },
                  ].map((member) => (
                    <motion.div key={member.idx} variants={fadeUp}>
                      <Card className="border-border/60">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                          <div className="relative mb-4">
                            <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-border bg-muted">
                              {member.photo ? (
                                <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Users className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-semibold">{member.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.nim}</p>
                          <label className="mt-4 cursor-pointer">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleTeamPhotoUpload(member.idx, file);
                              }}
                            />
                            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-medium hover:bg-accent transition-colors">
                              {uploadingMember === member.idx ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                              ) : (
                                <>{member.photo ? "Ganti foto" : "Upload foto"}</>
                              )}
                            </span>
                          </label>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ PENGATURAN SISTEM ══════════════════════════════════ */}
            {activeNav === "settings" && (
              <motion.div key="settings" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{t("admin.settings.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("admin.settings.desc")}</p>
                  </div>
                  <Button size="sm" className="gap-2 h-9" onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("action.save")}
                  </Button>
                </motion.div>
                {sysSettings && (
                  <motion.div variants={fadeUp} className="space-y-4">
                    <Card className="border-border/60">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">{t("admin.settings.general")}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1.5"><Label className="text-xs">{t("admin.settings.appName")}</Label><Input value={sysSettings.appName ?? ""} onChange={e => setSysSettings({...sysSettings, appName: e.target.value})} /></div>
                        <div className="space-y-1.5"><Label className="text-xs">{t("admin.settings.waAdmin")}</Label><Input placeholder={t("admin.settings.waPlaceholder")} value={sysSettings.adminWhatsapp ?? ""} onChange={e => setSysSettings({...sysSettings, adminWhatsapp: e.target.value})} /><p className="text-[10px] text-muted-foreground">{t("admin.settings.waHelp")}</p></div>
                        <div className="space-y-1.5"><Label className="text-xs">{t("admin.settings.maxFileUpload")}</Label><Input type="number" value={sysSettings.maxFileUploadMb ?? 10} onChange={e => setSysSettings({...sysSettings, maxFileUploadMb: parseInt(e.target.value)})} /></div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">{t("admin.settings.maintenance")}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t("admin.settings.enableMaintenance")}</p>
                            <p className="text-xs text-muted-foreground">{t("admin.settings.maintenanceDesc")}</p>
                          </div>
                          <button onClick={() => setSysSettings({...sysSettings, maintenanceMode: !sysSettings.maintenanceMode})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sysSettings.maintenanceMode ? "bg-destructive" : "bg-muted"}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sysSettings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                        {sysSettings.maintenanceMode && (
                          <div className="space-y-1.5"><Label className="text-xs">{t("admin.settings.maintenanceMsg")}</Label><Textarea placeholder={t("admin.settings.maintenancePlaceholder")} value={sysSettings.maintenanceMsg ?? ""} onChange={e => setSysSettings({...sysSettings, maintenanceMsg: e.target.value})} className="min-h-[80px] text-sm" /></div>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border-border/60">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">{t("admin.settings.ai")}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-1.5"><Label className="text-xs">{t("admin.settings.aiKey")}</Label><Input type="password" placeholder={t("admin.settings.aiKeyPlaceholder")} value={sysSettings.groqApiKey ?? ""} onChange={e => setSysSettings({...sysSettings, groqApiKey: e.target.value})} /></div>
                        <p className="text-[10px] text-muted-foreground mt-2">{t("admin.settings.aiKeyHelp")}</p>
                      </CardContent>
                    </Card>

                    {/* ── HARGA LANGGANAN ── */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" /> {t("admin.settings.pricing")}
                        </CardTitle>
                        <CardDescription className="text-xs">{t("admin.settings.pricingDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{t("admin.settings.showPricing")}</p>
                            <p className="text-xs text-muted-foreground">{t("admin.settings.showPricingDesc")}</p>
                          </div>
                          <button
                            onClick={() => setSysSettings({...sysSettings, pricingEnabled: !sysSettings.pricingEnabled})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sysSettings.pricingEnabled ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sysSettings.pricingEnabled ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{t("admin.settings.priceMonthly")}</Label>
                            <Input
                              type="number"
                              value={sysSettings.priceMonthly ?? 29000}
                              onChange={e => setSysSettings({...sysSettings, priceMonthly: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{t("admin.settings.priceHalfYear")}</Label>
                            <Input
                              type="number"
                              value={sysSettings.priceHalfYear ?? 149000}
                              onChange={e => setSysSettings({...sysSettings, priceHalfYear: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{t("admin.settings.priceYearly")}</Label>
                            <Input
                              type="number"
                              value={sysSettings.priceYearly ?? 269000}
                              onChange={e => setSysSettings({...sysSettings, priceYearly: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground mb-1">{t("admin.settings.pricePreview")}</p>
                          <p>· {t("admin.settings.previewMonthly")}: <span className="font-medium text-foreground">Rp {(sysSettings.priceMonthly ?? 29000).toLocaleString("id-ID")}/bln</span></p>
                          <p>· {t("admin.settings.previewHalfYear")}: <span className="font-medium text-foreground">Rp {Math.round((sysSettings.priceHalfYear ?? 149000) / 6).toLocaleString("id-ID")}/bln</span> <span className="text-green-600">({t("admin.settings.savePct", { pct: Math.round(100 - ((sysSettings.priceHalfYear ?? 149000) / 6 / (sysSettings.priceMonthly ?? 29000)) * 100) })})</span></p>
                          <p>· {t("admin.settings.previewYearly")}: <span className="font-medium text-foreground">Rp {Math.round((sysSettings.priceYearly ?? 269000) / 12).toLocaleString("id-ID")}/bln</span> <span className="text-green-600">({t("admin.settings.savePct", { pct: Math.round(100 - ((sysSettings.priceYearly ?? 269000) / 12 / (sysSettings.priceMonthly ?? 29000)) * 100) })})</span></p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ── PAKASIR PAYMENT GATEWAY ── */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Send className="h-4 w-4 text-emerald-500" /> {t("admin.settings.payment")}
                        </CardTitle>
                        <CardDescription className="text-xs">{t("admin.settings.paymentDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t("admin.settings.enablePayment")}</p>
                            <p className="text-xs text-muted-foreground">{t("admin.settings.enablePaymentDesc")}</p>
                          </div>
                          <button
                            onClick={() => setSysSettings({...sysSettings, pakasirEnabled: !sysSettings.pakasirEnabled})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sysSettings.pakasirEnabled ? "bg-emerald-500" : "bg-muted"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sysSettings.pakasirEnabled ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t("admin.settings.sandbox")}</p>
                            <p className="text-xs text-muted-foreground">{t("admin.settings.sandboxDesc")}</p>
                          </div>
                          <button
                            onClick={() => setSysSettings({...sysSettings, pakasirSandbox: !sysSettings.pakasirSandbox})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sysSettings.pakasirSandbox ? "bg-yellow-500" : "bg-muted"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sysSettings.pakasirSandbox ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                        {sysSettings.pakasirSandbox && (
                          <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-600 font-medium">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {t("admin.settings.sandboxActive")}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="space-y-1.5">
                             <Label className="text-xs font-semibold">{t("admin.settings.pakasirSlug")}</Label>
                             <Input
                               type="text"
                               placeholder={t("admin.settings.slugPlaceholder")}
                               value={sysSettings.pakasirSlug ?? ""}
                               onChange={e => setSysSettings({...sysSettings, pakasirSlug: e.target.value})}
                             />
                             <p className="text-[10px] text-muted-foreground">{t("admin.settings.slugHelp")}</p>
                           </div>
                           <div className="space-y-1.5">
                             <Label className="text-xs font-semibold">{t("admin.settings.pakasirApiKey")}</Label>
                             <Input
                               type="password"
                               placeholder={t("admin.settings.apiKeyPlaceholder")}
                               value={sysSettings.pakasirApiKey ?? ""}
                               onChange={e => setSysSettings({...sysSettings, pakasirApiKey: e.target.value})}
                             />
                             <p className="text-[10px] text-muted-foreground">{t("admin.settings.apiKeyHelp")}</p>
                           </div>
                         </div>
                        <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
                           <p className="font-semibold text-foreground mb-1">{t("admin.settings.callbackUrl")}</p>
                           <code className="block bg-background border border-border rounded px-2 py-1.5 text-[11px] font-mono break-all select-all">
                             {process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/api/payment/callback
                           </code>
                         </div>
                         {/* Tombol simpan khusus card Pakasir */}
                          <div className="flex justify-end pt-1">
                            <Button size="sm" className="gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveSettings} disabled={savingSettings}>
                              {savingLoadingSpinner(savingSettings)}
                              {t("admin.settings.savePakasir")}
                            </Button>
                          </div>
                      </CardContent>
                    </Card>

                    {/* ── GOOGLE DRIVE / CLOUD STORAGE ── */}
                    <Card className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-primary" /> {t("admin.settings.drive")}
                        </CardTitle>
                        <CardDescription className="text-xs">{t("admin.settings.driveDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{t("admin.settings.googleClientId")}</Label>
                            <Input
                              type="text"
                              placeholder={t("admin.settings.clientIdPlaceholder")}
                              value={sysSettings.googleClientId ?? ""}
                              onChange={e => setSysSettings({...sysSettings, googleClientId: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{t("admin.settings.googleClientSecret")}</Label>
                            <Input
                              type="password"
                              placeholder={t("admin.settings.clientSecretPlaceholder")}
                              value={sysSettings.googleClientSecret ?? ""}
                              onChange={e => setSysSettings({...sysSettings, googleClientSecret: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">{t("admin.settings.driveTokenSecret")}</Label>
                          <Input
                            type="password"
                            placeholder={t("admin.settings.tokenSecretPlaceholder")}
                            value={sysSettings.driveTokenSecret ?? ""}
                            onChange={e => setSysSettings({...sysSettings, driveTokenSecret: e.target.value})}
                          />
                          <p className="text-[10px] text-muted-foreground">{t("admin.settings.tokenSecretHelp")}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground mb-1">{t("admin.settings.redirectUri")}</p>
                          <code className="block bg-background border border-border rounded px-2 py-1.5 text-[11px] font-mono break-all select-all">
                            {(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/api/cloud/google/callback
                          </code>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                 )}
               </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ══ Edit User Dialog ═══════════════════════════════════════ */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> {editUser?.isSuspended ? t("admin.user.suspendedTitle") : t("admin.user.editTitle")}
             </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.name")}</Label>
                <Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.email")}</Label>
                <Input value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.role")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="ketua_kelas">{t("admin.role.ketuaKelas")}</option>
                  <option value="admin">{t("admin.role.admin")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.className")}</Label>
                <Input placeholder={t("admin.user.classPlaceholder")} value={userForm.className} onChange={e => setUserForm({ ...userForm, className: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.user.university")}</Label>
              <Input placeholder={t("admin.user.univPlaceholder")} value={userForm.university} onChange={e => setUserForm({ ...userForm, university: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.user.accountStatus")}</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="suspendCheckbox" checked={userForm.isSuspended} onCheckedChange={(c) => setUserForm({...userForm, isSuspended: !!c})} />
                <label htmlFor="suspendCheckbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("admin.user.suspendLabel")}
                </label>
              </div>
               <p className="text-[10px] text-muted-foreground">{t("admin.user.suspendHelp")}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.user.resetPw")}</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder={t("admin.user.pwPlaceholder")} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditUser(null)}>{t("action.cancel")}</Button>
            <Button size="sm" onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Create User Dialog ════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={open => !open && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> {t("admin.user.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.fullName")}</Label>
                <Input placeholder={t("admin.user.namePlaceholder")} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.emailReq")}</Label>
                <Input type="email" placeholder={t("admin.user.emailPlaceholder")} value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.user.passwordReq")}</Label>
              <div className="relative">
                <Input type={showCreatePw ? "text" : "password"} placeholder={t("admin.user.pwCreatePlaceholder")} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCreatePw(!showCreatePw)}>
                  {showCreatePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.role")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="ketua_kelas">{t("admin.role.ketuaKelas")}</option>
                  <option value="admin">{t("admin.role.admin")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.user.className")}</Label>
                <Input placeholder={t("admin.user.classPlaceholder")} value={createForm.className} onChange={e => setCreateForm({ ...createForm, className: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.user.university")}</Label>
              <Input placeholder={t("admin.user.univPlaceholder2")} value={createForm.university} onChange={e => setCreateForm({ ...createForm, university: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>{t("action.cancel")}</Button>
            <Button size="sm" onClick={handleCreateUser} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {t("action.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Create Broadcast Dialog ═══════════════════════════════ */}
      <Dialog open={broadcastOpen} onOpenChange={open => !open && setBroadcastOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
               <Megaphone className="h-4 w-4" /> {t("admin.broadcast.title")}
             </DialogTitle>
             <DialogDescription className="text-xs pt-1">
               {t("admin.broadcast.desc")}
             </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
             <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.broadcast.messageTitle")}</Label>
                <Input placeholder={t("admin.broadcast.titlePlaceholder")} value={broadcastForm.title} onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} />
             </div>
             <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.broadcast.content")}</Label>
                <Textarea placeholder={t("admin.broadcast.contentPlaceholder")} value={broadcastForm.content} onChange={e => setBroadcastForm({ ...broadcastForm, content: e.target.value })} className="min-h-[100px] text-sm leading-relaxed" />
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(false)}>{t("action.cancel")}</Button>
             <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendBroadcast} disabled={sendingBroadcast}>
                {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                {t("admin.broadcast.send")}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Create Voucher Dialog ═══════════════════════════════ */}
      <Dialog open={createVoucherOpen} onOpenChange={open => !open && setCreateVoucherOpen(false)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Ticket className="h-4 w-4" /> {t("admin.voucher.createTitle")}
             </DialogTitle>
             <DialogDescription className="text-xs pt-1">
               {t("admin.voucher.createDesc")}
             </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.code")}</Label>
                  <Input placeholder={t("admin.voucher.codePlaceholder")} className="uppercase" value={voucherForm.code} onChange={e => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })} />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.targetPlan")}</Label>
                  <select
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                     value={voucherForm.applicablePlan}
                     onChange={e => setVoucherForm({ ...voucherForm, applicablePlan: e.target.value })}
                  >
                     <option value="">{t("admin.allPlans")}</option>
                     <option value="monthly">{t("admin.plan.monthly")}</option>
                     <option value="halfyear">{t("admin.plan.halfyear")}</option>
                     <option value="yearly">{t("admin.plan.yearly")}</option>
                  </select>
               </div>
             </div>

             <div className="space-y-1.5">
                <Label className="text-xs">{t("admin.voucher.internalDesc")}</Label>
                 <Input placeholder={t("admin.voucher.descPlaceholder")} value={voucherForm.description} onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })} />
             </div>

             <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
               <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.discountType")}</Label>
                  <select
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                     value={voucherForm.discountType}
                     onChange={e => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
                  >
                     <option value="percent">{t("admin.voucher.typePercent")}</option>
                     <option value="fixed">{t("admin.voucher.typeFixed")}</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.discountValue")}</Label>
                   <Input type="number" placeholder={voucherForm.discountType === "percent" ? t("admin.voucher.valuePlaceholderPercent") : t("admin.voucher.valuePlaceholderFixed")} value={voucherForm.discountValue || ""} onChange={e => setVoucherForm({ ...voucherForm, discountValue: parseInt(e.target.value) || 0 })} />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.usageLimit")}</Label>
                  <Input type="number" placeholder={t("admin.voucher.usagePlaceholder")} value={voucherForm.maxUses} onChange={e => setVoucherForm({ ...voucherForm, maxUses: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground mt-6 text-[10px]">
                     {t("admin.voucher.usageHelp")}
                  </Label>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.validFrom")}</Label>
                  <Input type="datetime-local" className="text-xs" value={voucherForm.validFrom} onChange={e => setVoucherForm({ ...voucherForm, validFrom: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.voucher.validUntil")}</Label>
                  <Input type="datetime-local" className="text-xs" value={voucherForm.validUntil} onChange={e => setVoucherForm({ ...voucherForm, validUntil: e.target.value })} />
                </div>
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" size="sm" onClick={() => setCreateVoucherOpen(false)}>{t("action.cancel")}</Button>
             <Button size="sm" onClick={handleCreateVoucher} disabled={creatingVoucher}>
                {creatingVoucher ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {t("admin.voucher.savePromo")}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function savingLoadingSpinner(saving: boolean) {
  return saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />;
}
