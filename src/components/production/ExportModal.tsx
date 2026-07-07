import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Trophy, Info, Loader2, Clapperboard, Share2, Youtube, Instagram, Twitter, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FESTIVAL_CATEGORIES, type FestivalCategory } from "@/lib/festivalCategories";
import { useFestivalEntry } from "@/hooks/useFestivalEntry";

interface ShotOption {
  id: string;
  shot_code: string;
  description: string;
  scene_number: string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shotId?: string | null;
}

const ExportModal = ({ open, onOpenChange, shotId }: ExportModalProps) => {
  const { user } = useAuth();
  const { freeEntryAvailable, submitEntry } = useFestivalEntry();
  const [submitToFest, setSubmitToFest] = useState(false);
  const [festCategory, setFestCategory] = useState<FestivalCategory>("best_overall");
  const [exporting, setExporting] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(shotId ?? null);
  const [shots, setShots] = useState<ShotOption[]>([]);
  const [loadingShots, setLoadingShots] = useState(false);

  // Sync external shotId prop
  useEffect(() => {
    if (shotId) setSelectedShotId(shotId);
  }, [shotId]);

  // Fetch user's shots when modal opens
  useEffect(() => {
    if (!open || !user) return;
    const fetchShots = async () => {
      setLoadingShots(true);
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id);
      if (!projects?.length) { setLoadingShots(false); return; }

      const { data, error } = await supabase
        .from("shots")
        .select("id, shot_code, description, scene_number")
        .in("project_id", projects.map((p) => p.id))
        .order("scene_number", { ascending: true });

      if (!error && data) setShots(data as ShotOption[]);
      setLoadingShots(false);
    };
    fetchShots();
  }, [open, user]);

  const handleExport = async () => {
    if (!user) {
      toast.error("You must be signed in to export.");
      return;
    }

    setExporting(true);

    try {
      // Festival submission via edge function (handles free vs $75 paid)
      if (submitToFest && selectedShotId) {
        try {
          const result = await submitEntry(selectedShotId, festCategory);
          if (result.alreadySubmitted) {
            toast.info("This shot is already submitted to the festival.");
          } else if (result.free) {
            toast.success("🎬 Free entry submitted to Golden Hour Indie Fest!");
          } else if (result.url) {
            toast.info("Redirecting to payment for your $75 festival entry…");
            window.open(result.url, "_blank");
            onOpenChange(false);
            setExporting(false);
            return; // Don't proceed with export — they'll come back after payment
          }
        } catch (err: any) {
          toast.error(err.message || "Festival submission failed.");
          setExporting(false);
          return;
        }
      }

      // Download / share the shot's video if available
      if (selectedShotId) {
        const { data: shotData } = await supabase
          .from("shots")
          .select("video_url, shot_code, scene_number")
          .eq("id", selectedShotId)
          .single();

        if (shotData?.video_url) {
          try {
            const { shareFile } = await import("@/lib/nativeShare");
            const filename = `S${shotData.scene_number}-${shotData.shot_code}.mp4`;
            const result = await shareFile({
              url: shotData.video_url,
              filename,
              mimeType: "video/mp4",
              title: filename,
              text: "Made with That's A Wrap",
            });
            if (result === "native" || result === "web") toast.success("Share sheet opened");
            else toast.success("Video exported successfully!");
          } catch {
            toast.error("Failed to export video file.");
          }
        } else {
          toast.info("No rendered video found for this shot. Generate a video first.");
        }
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-[var(--neo-border)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export & Submit
          </DialogTitle>
          <DialogDescription>
            Export your video from the Timeline Editor, or submit shots to the festival here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Shot selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5" />
              Select Shot
            </Label>
            <Select
              value={selectedShotId ?? ""}
              onValueChange={(v) => setSelectedShotId(v)}
              disabled={loadingShots}
            >
              <SelectTrigger className="w-full bg-secondary/30 border-[var(--neo-border)]">
                <SelectValue placeholder={loadingShots ? "Loading shots…" : "Choose a shot to export"} />
              </SelectTrigger>
              <SelectContent>
                {shots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-xs text-primary mr-1.5">S{s.scene_number}-{s.shot_code}</span>
                    <span className="truncate">{s.description || "Untitled shot"}</span>
                  </SelectItem>
                ))}
                {!loadingShots && shots.length === 0 && (
                  <SelectItem value="__none" disabled>No shots found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Format info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Format</span>
            <span className="font-mono text-foreground/80">MP4 · H.264</span>
          </div>

          {/* Festival toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--neo-border)] bg-secondary/30 p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <Label htmlFor="fest-toggle" className="text-sm font-medium cursor-pointer">
                Submit to Golden Hour Indie Fest
              </Label>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${freeEntryAvailable ? 'text-green-400 bg-green-400/10' : 'text-primary/80 bg-primary/10'}`}>
                {freeEntryAvailable ? "Free Entry" : "$75 Entry"}
              </span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {freeEntryAvailable
                      ? "Your first festival submission is free! Win 10,000 tokens."
                      : "Additional festival entries cost $75 each. Win 10,000 tokens!"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="fest-toggle"
              checked={submitToFest}
              onCheckedChange={setSubmitToFest}
              disabled={!selectedShotId}
            />
          </div>

          {/* Category selector (shown when festival toggle is on) */}
          {submitToFest && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Festival Category
              </Label>
              <Select value={festCategory} onValueChange={(v) => setFestCategory(v as FestivalCategory)}>
                <SelectTrigger className="w-full bg-secondary/30 border-[var(--neo-border)]">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {FESTIVAL_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Share to Social */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Share to Social
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { icon: Youtube, label: "YouTube", color: "hover:text-red-500", url: "https://studio.youtube.com/channel/upload" },
                { icon: Instagram, label: "Instagram", color: "hover:text-pink-500", url: "https://www.instagram.com/" },
                { icon: Twitter, label: "X / Twitter", color: "hover:text-sky-400", url: "https://twitter.com/compose/tweet" },
                { icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"/></svg>, label: "TikTok", color: "hover:text-teal-400", url: "https://www.tiktok.com/upload" },
                { icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609C15.9 19.925 13.143 22 10.82 22c-1.44 0-2.66-1.33-3.66-3.996-.665-2.442-1.33-4.885-1.996-7.327C4.498 8.01 3.785 6.676 3.025 6.676c-.18 0-.81.378-1.89 1.133L0 6.37c1.187-1.044 2.358-2.088 3.51-3.132C4.85 1.974 5.857 1.32 6.533 1.27c1.726-.166 2.787 1.014 3.182 3.543.427 2.73.723 4.43.887 5.1.493 2.24 1.034 3.36 1.625 3.36.459 0 1.148-.726 2.067-2.178.918-1.451 1.41-2.556 1.475-3.317.131-1.26-.364-1.89-1.484-1.89-.528 0-1.073.12-1.634.36 1.085-3.556 3.158-5.285 6.22-5.188 2.27.065 3.34 1.537 3.106 4.356Z"/></svg>, label: "Vimeo", color: "hover:text-blue-400", url: "https://vimeo.com/upload" },
              ].map((platform) => (
                <TooltipProvider key={platform.label} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 gap-1.5 ${platform.color} transition-colors`}
                        onClick={() => window.open(platform.url, "_blank")}
                      >
                        <platform.icon className="w-4 h-4" />
                        <span className="text-xs">{platform.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Open {platform.label} to upload
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button variant="glow" onClick={handleExport} disabled={exporting || !selectedShotId}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {submitToFest ? "Export & Submit" : "Export MP4"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
