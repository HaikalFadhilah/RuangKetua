"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScanText, Upload, Loader2, FileImage, CheckCircle2, ClipboardList, Copy, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface OcrResult {
  mataKuliah?: string;
  deadline?: string;
  deskripsi?: string;
  dosen?: string;
  rawText?: string;
}

import { container, item } from "@/lib/animations";

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { t } = useI18n();

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error(t("ocr.imageOnly")); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error(t("ocr.fileTooLarge")); return; }
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      // Convert file to base64 for the AI OCR endpoint
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
        toast.success(t("ocr.processed"));
      } else {
        // Fallback: try to parse as structured data
        setResult({
          mataKuliah: "",
          deadline: "",
          deskripsi: data.data?.rawText || t("ocr.cannotExtract"),
          dosen: "",
          rawText: data.data?.rawText,
        });
        toast.success(t("ocr.extracted"));
      }
    } catch {
      toast.error(t("ocr.processError"));
      // Fallback for when API is not available
      setResult({
        mataKuliah: "",
        deadline: "",
          deskripsi: t("ocr.apiUnavailable"),
        dosen: "",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsTask = async () => {
    if (!result?.deskripsi && !result?.mataKuliah) { toast.error(t("ocr.incompleteData")); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.mataKuliah || "Tugas dari OCR",
          description: result.deskripsi || "",
          deadline: result.deadline || null,
          priority: "medium",
          status: "pending",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(t("ocr.savedAsTask"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ocr.saveTaskError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopyText = () => {
    const text = [result?.mataKuliah, result?.deskripsi, result?.deadline, result?.dosen].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(t("ocr.copied"));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">{t("ocr.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("ocr.subtitle")}</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                 <span className="flex items-center gap-2"><FileImage className="h-4 w-4" />{t("ocr.uploadTitle")}</span>
                {file && (
                  <Button variant="ghost" size="icon-sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /></Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragOver ? "border-primary bg-primary/5" :
                  preview ? "border-border" :
                  "border-border hover:border-primary/30 cursor-pointer"
                }`}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-72 mx-auto rounded-lg shadow-lg" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                     <p className="text-sm text-muted-foreground">{t("ocr.dragDrop")}</p>
                     <p className="text-xs text-muted-foreground/60 mt-1">{t("ocr.fileHint")}</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-accent/50">
                  <FileImage className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              <Button onClick={handleProcess} disabled={!file || isProcessing} className="w-full">
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("ocr.processing")}</>
                ) : (
                  <><ScanText className="h-4 w-4" />{t("ocr.process")}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Result */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                 <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{t("ocr.resultTitle")}</span>
                {result && (
                  <Button variant="ghost" size="icon-sm" onClick={handleCopyText}><Copy className="h-3.5 w-3.5" /></Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("ocr.course")}</Label>
                    <Input value={result.mataKuliah || ""} onChange={(e) => setResult({ ...result, mataKuliah: e.target.value })} placeholder={t("ocr.coursePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ocr.deadline")}</Label>
                    <Input type="date" value={result.deadline || ""} onChange={(e) => setResult({ ...result, deadline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ocr.taskDesc")}</Label>
                    <Textarea value={result.deskripsi || ""} onChange={(e) => setResult({ ...result, deskripsi: e.target.value })} rows={4} placeholder={t("ocr.taskDescPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ocr.lecturer")}</Label>
                    <Input value={result.dosen || ""} onChange={(e) => setResult({ ...result, dosen: e.target.value })} placeholder={t("ocr.lecturerPlaceholder")} />
                  </div>

                  {result.rawText && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("ocr.rawText")}</Label>
                      <div className="p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {result.rawText}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleSaveAsTask} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t("ocr.saving")}</>
                    ) : (
                      <><ClipboardList className="h-4 w-4" />{t("ocr.saveAsTask")}</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <ScanText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{t("ocr.emptyResult")}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t("ocr.detectHint")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
