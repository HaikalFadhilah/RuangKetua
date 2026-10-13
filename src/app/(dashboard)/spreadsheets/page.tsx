"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  ExternalLink,
  Loader2,
  Sheet,
  Users,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Wallet,
  BookOpen,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SpreadsheetFile {
  id: string;
  name: string;
  webViewLink: string | null;
  createdAt: string;
  mimeType: string;
}

const TEMPLATES = [
  {
    value: "UANG_KAS",
    label: "Uang Kas / Iuran",
    desc: "Lacak tagihan dan status pembayaran setiap anggota kelas secara otomatis.",
    icon: Wallet,
    color: "text-foreground bg-card border-border hover:border-primary/40 hover:bg-primary/5",
    activeColor: "border-primary ring-1 ring-primary/30 bg-primary/5 text-primary",
  },
  {
    value: "TUGAS",
    label: "Rekap Tugas",
    desc: "Pantau status pengumpulan tugas dan nilai setiap mahasiswa.",
    icon: BookOpen,
    color: "text-foreground bg-card border-border hover:border-primary/40 hover:bg-primary/5",
    activeColor: "border-primary ring-1 ring-primary/30 bg-primary/5 text-primary",
  },
  {
    value: "KELOMPOK",
    label: "Daftar Kelompok",
    desc: "Atur pembagian kelompok beserta topik dan daftar anggotanya.",
    icon: Users,
    color: "text-foreground bg-card border-border hover:border-primary/40 hover:bg-primary/5",
    activeColor: "border-primary ring-1 ring-primary/30 bg-primary/5 text-primary",
  },
  {
    value: "KOSONG",
    label: "Spreadsheet Kosong",
    desc: "Mulai dari lembar kosong dan sesuaikan sendiri sesuai kebutuhan.",
    icon: LayoutGrid,
    color: "text-foreground bg-card border-border hover:border-primary/40 hover:bg-primary/5",
    activeColor: "border-primary ring-1 ring-primary/30 bg-primary/5 text-primary",
  },
];

import { container, item } from "@/lib/animations";

const stepVariant = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

// ── per-template detail fields ──────────────────────────────────────────────
interface TemplateConfig {
  iuranPerOrang?: number;
  namaTagihan?: string;
  namaTugas?: string;
  mataKuliah?: string;
  jumlahKelompok?: number;
  anggotaPerKelompok?: number;
}

function DetailFields({
  type,
  config,
  onChange,
}: {
  type: string;
  config: TemplateConfig;
  onChange: (c: TemplateConfig) => void;
}) {
  const field = (label: string, hint: string, node: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {node}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  if (type === "UANG_KAS") return (
    <div className="space-y-4">
      {field(
        "Nama Tagihan",
        "Contoh: Uang Kas Bulanan, Iuran Study Tour, dst.",
        <Input
          placeholder="cth: Iuran Kegiatan KKL Semester Ini"
          value={config.namaTagihan ?? ""}
          onChange={e => onChange({ ...config, namaTagihan: e.target.value })}
        />
      )}
      {field(
        "Nominal Iuran per Orang (Rp)",
        "Masukkan angka tanpa titik atau koma. Nilai ini bisa diubah langsung di spreadsheet.",
        <Input
          type="number"
          min={0}
          placeholder="cth: 50000"
          value={config.iuranPerOrang ?? ""}
          onChange={e => onChange({ ...config, iuranPerOrang: Number(e.target.value) })}
        />
      )}
    </div>
  );

  if (type === "TUGAS") return (
    <div className="space-y-4">
      {field(
        "Nama Tugas / Asesmen",
        "Judul tugas yang akan dijadikan header sheet.",
        <Input
          placeholder="cth: Laporan Praktikum Pertemuan 3"
          value={config.namaTugas ?? ""}
          onChange={e => onChange({ ...config, namaTugas: e.target.value })}
        />
      )}
      {field(
        "Mata Kuliah (Opsional)",
        "Akan dicantumkan sebagai keterangan di baris pertama.",
        <Input
          placeholder="cth: Algoritma dan Pemrograman"
          value={config.mataKuliah ?? ""}
          onChange={e => onChange({ ...config, mataKuliah: e.target.value })}
        />
      )}
    </div>
  );

  if (type === "KELOMPOK") return (
    <div className="space-y-4">
      {field(
        "Jumlah Kelompok",
        "Berapa banyak kelompok yang akan dibentuk dalam kelas.",
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...config, jumlahKelompok: Math.max(1, (config.jumlahKelompok ?? 5) - 1) })}
            className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer font-bold text-lg"
          >−</button>
          <span className="w-10 text-center font-semibold text-lg">{config.jumlahKelompok ?? 5}</span>
          <button
            type="button"
            onClick={() => onChange({ ...config, jumlahKelompok: Math.min(30, (config.jumlahKelompok ?? 5) + 1) })}
            className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer font-bold text-lg"
          >+</button>
          <span className="text-sm text-muted-foreground">kelompok</span>
        </div>
      )}
      {field(
        "Maksimal Anggota per Kelompok",
        "Menentukan jumlah kolom anggota yang disediakan di setiap baris kelompok.",
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...config, anggotaPerKelompok: Math.max(2, (config.anggotaPerKelompok ?? 4) - 1) })}
            className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer font-bold text-lg"
          >−</button>
          <span className="w-10 text-center font-semibold text-lg">{config.anggotaPerKelompok ?? 4}</span>
          <button
            type="button"
            onClick={() => onChange({ ...config, anggotaPerKelompok: Math.min(10, (config.anggotaPerKelompok ?? 4) + 1) })}
            className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer font-bold text-lg"
          >+</button>
          <span className="text-sm text-muted-foreground">orang</span>
        </div>
      )}
      <div className="rounded-lg bg-muted/50 border px-3 py-2.5 text-xs text-muted-foreground">
        Spreadsheet akan memiliki <strong>{config.jumlahKelompok ?? 5} baris kelompok</strong> dengan masing-masing <strong>{config.anggotaPerKelompok ?? 4} kolom anggota</strong>.
      </div>
    </div>
  );

  // KOSONG
  return (
    <div className="rounded-lg bg-muted/50 border px-4 py-4 text-sm text-muted-foreground space-y-1">
      <p className="font-medium text-foreground">Spreadsheet akan dibuat tanpa data awal.</p>
      <p>Kamu bebas menambahkan kolom dan baris sesuai kebutuhan setelah dokumen terbuka.</p>
    </div>
  );
}

