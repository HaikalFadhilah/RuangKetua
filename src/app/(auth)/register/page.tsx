"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { useI18n } from "@/lib/i18n";
import {
  User, Mail, Lock, GraduationCap, BookOpen, ArrowRight,
  Loader2, Building2, Search, X, ChevronDown, CheckCircle2,
} from "lucide-react";

type University = { id: string; name: string; shortName: string | null; city: string | null };

// ── Searchable University Dropdown ───────────────────────────────────────────
function UniversityDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen]               = useState(false);
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<University[]>([]);
  const [loading, setLoading]         = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  // Fetch results whenever query changes
  const fetchUniversities = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/universities?search=${encodeURIComponent(q)}&limit=20`
      );
      const data = await res.json();
      setResults(data.success ? data.data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchUniversities(query), 250);
    return () => clearTimeout(t);
  }, [query, open, fetchUniversities]);

  // Initial load when dropdown opens
  useEffect(() => {
    if (open) {
      fetchUniversities(query);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (uni: University) => {
    onChange(uni.name);
    setOpen(false);
    setQuery("");
    setHighlighted(-1);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0 && results[highlighted]) {
      e.preventDefault();
      select(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div ref={wrapRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          flex h-10 w-full items-center gap-2 rounded-md border px-3 py-2 text-sm
          bg-background text-left ring-offset-background transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${open
            ? "border-ring ring-2 ring-ring ring-offset-background"
            : "border-input hover:border-ring/50"
          }
        `}
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={`flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || t("auth.register.universityPlaceholder")}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={e => e.key === "Enter" && clear(e as any)}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t("auth.register.typeCampus")}
                value={query}
                onChange={e => { setQuery(e.target.value); setHighlighted(-1); }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
            </div>

            {/* Results list */}
            <ul
              ref={listRef}
              className="max-h-52 overflow-y-auto py-1"
            >
              {!loading && results.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {query ? t("auth.register.noUniversityMatch") : t("auth.register.startTyping")}
                </li>
              )}
              {results.map((uni, i) => {
                const isSelected = uni.name === value;
                const isHover    = i === highlighted;
                return (
                  <li
                    key={uni.id}
                    onMouseDown={() => select(uni)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`
                      flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer text-sm transition-colors
                      ${isHover ? "bg-accent text-accent-foreground" : ""}
                      ${isSelected && !isHover ? "bg-primary/5 text-primary" : ""}
                    `}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{uni.name}</p>
                      {(uni.shortName || uni.city) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[uni.shortName, uni.city].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    className: "",
    semester: "",
    university: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || t("auth.register.failed"));
        return;
      }

      toast.success(t("auth.register.success"));
      router.push("/login");
    } catch {
      toast.error(t("auth.register.error"));
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
          <CardTitle className="text-2xl font-bold">{t("auth.register.title")}</CardTitle>
          <CardDescription>
            {t("auth.register.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.register.fullName")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder={t("auth.register.fullNamePlaceholder")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

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
                  placeholder={t("auth.register.passwordPlaceholder")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* ── Searchable University Dropdown ── */}
            <div className="space-y-2">
              <Label>{t("auth.register.university")}</Label>
              <UniversityDropdown
                value={form.university}
                onChange={(val) => setForm({ ...form, university: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="className">{t("auth.register.className")}</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="className"
                    placeholder={t("auth.register.classNamePlaceholder")}
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">{t("auth.register.semester")}</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="semester"
                    placeholder={t("auth.register.semesterPlaceholder")}
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("auth.register.submit")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.register.haveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("auth.login.submit")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
