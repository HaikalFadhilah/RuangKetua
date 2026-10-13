"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { useI18n } from "@/lib/i18n";
import { Mail, ArrowRight, Loader2, ArrowLeft, Copy, CheckCircle2, Inbox } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      toast.error(t("forgotPw.emailRequired"));
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || t("forgotPw.error"));
        return;
      }
      setSent(true);
      if (data.data?._devToken) {
        setDevToken(data.data._devToken);
      }
      toast.success(t("forgotPw.sent"));
    } catch {
      toast.error(t("forgotPw.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (devToken) {
      await navigator.clipboard.writeText(devToken);
      setCopied(true);
      toast.success(t("forgotPw.tokenCopied"));
      setTimeout(() => setCopied(false), 2000);
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
          <CardTitle className="text-2xl font-bold">{t("forgotPw.title")}</CardTitle>
          <CardDescription>
            {sent ? t("forgotPw.sentDesc") : t("forgotPw.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("forgotPw.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("forgotPw.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    {t("forgotPw.submit")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {!devToken ? (
                <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-center gap-3">
                  <Inbox className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("forgotPw.sentDesc")}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">{t("forgotPw.devTokenLabel")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-2xl font-mono font-bold tracking-[0.3em] text-center bg-background p-3 rounded-lg border">
                      {devToken}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopyToken}>
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("forgotPw.devTokenHint")}</p>
                </div>
              )}
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                <Button className="w-full">
                  {t("forgotPw.goToReset")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("forgotPw.backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
