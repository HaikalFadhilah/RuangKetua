const fs = require('fs');

const path = 'src/components/drive/file-browser.tsx';
let content = fs.readFileSync(path, 'utf8');

const previewContent = 
          {/* Preview */}
          <Dialog open={!!previewTarget} onOpenChange={(o) => !o && setPreviewTarget(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="truncate pr-6">{previewTarget?.name}</DialogTitle>
                <DialogDescription>
                  {previewTarget ? formatFileSize(previewTarget.size) : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                {/* Preview for images */}
                {previewTarget?.mimeType.startsWith("image/") && (
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewTarget.thumbnailLink?.replace(/=s\\d+/, "=s2048") || previewTarget.webViewLink || ""}
                      alt={previewTarget.name}
                      className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Preview for documents/pdfs/videos */}
                {previewTarget && !previewTarget.mimeType.startsWith("image/") &&
                  (previewTarget.mimeType.includes("pdf") ||
                    previewTarget.mimeType.includes("document") ||
                    previewTarget.mimeType.includes("word") ||
                    previewTarget.mimeType.includes("presentation") ||
                    previewTarget.mimeType.includes("spreadsheet") ||
                    previewTarget.mimeType.startsWith("video/")) &&
                  previewTarget.webViewLink?.includes("google.com") && (
                    <div className="rounded-xl overflow-hidden border border-border aspect-[16/9] relative bg-muted/20">
                      <iframe
                        src={previewTarget.webViewLink.replace(/\\/(view|edit)(\\?.*)?$/, "/preview")}
                        title={previewTarget.name}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="autoplay; fullscreen"
                      />
                    </div>
                  )}

                {/* Fallback for others */}
                {previewTarget && !previewTarget.mimeType.startsWith("image/") &&
                  !(
                    (previewTarget.mimeType.includes("pdf") ||
                      previewTarget.mimeType.includes("document") ||
                      previewTarget.mimeType.includes("word") ||
                      previewTarget.mimeType.includes("presentation") ||
                      previewTarget.mimeType.includes("spreadsheet") ||
                      previewTarget.mimeType.startsWith("video/")) &&
                    previewTarget.webViewLink?.includes("google.com")
                  ) && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-xl border border-border">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm font-medium">{t("drive.noPreview", { defaultValue: "No preview available" })}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("drive.noPreviewDesc", { defaultValue: "Please download the file to view its contents." })}
                      </p>
                    </div>
                  )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTarget(null)}>
                  {t("action.cancel")}
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => previewTarget && downloadFile(previewTarget)}>
                  <Download className="h-4 w-4" /> {t("drive.download")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
;

if (!content.includes('Preview for documents/pdfs/videos')) {
  content = content.replace('{/* Delete */}', previewContent.trim() + '\n\n          {/* Delete */}');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched file!');
} else {
  console.log('Already patched!');
}
