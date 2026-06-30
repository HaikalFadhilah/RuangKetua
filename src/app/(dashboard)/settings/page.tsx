"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Lock, Palette, Bell, Bot, Save, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

interface UserSettings {
  user: {
    id: string;
    name: string;
    email: string;
    className: string | null;
    semester: number | null;
    avatar: string | null;
  } | null;
  settings: {
    theme: string;
    reminderDefault: string;
    aiModel: string;
    language: string;
  } | null;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "", className: "", semester: "" });
  const [password, setPassword] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [settings, setSettings] = useState({ reminderDefault: "H-3", aiModel: "llama-3.3-70b-versatile", language: "id" });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        const d = data.data as UserSettings;
        if (d.user) {
          setProfile({
            name: d.user.name || "",
            email: d.user.email || "",
            className: d.user.className || "",
            semester: d.user.semester?.toString() || "",
          });
        }
        if (d.settings) {
          setSettings({
            reminderDefault: d.settings.reminderDefault || "H-3",
            aiModel: d.settings.aiModel || "llama-3.3-70b-versatile",
            language: d.settings.language || "id",
          });
          if (d.settings.theme) setTheme(d.settings.theme);
        }
      }
    } catch { toast.error("Gagal mengambil settings"); }
    finally { setIsLoading(false); }
  }, [setTheme]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) { toast.error("Nama wajib diisi"); return; }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          className: profile.className,
          semester: profile.semester ? parseInt(profile.semester) : null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Profil berhasil diupdate");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyimpan"); }
    finally { setIsSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!password.oldPassword || !password.newPassword) { toast.error("Password wajib diisi"); return; }
    if (password.newPassword.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    if (password.newPassword !== password.confirmPassword) { toast.error("Konfirmasi password tidak cocok"); return; }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: password.oldPassword, newPassword: password.newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Password berhasil diubah");
      setPassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal mengubah password"); }
    finally { setIsSavingPassword(false); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          reminderDefault: settings.reminderDefault,
          aiModel: settings.aiModel,
          language: settings.language,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Settings berhasil disimpan");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyimpan"); }
    finally { setIsSavingSettings(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola pengaturan akun dan aplikasi</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input placeholder="Nama lengkap" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={profile.email} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Input placeholder="TI-3A" value={profile.className} onChange={(e) => setProfile({ ...profile, className: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input type="number" placeholder="5" value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} />
              </div>
            </div>
            <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />Ubah Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password Lama</Label>
              <div className="relative">
                <Input
                  type={showOldPw ? "text" : "password"}
                  value={password.oldPassword}
                  onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
                  placeholder="Masukkan password lama"
                />
                <Button variant="ghost" size="icon-sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowOldPw(!showOldPw)}>
                  {showOldPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={password.newPassword}
                  onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                  placeholder="Masukkan password baru (min 6 karakter)"
                />
                <Button variant="ghost" size="icon-sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <Input
                type="password"
                value={password.confirmPassword}
                onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
              />
            </div>
            <Button size="sm" onClick={handleChangePassword} disabled={isSavingPassword}>
              {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Ubah Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Tema</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["dark", "light", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {theme === t && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {t === "dark" ? "🌙 Dark" : t === "light" ? "☀️ Light" : "💻 System"}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reminder */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Reminder Default</CardTitle></CardHeader>
          <CardContent>
            <select
              value={settings.reminderDefault}
              onChange={(e) => setSettings({ ...settings, reminderDefault: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="H-7">H-7 (7 hari sebelum)</option>
              <option value="H-3">H-3 (3 hari sebelum)</option>
              <option value="H-1">H-1 (1 hari sebelum)</option>
              <option value="H-0">Hari H</option>
            </select>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" />AI Settings (Groq)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Paling Pintar)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Paling Cepat)</option>
                <option value="gemma2-9b-it">Gemma 2 9B (Google, Ringan)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (Context Panjang)</option>
              </select>
            </div>
            <div className="p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground space-y-1.5">
              <p>🔑 API Key dikonfigurasi via environment variable <code className="text-primary">GROQ_API_KEY</code></p>
              <p>🆓 Ambil API key gratis di: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.groq.com/keys</a></p>
              <p>⚡ Groq = Inference super cepat, gratis, tanpa region block</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save All Settings */}
      <motion.div variants={item}>
        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
          {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Semua Settings
        </Button>
      </motion.div>
    </motion.div>
  );
}