export default function SpreadsheetsPage() {
  const { t } = useI18n();
  const [sheets, setSheets] = useState<SpreadsheetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sheetType, setSheetType] = useState("UANG_KAS");
  const [sheetTitle, setSheetTitle] = useState("");
  const [config, setConfig] = useState<TemplateConfig>({ iuranPerOrang: 50000, jumlahKelompok: 5, anggotaPerKelompok: 4 });
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpreadsheetFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSheets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/drive/spreadsheets/list");
      const data = await res.json();
      if (data.success) setSheets(data.data ?? []);
    } catch {
      toast.error("Gagal memuat daftar spreadsheet");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const openDialog = (type?: string) => {
    setSheetType(type ?? "UANG_KAS");
    setSheetTitle("");
    setConfig({ iuranPerOrang: 50000, jumlahKelompok: 5, anggotaPerKelompok: 4 });
    setStep(type ? 2 : 1);
    setDialogOpen(true);
  };

  const selectedTemplate = TEMPLATES.find(t => t.value === sheetType)!;

  const suggestTitle = () => {
    const now = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    if (sheetType === "UANG_KAS") return config.namaTagihan ? `${config.namaTagihan} — ${now}` : `Rekap Iuran ${now}`;
    if (sheetType === "TUGAS") return config.namaTugas ? `Rekap Tugas: ${config.namaTugas}` : `Rekap Tugas ${now}`;
    if (sheetType === "KELOMPOK") return `Daftar Kelompok ${now}`;
    return `Spreadsheet Baru ${now}`;
  };

  const handleNext = () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setSheetTitle(suggestTitle()); setStep(3); return; }
  };

  const handleBack = () => {
    if (step === 3) { setStep(2); return; }
    if (step === 2) { setStep(1); return; }
  };

  const canNext = () => {
    if (step === 1) return !!sheetType;
    if (step === 2) {
      if (sheetType === "UANG_KAS") return !!(config.namaTagihan?.trim());
      if (sheetType === "TUGAS") return !!(config.namaTugas?.trim());
      return true;
    }
    return !!sheetTitle.trim();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setSheets(prev => prev.filter(s => s.id !== deleteTarget.id));
    try {
      const res = await fetch(`/api/drive/spreadsheets/list?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Spreadsheet berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus spreadsheet");
      fetchSheets();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleGenerate = async () => {
    if (!sheetTitle.trim()) return toast.error("Judul dokumen wajib diisi");
    setGenerating(true);
    try {
      const res = await fetch("/api/drive/spreadsheets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sheetTitle.trim(), templateType: sheetType, config }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Spreadsheet berhasil dibuat!");
      setDialogOpen(false);
      fetchSheets();
      if (data.data?.webViewLink) window.open(data.data.webViewLink, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat spreadsheet");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const TmplIcon = selectedTemplate?.icon ?? FileSpreadsheet;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("nav.spreadsheets")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Buat dan kelola spreadsheet kelas otomatis langsung ke Google Drive.
            </p>
          </div>
        </motion.div>

        {/* Template cards */}
        <motion.div variants={item}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Template Tersedia</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.value}
                  onClick={() => openDialog(tmpl.value)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                    tmpl.color
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">{tmpl.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{tmpl.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Spreadsheet list */}
        <motion.div variants={item} className="space-y-3">
          <div className="flex items-center gap-2">
            <Sheet className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Spreadsheet Saya</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : sheets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-muted-foreground">Belum ada spreadsheet</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                  Pilih salah satu template di atas untuk mulai membuat spreadsheet pertama kamu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sheets.map((sheet) => (
                <motion.div
                  key={sheet.id}
                  variants={item}
                  className="group flex items-center gap-4 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{sheet.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(sheet.createdAt)}</p>
                  </div>
                  {sheet.webViewLink && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0 text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(sheet.webViewLink!, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => setDeleteTarget(sheet)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Multi-step dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!generating) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Buat Spreadsheet Baru
            </DialogTitle>
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    s === step ? "w-6 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-3 bg-muted"
                  )}
                />
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">
                Langkah {step} dari 3
              </span>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 1 — Pilih template */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariant} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="space-y-3 py-2"
              >
                <p className="text-sm font-medium">Pilih jenis template yang ingin Anda buat:</p>
                <div className="space-y-2">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const active = sheetType === tmpl.value;
                    return (
                      <button
                        key={tmpl.value}
                        type="button"
                        onClick={() => setSheetType(tmpl.value)}
                        className={cn(
                          "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                          active
                            ? cn("ring-1", tmpl.activeColor)
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <div className={cn("mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", tmpl.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-semibold", active && "text-primary")}>{tmpl.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{tmpl.desc}</p>
                        </div>
                        {active && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Detail template */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariant} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="py-2 space-y-4"
              >
                <div className={cn("flex items-center gap-2.5 rounded-xl border px-4 py-3", selectedTemplate.color)}>
                  <TmplIcon className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{selectedTemplate.label}</p>
                    <p className="text-xs opacity-70">{selectedTemplate.desc}</p>
                  </div>
                </div>
                <DetailFields type={sheetType} config={config} onChange={setConfig} />
                <p className="text-xs text-muted-foreground">
                  Data nama anggota akan ditarik otomatis dari <strong>Buku Induk Kelas</strong>
                  {sheetType === "KOSONG" ? " — tidak berlaku untuk template ini." : "."}
                </p>
              </motion.div>
            )}

            {/* Step 3 — Judul & konfirmasi */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariant} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="py-2 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Judul Dokumen <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    autoFocus
                    placeholder="cth: Rekap Iuran Semester Ganjil 2025"
                    value={sheetTitle}
                    onChange={e => setSheetTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && canNext()) handleGenerate(); }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Judul ini akan menjadi nama file di Google Drive Anda.
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-xl border bg-muted/30 divide-y text-sm">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">Template</span>
                    <span className="font-medium">{selectedTemplate.label}</span>
                  </div>
                  {sheetType === "UANG_KAS" && config.namaTagihan && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Tagihan</span>
                      <span className="font-medium">{config.namaTagihan}</span>
                    </div>
                  )}
                  {sheetType === "UANG_KAS" && config.iuranPerOrang !== undefined && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Nominal</span>
                      <span className="font-medium">Rp {config.iuranPerOrang.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {sheetType === "TUGAS" && config.namaTugas && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Nama Tugas</span>
                      <span className="font-medium">{config.namaTugas}</span>
                    </div>
                  )}
                  {sheetType === "TUGAS" && config.mataKuliah && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Mata Kuliah</span>
                      <span className="font-medium">{config.mataKuliah}</span>
                    </div>
                  )}
                  {sheetType === "KELOMPOK" && (
                    <>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-muted-foreground">Jumlah Kelompok</span>
                        <span className="font-medium">{config.jumlahKelompok} kelompok</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-muted-foreground">Maks. Anggota</span>
                        <span className="font-medium">{config.anggotaPerKelompok} orang/kelompok</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-2 flex-row">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={generating} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 && (
              <Button onClick={handleNext} disabled={!canNext()} className="gap-1.5">
                Lanjut
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>Batal</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !sheetTitle.trim()}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                  {generating ? "Membuat..." : "Buat Spreadsheet"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={`Hapus "${deleteTarget?.name}"?`}
        description="Spreadsheet ini akan dihapus secara permanen dari Google Drive dan tidak dapat dikembalikan."
        confirmLabel="Hapus Spreadsheet"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
