import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, ImageIcon, Wand2, Loader2, Sparkles, X, Trash2, Image, Play, Maximize2, Move, Video, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { ExportSuite } from "@/components/production/ExportSuite";
import { CharacterBibleDrawer } from "@/components/production/CharacterBibleDrawer";

type Frame = {
  id: number;
  scene: string;
  description: string;
  notes: string;
  imageUrl?: string;
  status?: "ready" | "rendering";
};

const STORYBOARD_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storyboard-image`;

const initialFrames: Frame[] = [
  { id: 1, scene: "INT. APARTMENT - NIGHT", description: "Wide shot: Alex at desk, monitor glow", notes: "Blue/cold tones", status: "ready" },
  { id: 2, scene: "INT. APARTMENT - NIGHT", description: "CU: Monitor screen with countdown", notes: "Insert shot", status: "ready" },
  { id: 3, scene: "INT. APARTMENT - NIGHT", description: "MCU: Alex stands, chair falls", notes: "Quick camera movement", status: "ready" },
  { id: 4, scene: "EXT. CITY STREET", description: "Wide: Alex exits building into rain", notes: "Neon reflections in puddles", status: "ready" },
  { id: 5, scene: "EXT. CITY STREET", description: "Tracking shot: Alex running", notes: "Handheld, urgent feel", status: "ready" },
  { id: 6, scene: "EXT. CITY STREET", description: "Low angle: Neon signs above", notes: "Atmosphere establishing", status: "ready" },
];

const STORYBOARD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storyboard-assist`;

const SUGGESTIONS = [
  "A tense chase through a rainy cyberpunk city at night",
  "A quiet emotional conversation in a sunlit café",
  "An action sequence in an abandoned warehouse",
  "A mysterious figure entering a neon-lit alley",
];

