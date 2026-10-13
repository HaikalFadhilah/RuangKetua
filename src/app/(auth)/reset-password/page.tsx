"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { useI18n } from "@/lib/i18n";
import { Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.token.trim() || !form.newPassword) {
      toast.error(t("resetPw.allFieldsRequired"));
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error(t("resetPw.passwordMin"));
      return;
    }
    if (!/[a-zA-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      toast.error(t("resetPw.passwordMin"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error(t("resetPw.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          token: form.token.trim(),
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || t("resetPw.error"));
        return;
      }
      setSuccess(true);
      toast.success(t("resetPw.success"));
    } catch {
      toast.error(t("resetPw.error"));
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
          <CardTitle className="text-2xl font-bold">{t("resetPw.title")}</CardTitle>
          <CardDescription>
            {success ? t("resetPw.successDesc") : t("resetPw.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{t("resetPw.successInfo")}</p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                {t("resetPw.goToLogin")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("resetPw.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("resetPw.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">{t("resetPw.token")}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="token"
                    type="text"
                    placeholder={t("resetPw.tokenPlaceholder")}
                    value={form.token}
                    onChange={(e) => setForm({ ...form, token: e.target.value })}
                    className="pl-10 text-center font-mono tracking-[0.2em] text-lg"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("resetPw.newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPw ? "text" : "password"}
                    placeholder={t("resetPw.newPasswordPlaceholder")}
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("resetPw.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("resetPw.confirmPasswordPlaceholder")}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t("resetPw.submit")}
                    <Lock className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("resetPw.backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
