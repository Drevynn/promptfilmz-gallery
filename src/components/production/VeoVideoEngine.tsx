import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Sparkles, Zap, Copy, Settings2, ImagePlus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnrichedShot } from "@/hooks/useShots";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

const styles = ["Cinematic", "Anime", "Photorealistic", "Surreal", "Documentary", "Noir", "Fantasy"];
const aspectRatios = ["16:9", "9:16", "1:1", "4:3"];
const durations = ["5s", "10s", "15s", "30s"];

export interface GeneratedClip {
  id: string;
  title: string;
  prompt: string;
  style: string;
  aspect: string;
  duration: string;
  status: "rendering" | "ready";
  shotLabel?: string;
}

interface VeoVideoEngineProps {
  initialPrompt: string;
  isSyncing: boolean;
  shotData: EnrichedShot | null;
  onGenerate?: (clip: GeneratedClip) => void;
  onGenerateComplete?: (clipId: string) => void;
}

const VeoVideoEngine = ({ initialPrompt, isSyncing, shotData, onGenerate, onGenerateComplete }: VeoVideoEngineProps) => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [selectedAspect, setSelectedAspect] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("10s");
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptKey, setPromptKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setPromptKey((k) => k + 1);
    }
  }, [initialPrompt]);

  const shotLabel = shotData ? `${shotData.scene_number}.${shotData.order_index + 1}` : null;

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the video you want to generate.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);

    const clipId = crypto.randomUUID();
    const clip: GeneratedClip = {
      id: clipId,
      title: shotData ? `Shot ${shotLabel}` : "Generated Clip",
      prompt: prompt.slice(0, 120),
      style: selectedStyle,
      aspect: selectedAspect,
      duration: selectedDuration,
      status: "rendering",
      shotLabel: shotLabel ?? undefined,
    };
    onGenerate?.(clip);

    trackEvent("veo_engine_generate", {
      style: selectedStyle,
      aspect: selectedAspect,
      duration: selectedDuration,
      from_shot: !!shotData,
      prompt_length: prompt.length,
    });

    setTimeout(async () => {
      setIsGenerating(false);
      onGenerateComplete?.(clipId);
      toast({ title: "Generation complete", description: "Your video clip is ready for preview." });

      // Send push notification for background users
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          fetch(`https://${projectId}.supabase.co/functions/v1/send-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              userId: session.user.id,
              title: "🎬 Render Complete",
              body: `Shot ${shotLabel || "clip"} is ready for preview`,
              url: "/dashboard",
              event_type: "render_complete",
            }),
          });
        }
      } catch {
        // Push notification is best-effort
      }
    }, 5000);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt copied" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Veo Engine</h2>
          <Badge className="bg-[var(--neon-green-10)] text-[var(--neon-green-raw)] border-[var(--neon-green-30)] text-[9px]">
            <Zap className="w-2.5 h-2.5 mr-0.5" fill="currentColor" /> Online
          </Badge>
        </div>
      </div>

      {/* Main Panel */}
      <div className="neo-card rounded-2xl p-6 relative overflow-hidden space-y-5">
        {/* Sync Indicator */}
        <AnimatePresence>
          {isSyncing && shotData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full z-10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                Synced to Shot {shotLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shot context banner */}
        <AnimatePresence mode="wait">
          {shotData && (
            <motion.div
              key={shotData.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--neon-cyan-10)]/30 border border-[var(--neon-cyan-30)]/30"
            >
              <Video className="w-4 h-4 text-accent shrink-0" />
              <div className="text-xs">
                <span className="text-accent font-mono font-bold">{shotLabel}</span>
                <span className="text-muted-foreground ml-2">
                  {shotData.shot_type} • {shotData.camera_angle} • Motion: {shotData.motion_intensity}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Director's Prompt */}
        <div className="space-y-2 mt-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Director's Prompt
          </label>
          <AnimatePresence mode="wait">
            <motion.div
              key={promptKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate... Select a shot from the list to auto-fill."
                className="w-full h-32 p-4 pr-10 rounded-xl bg-secondary/50 border border-[var(--neo-border)] text-foreground text-sm font-light leading-relaxed placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:shadow-[0_0_15px_var(--neon-pink-10)] transition-all resize-none"
              />
              {prompt && (
                <button
                  onClick={copyPrompt}
                  className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Reference image */}
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[var(--neo-border)] hover:border-[var(--neon-cyan-30)] text-muted-foreground hover:text-foreground transition-all text-xs">
          <ImagePlus className="w-3.5 h-3.5" />
          Upload reference image (optional)
        </button>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Style</p>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {styles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Aspect</p>
            <Select value={selectedAspect} onValueChange={setSelectedAspect}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {aspectRatios.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Duration</p>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {durations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate */}
        <div className="flex items-center justify-between pt-2">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Settings2 className="w-3.5 h-3.5" /> Advanced
          </button>
          <Button
            variant="glow"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Video"}
          </Button>
        </div>

        {/* Generation preview */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-xl bg-secondary/30 border border-[var(--neon-cyan-30)]/30 aspect-video flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 mx-auto rounded-full bg-[var(--neon-cyan-10)] flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-accent" />
                </motion.div>
                <p className="text-xs text-muted-foreground">Rendering your scene...</p>
                <div className="w-48 mx-auto h-1 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="h-full rounded-full bg-accent"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VeoVideoEngine;
