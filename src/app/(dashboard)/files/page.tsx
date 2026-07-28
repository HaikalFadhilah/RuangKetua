"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import FileBrowser from "@/components/drive/file-browser";
import { container, item } from "@/lib/animations";

export default function FilesPage() {
  const { t } = useI18n();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.files")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("files.gdriveSubtitle")}</p>
      </motion.div>

      <motion.div variants={item}>
        <FileBrowser />
      </motion.div>
    </motion.div>
  );
}
