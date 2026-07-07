import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, CheckCircle2, XCircle, Film, HardDrive, Cpu, Share2 } from "lucide-react";
import type { ExportStage } from "@/hooks/useTimelineExport";
import { shareFile } from "@/lib/nativeShare";
import { toast } from "sonner";

interface ExportProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: ExportStage;
  progress: number;
  message: string;
  downloadUrl: string | null;
  error: string | null;
  onReset: () => void;
}

const STAGE_CONFIG: Record<ExportStage, { icon: React.ElementType; label: string; color: string }> = {
  idle: { icon: Film, label: "Ready", color: "text-muted-foreground" },
  loading: { icon: Loader2, label: "Loading Encoder", color: "text-primary" },
  downloading: { icon: HardDrive, label: "Downloading Clips", color: "text-accent" },
  encoding: { icon: Cpu, label: "Encoding MP4", color: "text-primary" },
  complete: { icon: CheckCircle2, label: "Export Complete", color: "text-green-500" },
  error: { icon: XCircle, label: "Export Failed", color: "text-destructive" },
};

const ExportProgressModal = ({
  open, onOpenChange, stage, progress, message, downloadUrl, error, onReset,
}: ExportProgressModalProps) => {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;
  const isWorking = stage === "loading" || stage === "downloading" || stage === "encoding";

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `aifilmz-export-${Date.now()}.mp4`;
    a.click();
  };

  const handleShare = async () => {
    if (!downloadUrl) return;
    try {
      const result = await shareFile({
        url: downloadUrl,
        filename: `aifilmz-export-${Date.now()}.mp4`,
        mimeType: "video/mp4",
        title: "My That's A Wrap Export",
        text: "Made with That's A Wrap",
      });
      if (result === "download") toast.success("Video downloaded");
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Couldn't open share sheet");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isWorking) onOpenChange(v); }}>
      <DialogContent className="neo-card border-[var(--neo-border)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            Export Timeline to MP4
          </DialogTitle>
          <DialogDescription>
            Concatenates your video clips and mixes audio tracks into a single MP4 file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Stage indicator */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-secondary/30 ${config.color}`}>
              <Icon className={`w-6 h-6 ${isWorking ? "animate-spin" : ""}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
              <p className="text-xs text-muted-foreground truncate">{message}</p>
            </div>
          </div>

          {/* Progress bar */}
          {isWorking && (
            <div className="space-y-1.5">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-right font-mono">{progress}%</p>
            </div>
          )}

          {/* Stage steps */}
          <div className="space-y-2">
            {(["loading", "downloading", "encoding", "complete"] as ExportStage[]).map((s) => {
              const stageIdx = ["loading", "downloading", "encoding", "complete"].indexOf(s);
              const currentIdx = ["loading", "downloading", "encoding", "complete"].indexOf(stage);
              const isDone = currentIdx > stageIdx || stage === "complete";
              const isActive = s === stage;
              return (
                <div key={s} className={`flex items-center gap-2 text-xs ${isDone ? "text-green-500" : isActive ? "text-primary" : "text-muted-foreground/40"}`}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current" />
                  )}
                  <span>{STAGE_CONFIG[s].label}</span>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {stage === "complete" && downloadUrl ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button variant="outline" onClick={() => { onReset(); onOpenChange(false); }} className="flex-1">
                Close
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="glow" onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          ) : stage === "error" ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => { onReset(); onOpenChange(false); }}>
                Close
              </Button>
              <Button variant="glow" onClick={onReset}>
                Try Again
              </Button>
            </div>
          ) : (
            <Button variant="outline" disabled={isWorking} onClick={() => onOpenChange(false)}>
              {isWorking ? "Exporting…" : "Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProgressModal;
