"use client";

import { useI18n } from "@/lib/i18n";
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
    university: string | null;
  } | null;
  settings: {
    theme: string;
    reminderDefault: string;
    aiModel: string;
    language: string;
  } | null;
}

import { container, item } from "@/lib/animations";

export default function SettingsPage() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "", className: "", semester: "", university: "" });
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
            university: d.user.university || "",
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
    }     catch { toast.error(t("settings.fetchError")); }
    finally { setIsLoading(false); }
  }, [setTheme]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) { toast.error(t("settings.nameRequired")); return; }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          className: profile.className,
          semester: profile.semester ? parseInt(profile.semester) : null,
          university: profile.university,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("settings.profileUpdated"));
    }     catch (err) { toast.error(err instanceof Error ? err.message : t("settings.saveFailed")); }
    finally { setIsSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!password.oldPassword || !password.newPassword) { toast.error(t("settings.passwordRequired")); return; }
    if (password.newPassword.length < 6) { toast.error(t("settings.passwordMin")); return; }
    if (password.newPassword !== password.confirmPassword) { toast.error(t("settings.passwordMismatch")); return; }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: password.oldPassword, newPassword: password.newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("settings.passwordChanged"));
      setPassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }     catch (err) { toast.error(err instanceof Error ? err.message : t("settings.passwordChangeFailed")); }
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
      toast.success(t("settings.saved"));
    }     catch (err) { toast.error(err instanceof Error ? err.message : t("settings.saveFailed")); }
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
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.settings")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />{t("settings.profile")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.name")}</Label>
                  <Input placeholder={t("settings.namePlaceholder")} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.email")}</Label>
                  <Input type="email" value={profile.email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t("settings.university")}</Label>
                  <Input placeholder={t("settings.universityPlaceholder")} value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.class")}</Label>
                  <Input placeholder={t("settings.classPlaceholder")} value={profile.className} onChange={(e) => setProfile({ ...profile, className: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.semester")}</Label>
                  <Input type="number" placeholder={t("settings.semesterPlaceholder")} value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} />
                </div>
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("action.save")}
              </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div variants={item}>
        <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />{t("settings.changePassword")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.oldPassword")}</Label>
                <div className="relative">
                  <Input
                    type={showOldPw ? "text" : "password"}
                    value={password.oldPassword}
                    onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
                    placeholder={t("settings.oldPasswordPlaceholder")}
                  />
                  <Button variant="ghost" size="icon-sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowOldPw(!showOldPw)}>
                    {showOldPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.newPassword")}</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={password.newPassword}
                    onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                    placeholder={t("settings.newPasswordPlaceholder")}
                  />
                  <Button variant="ghost" size="icon-sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.confirmPassword")}</Label>
                <Input
                  type="password"
                  value={password.confirmPassword}
                  onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                  placeholder={t("settings.confirmPasswordPlaceholder")}
                />
              </div>
              <Button size="sm" onClick={handleChangePassword} disabled={isSavingPassword}>
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {t("settings.changePassword")}
              </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div variants={item}>
        <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />{t("nav.theme")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(["dark", "light", "system"] as const).map((tm) => (
                  <button
                    key={tm}
                    onClick={() => setTheme(tm)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      theme === tm ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {theme === tm && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {tm === "dark" ? t("settings.themeDark") : tm === "light" ? t("settings.themeLight") : t("settings.themeSystem")}
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
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />{t("settings.reminderDefault")}</CardTitle></CardHeader>
            <CardContent>
              <select
                value={settings.reminderDefault}
                onChange={(e) => setSettings({ ...settings, reminderDefault: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="H-7">{t("settings.reminderH7")}</option>
                <option value="H-3">{t("settings.reminderH3")}</option>
                <option value="H-1">{t("settings.reminderH1")}</option>
                <option value="H-0">{t("settings.reminderH0")}</option>
              </select>
            </CardContent>
        </Card>
      </motion.div>

      {/* Save All Settings */}
      <motion.div variants={item}>
        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
          {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("settings.saveAll")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
