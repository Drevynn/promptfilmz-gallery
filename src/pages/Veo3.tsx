import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Wand2, Download, Sparkles, Loader2, Trash2, ZoomIn, X, Video, Play, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/components/AppLayout";
import PaywallGate from "@/components/PaywallGate";

const styles = ["Cinematic", "Noir", "Photorealistic", "Surreal", "Fantasy", "Documentary", "Anime", "Abstract"];
const aspectRatios = ["16:9", "9:16", "1:1", "4:3"];

interface GeneratedScene {
  id: string;
  title: string;
  prompt: string;
  style: string;
  aspect: string;
  imageUrl: string;
  description: string;
  createdAt: Date;
}

interface GeneratedVideo {
  id: string;
  title: string;
  prompt: string;
  style: string;
  aspect: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  createdAt: Date;
}

const SCENE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-generate`;
const VIDEO_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/luma-video`;

const Veo3 = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [selectedAspect, setSelectedAspect] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationState, setGenerationState] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"image" | "video">("image");
  const [activeTab, setActiveTab] = useState("image");
  const { toast } = useToast();
  const { data: creditData, refetch: refetchCredits } = useCredits();
  const creditBalance = creditData?.balance ?? 0;
  const currentCost = activeTab === "video" ? 10 : 2;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const handleApiError = async (resp: Response) => {
    if (resp.status === 401) {
      toast({ title: "Session expired", description: "Please sign out and log in again.", variant: "destructive" });
      return true;
    }
    if (resp.status === 403) {
      const data = await resp.json();
      toast({ title: "Subscription required", description: data.error, variant: "destructive" });
      return true;
    }
    if (resp.status === 429) {
      toast({ title: "Rate limited", description: "Please wait a moment and try again.", variant: "destructive" });
      return true;
    }
    if (resp.status === 402) {
      toast({ title: "Credits depleted", description: "Please add credits to continue generating.", variant: "destructive" });
      return true;
    }
    return false;
  };

  const generateScene = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    trackEvent("scene_generate_start", { style: selectedStyle, aspect: selectedAspect });

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(SCENE_GEN_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: prompt.trim(), style: selectedStyle, aspectRatio: selectedAspect }),
      });

      if (await handleApiError(resp)) return;
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await resp.json();
      setScenes(prev => [{
        id: Date.now().toString(),
        title: prompt.trim().slice(0, 40) + (prompt.trim().length > 40 ? "..." : ""),
        prompt: prompt.trim(),
        style: selectedStyle,
        aspect: selectedAspect,
        imageUrl: data.imageUrl,
        description: data.description || "",
        createdAt: new Date(),
      }, ...prev]);
      setPrompt("");
      refetchCredits();
      toast({ title: "Scene generated!", description: "Your cinematic scene is ready." });
    } catch (err) {
      console.error("Scene generation error:", err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationState("submitting");
    setPollCount(0);
    const savedPrompt = prompt.trim();
    trackEvent("video_generate_start", { style: selectedStyle, aspect: selectedAspect });

    try {
      const headers = await getAuthHeaders();

      // Step 1: Submit generation (returns immediately with generationId)
      const submitResp = await fetch(VIDEO_GEN_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: savedPrompt, style: selectedStyle, aspectRatio: selectedAspect }),
      });

      if (await handleApiError(submitResp)) return;
      if (!submitResp.ok) {
        const data = await submitResp.json();
        throw new Error(data.error || "Video generation failed");
      }

      const submitData = await submitResp.json();
      const generationId = submitData.generationId;
      if (!generationId) throw new Error("No generation ID returned");

      setGenerationState("queued");
      toast({ title: "Video queued!", description: "Generating your video... this takes 1-2 minutes." });
      setPrompt("");

      // Step 2: Poll for completion (client-side)
      const maxPolls = 30; // 30 * 5s = 150s
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        setPollCount(i + 1);

        const pollResp = await fetch(VIDEO_GEN_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "poll", generationId }),
        });

        if (!pollResp.ok) continue;
        const pollData = await pollResp.json();
        setGenerationState(pollData.state);

        if (pollData.state === "completed") {
          setVideos(prev => [{
            id: generationId,
            title: savedPrompt.slice(0, 40) + (savedPrompt.length > 40 ? "..." : ""),
            prompt: savedPrompt,
            style: selectedStyle,
            aspect: selectedAspect,
            videoUrl: pollData.videoUrl,
            thumbnailUrl: pollData.thumbnailUrl,
            createdAt: new Date(),
          }, ...prev]);
          trackEvent("video_generate_complete", { style: selectedStyle });
          refetchCredits();
          toast({ title: "Video generated!", description: "Your AI video is ready. (10 credits used)" });
          return;
        }

        if (pollData.state === "failed") {
          throw new Error(pollData.error || "Video generation failed");
        }
        // Otherwise keep polling (state is "dreaming" / "queued")
      }

      throw new Error("Generation timed out. The video may still be processing — try refreshing.");
    } catch (err) {
      console.error("Video generation error:", err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGenerationState(null);
      setPollCount(0);
    }
  };

  const deleteScene = (id: string) => setScenes(prev => prev.filter(s => s.id !== id));
  const deleteVideo = (id: string) => setVideos(prev => prev.filter(v => v.id !== id));

  const downloadFile = async (url: string, filename: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const openLightbox = (url: string, type: "image" | "video") => {
    setLightboxUrl(url);
    setLightboxType(type);
  };

  return (
    <AppLayout>
      <PaywallGate>
        <div className="p-6 lg:p-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold">AI Studio</h1>
              <Badge className="bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] shadow-[0_0_8px_var(--neon-cyan-10)]">
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Generate cinematic scene images and AI videos</p>
          </motion.div>

          {/* Credits Display */}
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="neo-card rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[var(--neon-cyan)]" />
              <span className="text-sm font-medium">{creditBalance} credits remaining</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Image: <strong className="text-foreground">2</strong></span>
              <span className="text-[var(--neo-border)]">|</span>
              <span>Video: <strong className="text-foreground">10</strong></span>
            </div>
          </motion.div>

          {/* Generator Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neo-card rounded-2xl p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="image" className="gap-2">
                  <Image className="w-4 h-4" /> Scene Image
                  <Badge variant="outline" className="text-[9px] ml-1">2 credits</Badge>
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2">
                  <Video className="w-4 h-4" /> AI Video
                  <Badge variant="outline" className="text-[9px] ml-1">10 credits</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the scene you want to create... e.g., 'A sweeping aerial shot over a neon-lit cyberpunk city at night'"
                  className="w-full h-28 p-4 rounded-xl bg-secondary/50 border border-[var(--neo-border)] text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-[var(--neon-cyan-30)] focus:shadow-[0_0_15px_var(--neon-cyan-10)] transition-all resize-none"
                  disabled={isGenerating}
                />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate... e.g., 'A drone flyover of misty mountains at sunrise, golden light breaking through clouds'"
                  className="w-full h-28 p-4 rounded-xl bg-secondary/50 border border-[var(--neo-border)] text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-[var(--neon-pink-30)] focus:shadow-[0_0_15px_var(--neon-pink-10)] transition-all resize-none"
                  disabled={isGenerating}
                />
                <p className="text-[10px] text-muted-foreground">
                  ⚡ Powered by Luma Dream Machine • ~5s clips • 10 credits per generation
                </p>
              </TabsContent>
            </Tabs>

            {/* Style selection */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Style</p>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    disabled={isGenerating}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedStyle === s
                        ? "bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] shadow-[0_0_8px_var(--neon-cyan-10)]"
                        : "bg-secondary text-muted-foreground border-[var(--neo-border)] hover:border-[var(--neon-cyan-30)]"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Aspect Ratio</p>
              <div className="flex gap-2">
                {aspectRatios.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAspect(a)}
                    disabled={isGenerating}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedAspect === a
                        ? "bg-[var(--neon-pink-10)] text-[var(--neon-pink)] border-[var(--neon-pink-30)] shadow-[0_0_8px_var(--neon-pink-10)]"
                        : "bg-secondary text-muted-foreground border-[var(--neo-border)] hover:border-[var(--neon-pink-30)]"
                    } disabled:opacity-50`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Generation Progress */}
            {isGenerating && activeTab === "video" && generationState && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 neo-card rounded-xl p-4 border border-[var(--neon-pink-30)] bg-[var(--neon-pink-10)]/5">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--neon-pink)]" />
                  <span className="text-sm font-medium">
                    {generationState === "submitting" && "Submitting to Luma..."}
                    {generationState === "queued" && "Queued — waiting to start..."}
                    {generationState === "dreaming" && `Dreaming — generating your video... (${pollCount * 5}s)`}
                    {generationState === "completed" && "Complete!"}
                    {!["submitting", "queued", "dreaming", "completed", "failed"].includes(generationState) && `Processing (${generationState})...`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {["queued", "dreaming", "completed"].map((stage, i) => {
                    const stageOrder = ["queued", "dreaming", "completed"];
                    const currentIdx = stageOrder.indexOf(generationState);
                    const isActive = i <= currentIdx;
                    const isCurrent = stageOrder[i] === generationState;
                    return (
                      <div key={stage} className="flex items-center gap-1.5 flex-1">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          isActive
                            ? "bg-[var(--neon-pink)] shadow-[0_0_6px_var(--neon-pink)]"
                            : "bg-secondary"
                        } ${isCurrent ? "animate-pulse" : ""}`} />
                        <span className={`text-[9px] uppercase tracking-wider whitespace-nowrap ${
                          isActive ? "text-[var(--neon-pink)]" : "text-muted-foreground"
                        }`}>{stage}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Generate */}
            <div className="mt-6 flex items-center justify-between">
              {isGenerating && !generationState && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Generating scene...
                </p>
              )}
              {isGenerating && activeTab === "image" && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Generating scene...
                </p>
              )}
              <div className="ml-auto">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={activeTab === "video" ? generateVideo : generateScene}
                  disabled={isGenerating || !prompt.trim() || creditBalance < currentCost}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" /> Generate {activeTab === "video" ? "Video" : "Scene"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Generated Videos */}
          {videos.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Generated Videos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((vid, index) => (
                  <motion.div
                    key={vid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="neo-card rounded-xl overflow-hidden hover:border-[var(--neon-pink-30)] hover:shadow-[0_0_20px_var(--neon-pink-10)] transition-all group"
                  >
                    <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                      <video
                        src={vid.videoUrl}
                        poster={vid.thumbnailUrl || undefined}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                      />
                      <button
                        onClick={() => openLightbox(vid.videoUrl, "video")}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground" />
                        </div>
                      </button>
                      <Badge className="absolute top-2 left-2 bg-[var(--neon-pink-10)] text-[var(--neon-pink)] border-[var(--neon-pink-30)] text-[9px]">
                        <Video className="w-2.5 h-2.5 mr-0.5" /> Video
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm truncate">{vid.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] text-[10px]">{vid.style}</Badge>
                        <span className="text-xs text-muted-foreground">{vid.aspect}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => deleteVideo(vid.id)}>
                          <Trash2 className="w-3 h-3" /> Remove
                        </Button>
                        <Button variant="cinema" size="sm" className="flex-1 text-xs" onClick={() => downloadFile(vid.videoUrl, `video-${vid.style.toLowerCase()}-${vid.id}.mp4`)}>
                          <Download className="w-3 h-3" /> Download
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Scenes Gallery */}
          {scenes.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Generated Scenes</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scenes.map((scene, index) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="neo-card rounded-xl overflow-hidden hover:border-[var(--neon-cyan-30)] hover:shadow-[0_0_20px_var(--neon-cyan-10)] transition-all group"
                  >
                    <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                      <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" loading="lazy" />
                      <button
                        onClick={() => openLightbox(scene.imageUrl, "image")}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-foreground" />
                        </div>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm truncate">{scene.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] text-[10px]">{scene.style}</Badge>
                        <span className="text-xs text-muted-foreground">{scene.aspect}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => deleteScene(scene.id)}>
                          <Trash2 className="w-3 h-3" /> Remove
                        </Button>
                        <Button variant="cinema" size="sm" className="flex-1 text-xs" onClick={() => downloadFile(scene.imageUrl, `scene-${scene.style.toLowerCase()}-${scene.id}.png`)}>
                          <Download className="w-3 h-3" /> Download
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {scenes.length === 0 && videos.length === 0 && !isGenerating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center py-16">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">Your generated content will appear here</p>
              <p className="text-muted-foreground/50 text-xs mt-1">Choose Image or Video above and hit Generate</p>
            </motion.div>
          )}

          {/* Generating state */}
          {isGenerating && scenes.length === 0 && videos.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Loader2 className="w-10 h-10 mx-auto text-accent animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">
                {activeTab === "video" ? "Generating your AI video..." : "Creating your cinematic scene..."}
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {activeTab === "video" ? "This usually takes 1-2 minutes" : "This usually takes 10-20 seconds"}
              </p>
            </motion.div>
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
              onClick={() => setLightboxUrl(null)}
            >
              <button onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              {lightboxType === "video" ? (
                <video src={lightboxUrl} controls autoPlay className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
              ) : (
                <img src={lightboxUrl} alt="Scene preview" className="max-w-full max-h-full object-contain rounded-lg" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PaywallGate>
    </AppLayout>
  );
};

export default Veo3;
