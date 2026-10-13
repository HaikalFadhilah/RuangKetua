"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { useI18n } from "@/lib/i18n";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  KeyRound,
  Inbox,
  ExternalLink,
  ShieldAlert,
  Clock,
} from "lucide-react";

type Mode = "password" | "magic" | "magicSent";

const MAGIC_ERRORS: Record<string, string> = {
  invalid: "Link login tidak valid. Minta link baru.",
  expired: "Link login telah kedaluwarsa. Minta link baru.",
  suspended: "Akun Anda telah ditangguhkan.",
  limited: "Terlalu banyak percobaan. Coba lagi nanti.",
};

export default function LoginPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [devLink, setDevLink] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("magic");
    if (reason) {
      const message = MAGIC_ERRORS[reason];
      if (message) toast.error(message);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || t("auth.login.failed"));
        return;
      }

      toast.success(t("auth.login.success"));
      // Admin langsung diarahkan ke panel admin
      if (data.data?.role === "admin") {
        window.location.href = "/rk-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error(t("auth.login.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error(t("forgotPw.emailRequired"));
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || t("auth.login.magicError"));
        return;
      }

      if (data.data?._devLink) {
        setDevLink(data.data._devLink);
      }
      setMode("magicSent");
      toast.success(t("auth.login.magicSent"));
    } catch {
      toast.error(t("auth.login.magicError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 w-full max-w-md mx-4"
    >
      <Card className="border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <RuangKetuaLogo size={56} />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.login.title")}</CardTitle>
          <CardDescription>
            {mode === "magic"
              ? t("auth.login.magicDesc")
              : mode === "magicSent"
              ? t("auth.login.magicSentDesc")
              : t("auth.login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "magic" && (
            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">{t("auth.login.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="magic-email"
                    type="email"
                    autoFocus
                    placeholder={t("auth.login.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t("auth.login.magicSubmit")}
                    <KeyRound className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  {t("auth.login.magicSwitch")}
                </button>
              </div>
            </form>
          )}

          {mode === "magicSent" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Inbox className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{t("auth.login.magicSentDesc")}</p>
                    <p className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5" /> 10 menit · 1x pakai
                    </p>
                  </div>
                </div>

                {devLink && (
                  <div className="p-3 bg-background border border-border rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground">{t("auth.login.magicDevLabel")}</p>
                    <a
                      href={devLink}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {devLink}
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMode("password")}
                className="w-full text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                {t("auth.login.magicSwitch")}
              </button>
            </div>
          )}

          {mode === "password" && (
            <>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.login.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.login.emailPlaceholder")}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("auth.login.passwordPlaceholder")}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors">
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {t("auth.login.submit")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                {t("auth.login.or")}
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={() => setMode("magic")}>
                <KeyRound className="h-4 w-4" />
                {t("auth.login.magicLink")}
              </Button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t("auth.login.register")}
            </Link>
          </div>

          {mode === "password" && (
            <div className="mt-4 flex justify-center items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <ShieldAlert className="h-3 w-3" />
              Login dilindungi HTTPS + rate limiting
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}