const Storyboard = () => {
  const [exportSuiteOpen, setExportSuiteOpen] = useState(false);
  const [charBibleOpen, setCharBibleOpen] = useState(false);
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [showAI, setShowAI] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFrames, setGeneratedFrames] = useState<Frame[]>([]);
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<number>>(new Set());
  const [expandedFrame, setExpandedFrame] = useState<number | null>(null);
  const { toast } = useToast();

  const generateThumbnail = async (frame: Frame) => {
    setGeneratingImageIds(prev => new Set(prev).add(frame.id));
    // Mark frame as rendering
    setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, status: "rendering" } : f));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(STORYBOARD_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          scene: frame.scene,
          description: frame.description,
          notes: frame.notes,
          frameId: frame.id,
        }),
      });

      if (resp.status === 401) {
        toast({ title: "Session expired", description: "Please sign out and log in again to continue.", variant: "destructive" });
        return;
      }
      if (resp.status === 429 || resp.status === 402) {
        const data = await resp.json();
        toast({ title: "AI Unavailable", description: data.error, variant: "destructive" });
        return;
      }
      if (!resp.ok) throw new Error("Failed");

      const data = await resp.json();
      if (data.imageUrl) {
        setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, imageUrl: data.imageUrl, status: "ready" } : f));
        toast({ title: "Thumbnail generated!", description: `Frame "${frame.description}" now has a visual.` });
        trackEvent("storyboard_image_generated", { frame_scene: frame.scene });
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate thumbnail.", variant: "destructive" });
      setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, status: "ready" } : f));
    } finally {
      setGeneratingImageIds(prev => {
        const next = new Set(prev);
        next.delete(frame.id);
        return next;
      });
    }
  };

  const generateAllThumbnails = async () => {
    const framesWithoutImages = frames.filter(f => !f.imageUrl);
    if (framesWithoutImages.length === 0) {
      toast({ title: "All done", description: "Every frame already has a thumbnail." });
      return;
    }
    toast({ title: "Generating thumbnails...", description: `${framesWithoutImages.length} frames queued.` });
    for (const frame of framesWithoutImages) {
      await generateThumbnail(frame);
    }
  };

  const generateFrames = async (inputPrompt: string) => {
    if (!inputPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedFrames([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(STORYBOARD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          existingFrames: frames,
        }),
      });

      if (resp.status === 401) {
        toast({ title: "Session expired", description: "Please sign out and log in again to continue.", variant: "destructive" });
        setIsGenerating(false);
        return;
      }
      if (resp.status === 429 || resp.status === 402) {
        const data = await resp.json();
        toast({ title: "AI Unavailable", description: data.error, variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      if (!resp.ok) throw new Error("Failed");

      const data = await resp.json();
      const newFrames = (data.frames || []).map((f: Record<string, string>, i: number) => ({
        id: Date.now() + i,
        scene: f.scene,
        description: f.description,
        notes: f.notes,
        status: "ready" as const,
      }));
      setGeneratedFrames(newFrames);
    } catch {
      toast({ title: "Error", description: "Failed to generate frames. Please try again.", variant: "destructive" });
    }
    setIsGenerating(false);
  };

  const addGeneratedFrames = () => {
    setFrames(prev => [...prev, ...generatedFrames]);
    setGeneratedFrames([]);
    setShowAI(false);
    setPrompt("");
    trackEvent("storyboard_ai_generated", { frame_count: generatedFrames.length });
    toast({ title: "Frames added!", description: `${generatedFrames.length} frames appended to your storyboard.` });
  };

  const removeFrame = (id: number) => {
    setFrames(prev => prev.filter(f => f.id !== id));
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 border-b border-[var(--neo-border)] pb-6"
        >
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2 text-gold-blue-shimmer">
              <Video className="w-5 h-5 text-primary" /> Storyboard Canvas
            </h1>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              Visual Sequence Layout • {frames.length} frames
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCharBibleOpen(true)}
              className="border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <Users className="w-4 h-4 text-[var(--neon-purple)]" /> Character Bible
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportSuiteOpen(true)}
            >
              <Download className="w-4 h-4" /> Export boards
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAllThumbnails}
              disabled={generatingImageIds.size > 0}
            >
              {generatingImageIds.size > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              {generatingImageIds.size > 0 ? `Generating (${generatingImageIds.size})...` : "Generate All"}
            </Button>
            <Button
              variant="cinema"
              size="sm"
              onClick={() => setShowAI(!showAI)}
              className={showAI ? "ring-2 ring-primary" : ""}
            >
              <Wand2 className="w-4 h-4" /> AI Generate
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={() => {
                const newId = Date.now();
                setFrames(prev => [...prev, { id: newId, scene: "INT. NEW SCENE", description: "Shot description", notes: "Notes", status: "ready" }]);
              }}
            >
              <Plus className="w-4 h-4" /> New Scene
            </Button>
          </div>
        </motion.div>

        {/* AI Generation Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="neo-card rounded-xl p-5 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-semibold text-sm">AI Scene Generator</h3>
                  </div>
                  <button onClick={() => { setShowAI(false); setGeneratedFrames([]); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setPrompt(s); generateFrames(s); }}
                      disabled={isGenerating}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); generateFrames(prompt); }}
                  className="flex gap-2 mb-4"
                >
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a scene or sequence to generate frames for..."
                    className="flex-1 text-sm bg-card border-border"
                    disabled={isGenerating}
                  />
                  <Button type="submit" variant="cinema" size="sm" disabled={isGenerating || !prompt.trim()}>
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                </form>

                {generatedFrames.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">
                        {generatedFrames.length} frames generated — preview below
                      </p>
                      <Button variant="glow" size="sm" onClick={addGeneratedFrames}>
                        <Plus className="w-3 h-3" /> Add all to storyboard
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {generatedFrames.map((frame, i) => (
                        <motion.div
                          key={frame.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden"
                        >
                          <div className="aspect-video bg-secondary/30 flex items-center justify-center relative">
                            <ImageIcon className="w-8 h-8 text-primary/30" />
                            <Badge className="absolute top-2 left-2 bg-primary/20 text-primary border-primary/30 font-mono text-[10px]">
                              New #{i + 1}
                            </Badge>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-accent font-mono mb-1">{frame.scene}</p>
                            <p className="text-xs font-medium mb-1">{frame.description}</p>
                            <p className="text-[10px] text-muted-foreground">{frame.notes}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draggable Storyboard Grid */}
        <Reorder.Group
          axis="y"
          values={frames}
          onReorder={setFrames}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {frames.map((frame, index) => (
            <Reorder.Item
              key={frame.id}
              value={frame}
              className="group relative neo-card rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:border-[var(--neon-cyan-30)] hover:shadow-[0_0_20px_var(--neon-cyan-10)] transition-all"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              {/* 16:9 Aspect Ratio Visual */}
              <div className="relative aspect-video bg-secondary/50 overflow-hidden">
                {frame.status === "rendering" || generatingImageIds.has(frame.id) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
                    <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ x: [-64, 64] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-primary font-bold uppercase animate-pulse">
                      Veo Rendering...
                    </span>
                  </div>
                ) : frame.imageUrl ? (
                  <>
                    <img
                      src={frame.imageUrl}
                      alt={frame.description}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20">
                      <button className="p-3 bg-primary rounded-full text-primary-foreground shadow-[0_0_20px_var(--neon-pink-30)] scale-90 group-hover:scale-100 transition-transform">
                        <Play fill="currentColor" className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); generateThumbnail(frame); }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-secondary/30 transition-colors"
                  >
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to generate
                    </span>
                  </button>
                )}

                {/* Frame number badge */}
                <Badge className="absolute top-2 left-2 bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] font-mono text-[10px] z-10">
                  #{index + 1}
                </Badge>

                {/* Reorder handle */}
                <div className="absolute top-2 left-[calc(100%-2rem-0.5rem)] p-1 bg-background/50 rounded backdrop-blur-md border border-[var(--neo-border)] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Move className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>

              {/* Frame Info */}
              <div className="p-3 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-accent font-mono mb-0.5 truncate">{frame.scene}</p>
                  <h4 className="text-xs font-bold truncate">{frame.description}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                    {frame.notes} • {frame.imageUrl ? "AI-Generated" : "Pending"}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  {frame.imageUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); generateThumbnail(frame); }}
                      className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors"
                      title="Regenerate"
                    >
                      <Wand2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedFrame(expandedFrame === frame.id ? null : frame.id); }}
                    className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }}
                    className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}

          {/* Empty Placeholder Slot */}
          <div
            onClick={() => {
              const newId = Date.now();
              setFrames(prev => [...prev, { id: newId, scene: "INT. NEW SCENE", description: "Shot description", notes: "Notes", status: "ready" }]);
            }}
            className="aspect-[16/12] border-2 border-dashed border-[var(--neo-border)] rounded-xl flex flex-col items-center justify-center gap-2 group hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer"
          >
            <div className="p-3 bg-secondary/50 rounded-full text-muted-foreground group-hover:text-primary transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary/50 transition-colors">
              Add Visual Beat
            </span>
          </div>
        </Reorder.Group>
        <ExportSuite 
          open={exportSuiteOpen} 
          onOpenChange={setExportSuiteOpen} 
          storyboardFrames={frames} 
          screenplayTitle="Project Storyboard Sequences"
        />
        <CharacterBibleDrawer 
          open={charBibleOpen} 
          onOpenChange={setCharBibleOpen}
        />
      </div>
    </AppLayout>
  );
};

export default Storyboard;
