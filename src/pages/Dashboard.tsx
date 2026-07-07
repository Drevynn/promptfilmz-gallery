import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, Pause, Clock, Film, Music, FileText, TrendingUp, Trash2, LogOut, Download, X, Zap, ChevronDown, Video, Move, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import heroBanner from "@/assets/hero-banner.png";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EnrichedShot } from "@/hooks/useShots";
import ShotListTracker from "@/components/production/ShotListTracker";
import VeoVideoEngine, { GeneratedClip } from "@/components/production/VeoVideoEngine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UsageTracker from "@/components/production/UsageTracker";

const stats = [
  { label: "Active Projects", value: "–", icon: Film, change: "" },
  { label: "Scripts Written", value: "–", icon: FileText, change: "" },
  { label: "Music Tracks", value: "–", icon: Music, change: "" },
  { label: "Hours Edited", value: "–", icon: Clock, change: "" },
];

const statusBadge: Record<string, { className: string; label: string }> = {
  draft: { className: "bg-[var(--neon-purple-10)] text-[var(--neon-purple)] border-[var(--neon-purple-30)]", label: "Draft" },
  "in-progress": { className: "bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] shadow-[0_0_8px_var(--neon-cyan-30)]", label: "In Progress" },
  completed: { className: "bg-[var(--neon-green-10)] text-[var(--neon-green-raw)] border-[var(--neon-green-30)] shadow-[0_0_8px_var(--neon-green-30)]", label: "Complete" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({ title: "🎉 Subscription activated!", description: "Welcome to the premium experience." });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === "canceled") {
      toast({ title: "Checkout canceled", description: "No charges were made." });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Production state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeShot, setActiveShot] = useState<EnrichedShot | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const handleClipGenerated = (clip: GeneratedClip) => {
    setGeneratedClips(prev => [clip, ...prev]);
  };

  const handleClipReady = (clipId: string) => {
    setGeneratedClips(prev =>
      prev.map(c => c.id === clipId ? { ...c, status: "ready" } : c)
    );
  };

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem("pwa-banner-dismissed") === "true"
  );
  const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setBannerDismissed(true);
      localStorage.setItem("pwa-banner-dismissed", "true");
    }
    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  const showBanner = !isStandalone && !bannerDismissed;

  // Auto-select first project for production
  useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Generate cinematic prompt from active shot
  useEffect(() => {
    if (activeShot) {
      const cinematicPrompt = `Cinematic ${activeShot.shot_type}, ${activeShot.camera_angle}. ${activeShot.prompt || "Describe the scene"}. Motion intensity: ${activeShot.motion_intensity}%. High-fidelity textures, professional lighting, 4K.`;
      setGeneratedPrompt(cinematicPrompt);
    }
  }, [activeShot]);

  const dynamicStats = [
    { ...stats[0], value: String(projects?.length ?? 0), change: "" },
    ...stats.slice(1),
  ];

  const FREE_PROJECT_LIMIT = 1;
  const isAtLimit = (projects?.length ?? 0) >= FREE_PROJECT_LIMIT;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit) {
      toast({
        title: "Project limit reached",
        description: "Free accounts are limited to 1 project. Upgrade to Pro for unlimited projects — no credit card needed until your 2nd project.",
        variant: "destructive",
      });
      setDialogOpen(false);
      return;
    }
    try {
      await createProject.mutateAsync({ title, description: description || undefined });
      setTitle("");
      setDescription("");
      setDialogOpen(false);
      toast({ title: "Project created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast({ title: "Project deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Install Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="neo-card rounded-xl p-4 flex items-center justify-between gap-4 border-[var(--neon-cyan-30)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[var(--neon-cyan-10)] flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Install That's A Wrap</p>
                  <p className="text-xs text-muted-foreground truncate">Add to your home screen for the best experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {installPrompt ? (
                  <Button variant="glow" size="sm" onClick={handleInstallClick}>
                    Install
                  </Button>
                ) : (
                  <Button variant="glow" size="sm" asChild className="animate-[glow-pulse-gold_2s_ease-in-out_infinite] text-gold-shimmer">
                    <a href="/install">How to Install</a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismissBanner}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden h-64 sm:h-56 lg:h-64 border border-border"
        >
          <img src={heroBanner} alt="That's A Wrap banner" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center">
              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg text-center mx-auto text-gold-blue-shimmer">
                Welcome to That's A Wrap
              </h1>
              <p className="text-foreground/70 text-sm lg:text-base max-w-md mx-auto drop-shadow-sm">
                Your AI-powered filmmaking studio. Create stunning shorts from script to screen.
              </p>
              <div className="flex flex-col items-center gap-2 mt-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="glow" size="lg" className="text-gold-shimmer glow-pulse-gold">
                      <Plus className="w-4 h-4" /> New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="neo-card border-[var(--neon-pink-30)]">
                    <DialogHeader>
                      <DialogTitle className="font-display">Create New Project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-title">Title</Label>
                        <Input id="project-title" placeholder="My Short Film" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-desc">Description (optional)</Label>
                        <Textarea id="project-desc" placeholder="A brief description..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
                      </div>
                      <Button type="submit" variant="glow" className="w-full" disabled={createProject.isPending}>
                        {createProject.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="glow" size="sm" onClick={signOut} className="animate-[glow-pulse-gold_2s_ease-in-out_infinite] text-gold-shimmer">
                  <LogOut className="w-4 h-4 mr-1" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicStats.map((stat, i) => {
            const neonColors = [
              { border: "var(--neon-pink-30)", glow: "var(--neon-pink-10)", icon: "text-[var(--neon-pink)]" },
              { border: "var(--neon-cyan-30)", glow: "var(--neon-cyan-10)", icon: "text-accent" },
              { border: "var(--neon-purple-30)", glow: "var(--neon-purple-10)", icon: "text-[var(--neon-purple)]" },
              { border: "var(--neon-green-30)", glow: "var(--neon-green-10)", icon: "text-neon-green" },
            ][i];
            return (
              <motion.div
                key={stat.label}
                variants={item}
                className="neo-card rounded-xl p-4 transition-all hover:shadow-[0_0_20px_var(--neon-pink-10)]"
                style={{ borderColor: neonColors.border }}
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${neonColors.icon}`} />
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Usage Tracker */}
        <UsageTracker />

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Your Projects</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project) => {
                const badge = statusBadge[project.status] ?? statusBadge.draft;
                return (
                  <motion.div
                    key={project.id}
                    variants={item}
                    whileHover={{ y: -4 }}
                    className="neo-card rounded-xl p-5 transition-all cursor-pointer group hover:border-[var(--neon-pink-30)] hover:shadow-[0_0_25px_var(--neon-pink-10)]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display font-semibold text-lg">{project.title}</h3>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                      <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="cinema" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/script?project=${project.id}`); }}>
                        <Play className="w-3 h-3" /> Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {/* New Project Card */}
              {!isAtLimit && (
              <motion.div
                variants={item}
                whileHover={{ y: -4 }}
                onClick={() => setDialogOpen(true)}
                className="rounded-xl border border-dashed border-[var(--neo-border)] p-5 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-[var(--neon-pink-30)] hover:shadow-[0_0_25px_var(--neon-pink-10)] transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--neon-pink-05)] flex items-center justify-center group-hover:bg-[var(--neon-pink-10)] transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Create New Short
                </p>
              </motion.div>
              )}
              {isAtLimit && (
              <motion.div
                variants={item}
                className="rounded-xl border border-dashed border-[var(--neon-purple-30)] p-5 flex flex-col items-center justify-center min-h-[180px] text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--neon-purple-10)] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[var(--neon-purple)]" />
                </div>
                <p className="mt-3 text-sm font-semibold">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlock unlimited projects. No credit card until launch.
                </p>
              </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Production Studio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold">Production Studio</h2>
              <Badge className="bg-[var(--neon-green-10)] text-[var(--neon-green-raw)] border-[var(--neon-green-30)] text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-0.5" fill="currentColor" /> Live
              </Badge>
            </div>
            {projects && projects.length > 0 && (
              <Select value={selectedProjectId ?? undefined} onValueChange={(v) => { setSelectedProjectId(v); setActiveShot(null); setGeneratedPrompt(""); }}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedProjectId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Shot List */}
              <div className="lg:col-span-4 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Script Breakdown</p>
                <ShotListTracker
                  projectId={selectedProjectId}
                  onSelectShot={(shot) => setActiveShot(shot)}
                  currentShotId={activeShot?.id}
                />
              </div>
              {/* Right: Veo Engine */}
              <div className="lg:col-span-8">
                <VeoVideoEngine
                  initialPrompt={generatedPrompt}
                  isSyncing={!!activeShot}
                  shotData={activeShot}
                  onGenerate={handleClipGenerated}
                  onGenerateComplete={handleClipReady}
                />
              </div>
            </div>
          ) : (
            <div className="neo-card rounded-xl p-12 text-center">
              <Film className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Create a project above to start production</p>
            </div>
          )}

          {/* Generated Clips Storyboard Grid */}
          <AnimatePresence>
            {generatedClips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mt-6"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <Video className="w-3.5 h-3.5 inline mr-1.5" />
                      Storyboard Canvas
                    </h3>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                      {generatedClips.length} clips
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {generatedClips.map((clip, index) => (
                    <motion.div
                      key={clip.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative neo-card rounded-xl overflow-hidden hover:border-[var(--neon-cyan-30)] hover:shadow-[0_0_20px_var(--neon-cyan-10)] transition-all"
                    >
                      {/* 16:9 Visual */}
                      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
                        {clip.status === "rendering" ? (
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
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan-10)] via-secondary/30 to-[var(--neon-pink-10)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20">
                              <button
                                onClick={() => setPlayingClipId(playingClipId === clip.id ? null : clip.id)}
                                className="p-3 bg-primary rounded-full text-primary-foreground shadow-[0_0_20px_var(--neon-pink-30)] scale-90 group-hover:scale-100 transition-transform"
                              >
                                {playingClipId === clip.id ? (
                                  <Pause fill="currentColor" className="w-5 h-5" />
                                ) : (
                                  <Play fill="currentColor" className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Badge */}
                        <Badge className="absolute top-2 left-2 bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] font-mono text-[10px] z-10">
                          {clip.shotLabel ? `Shot ${clip.shotLabel}` : `#${generatedClips.length - index}`}
                        </Badge>

                        {/* Move handle */}
                        <div className="absolute top-2 right-2 p-1 bg-background/50 rounded backdrop-blur-md border border-[var(--neo-border)] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Move className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate">{clip.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{clip.prompt}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                            {clip.style} • {clip.aspect} • {clip.duration}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                          <button className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setGeneratedClips(prev => prev.filter(c => c.id !== clip.id))}
                            className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
