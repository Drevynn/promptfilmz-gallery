import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ArrowUp, ChevronRight, LayoutDashboard, FileText, ListChecks,
  Image, Video, Film, Music, Clapperboard, Settings, BarChart3, Search,
  Zap, HelpCircle, Sparkles, CreditCard, Shield, Trophy, Users, Mail,
  Copy, Check, Play, ExternalLink, Sliders, Layers, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

/* ── Wiki Section Data Interface ─────────────────────────────────────── */

export interface ToolGuide {
  id: string;
  category: "pre-production" | "ai-generation" | "post-production" | "platform" | "community";
  icon: React.ElementType;
  title: string;
  summary: string;
  route?: string;
  creditCost?: string;
  samplePrompts?: string[];
  keyFeatures: string[];
  content: string[];
}

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "pre-production", label: "Pre-Production" },
  { id: "ai-generation", label: "AI Generation" },
  { id: "post-production", label: "Post-Production" },
  { id: "platform", label: "Platform & Credits" },
  { id: "community", label: "Community & Fest" },
];

export const wikiGuides: ToolGuide[] = [
  {
    id: "getting-started",
    category: "platform",
    icon: Zap,
    title: "Getting Started & Core Workflow",
    summary: "The complete step-by-step roadmap for creating a short film from script to final rendered MP4.",
    route: "/dashboard",
    keyFeatures: [
      "End-to-end AI filmmaking pipeline",
      "Cloud project sync and state persistence",
      "Unified credit wallet across all tools"
    ],
    content: [
      "**Welcome to That's A Wrap** — the all-in-one AI-native filmmaking studio designed for directors, screenwriters, and digital visual storytellers.",
      "**Standard Production Pipeline:**",
      "**1. Create a Project** — Head to your Dashboard and click **+ New Project**. This sets up your production workspace.",
      "**2. Write Your Script** — In the **Script Editor** (/script), outline scene sluglines or let AI generate scene continuations and dialogue.",
      "**3. Director AI Breakdown** — Run **Director AI** (/director) on your scenes to automatically produce shot lists with camera angles, motion, and framing.",
      "**4. Character Bible** — Define visual reference profiles in **Character Bible** (/characters) for consistent AI generation across scenes.",
      "**5. Storyboard Frames** — Generate visual thumbnail keyframes in **Storyboard** (/storyboard) to lock down visual continuity.",
      "**6. AI Video Generation** — Generate cinematic video clips in **AI Studio** (/ai-studio) powered by Luma Dream Machine & Veo models.",
      "**7. Audio & Music** — Compose original score tracks in **AI Music** (/music).",
      "**8. Timeline Video Editor** — Assemble video clips, dialogue, music, and sound effects in the **Video Editor** (/editor), then export your high-definition MP4 directly in your browser."
    ]
  },
  {
    id: "script-editor",
    category: "pre-production",
    icon: FileText,
    title: "Script Editor & AI Assistant",
    summary: "Professional screenplay editor with auto-formatting sluglines, dialogue layout, and AI scene expansion.",
    route: "/script",
    creditCost: "Free (AI Suggestions vary)",
    samplePrompts: [
      "Continue scene: Cyberpunk detective discovers glowing artifact inside neon alley.",
      "Write dialogue between a weary astronaut and an AI ship companion about returning home.",
      "Add dramatic tension to this confrontation scene with concise action beats."
    ],
    keyFeatures: [
      "Auto-formatted screenplay layout (Sluglines INT./EXT., Character, Parentheticals, Dialogue)",
      "Real-time AI Suggestion engine with typewriter generation",
      "Cloud auto-save with last-saved timestamp indicator"
    ],
    content: [
      "The **Script Editor** provides a focused, professional screenplay writing environment optimized for Industry-standard formatting.",
      "**Formatting Controls:**",
      "• **Sluglines** — Type 'INT.' or 'EXT.' to begin a scene heading. The editor automatically recognizes location and time-of-day blocks.",
      "• **Character & Dialogue** — Enter character names in uppercase to align dialogue centered under the character header.",
      "• **Action Lines** — Write scene descriptions with concise, visual present-tense language for optimal downstream AI interpretation.",
      "**AI Assist Engine:**",
      "Click the ✨ **AI Suggest** button at any point. You can ask the AI to expand a scene, rewrite dialogue for tone, generate action beats, or overcome writer's block.",
      "**Auto-Save:** All script edits save automatically to Firestore in real time. Look for the 'Saved to cloud' badge at the top right."
    ]
  },
  {
    id: "director-ai",
    category: "ai-generation",
    icon: Clapperboard,
    title: "Director AI — Automatic Shot Breakdown",
    summary: "AI Co-Director that transforms natural language prompts or script scenes into structured production shot lists.",
    route: "/director",
    creditCost: "1-2 credits per scene breakdown",
    samplePrompts: [
      "Create a dramatic noir opening sequence: Rain-slicked city streets, moody streetlights, protagonist in trench coat.",
      "Generate an intense sci-fi dogfight shot list inside an asteroid field with dynamic camera moves.",
      "Atmospheric slow-burn suspense scene in an abandoned Victorian mansion at twilight."
    ],
    keyFeatures: [
      "Automatic camera angle & shot type categorization",
      "Motion intensity parameters (0-100)",
      "Ready-to-render AI prompts generated for every shot"
    ],
    content: [
      "**Director AI** acts as your AI assistant director, bridging the gap between narrative scriptwriting and camera execution.",
      "**How It Works:**",
      "1. Select an existing scene from your script or enter a free-form directorial prompt.",
      "2. Click **Generate Shot Breakdown**.",
      "3. Director AI analyzes atmospheric mood, character positioning, pacing, and visual style.",
      "4. It outputs structured shots with attributes: **Shot Type** (Wide, Medium, Close-Up, ECU), **Camera Angle** (Eye-Level, Low Angle, High Angle, Dutch Angle, Tracking, Drone), **Duration**, and an optimized AI render prompt.",
      "**Scene-Shot Linking:** Generated shots are linked directly to your active project and populate your **Shot List** (/shots) automatically."
    ]
  },
  {
    id: "shot-list",
    category: "pre-production",
    icon: ListChecks,
    title: "Shot List & Production Matrix",
    summary: "Production-ready table to organize, reorder, filter, and track status across all project shots.",
    route: "/shots",
    creditCost: "Free tool",
    keyFeatures: [
      "Drag-and-drop shot reordering within scenes",
      "Status tracking matrix (Draft, Rendering, Complete)",
      "CSV & PDF production export capabilities"
    ],
    content: [
      "The **Shot List** page organizes every camera angle in your project into a clean, actionable matrix for production tracking.",
      "**Key Workflow Capabilities:**",
      "• **Drag & Drop** — Hover over the ⠿ handle on any shot row and drag it to reorder sequence timing.",
      "• **Status Toggles** — Click the status pill to mark shots as Draft, Rendering, or Completed.",
      "• **Filter & Group** — Group shots by Scene ID or filter by camera angle to plan batch renders efficiently.",
      "• **Exporting** — Click **Export Shot List** to download a CSV matrix for your crew or production notes."
    ]
  },
  {
    id: "character-bible",
    category: "pre-production",
    icon: Users,
    title: "Character Bible & Visual Consistency",
    summary: "Maintain visual character consistency across storyboards and video renders.",
    route: "/characters",
    creditCost: "Free to manage (Image generation 2 credits)",
    samplePrompts: [
      "Cyberpunk hacker, mid-30s, short dark undercut, neon blue jacket, sharp facial features, cinematic studio lighting.",
      "19th century Victorian detective, mutton chops, tweed coat, silver pocket watch, stoic expression."
    ],
    keyFeatures: [
      "Detailed character profiles (Appearance, Wardrobe, Bio, Personality)",
      "Visual reference card generation",
      "Cross-scene prompt tag injection for image & video continuity"
    ],
    content: [
      "The **Character Bible** (/characters) solves one of AI filmmaking's biggest challenges: maintaining consistent character appearances.",
      "**How to Use:**",
      "1. Click **+ Add Character** and enter character name, role, age, physical traits, and signature wardrobe.",
      "2. Click **Generate Character Portrait** to lock in a visual reference image.",
      "3. When generating storyboards or videos, Director AI will inject your character's visual tags into rendering prompts to preserve facial and costume consistency."
    ]
  },
  {
    id: "storyboard",
    category: "ai-generation",
    icon: Image,
    title: "Storyboard — Keyframe Image Generation",
    summary: "Visual storyboard grid generating high-definition cinematic keyframes for every shot.",
    route: "/storyboard",
    creditCost: "2 credits per image frame",
    samplePrompts: [
      "Cinematic 35mm film shot of a lone astronaut standing on a crimson alien ridge at sunset, volumetric dust, warm golden light.",
      "Anamorphic lens framing of a retro diner at 2 AM, neon reflections on wet asphalt, moody atmosphere."
    ],
    keyFeatures: [
      "2K cinematic image generation",
      "Grid & list storyboard views",
      "One-click prompt editing and thumbnail regeneration"
    ],
    content: [
      "The **Storyboard** (/storyboard) gives you a visual pre-visualization layout of your entire film before committing to video generation.",
      "**Workflow:**",
      "1. Browse through shots organized by scene.",
      "2. Click **Generate Keyframe** on any shot card.",
      "3. The AI generates a photorealistic, cinematically framed 16:9 image based on the shot description.",
      "4. Review visual pacing across the grid, adjust prompts if needed, and re-generate individual frames."
    ]
  },
  {
    id: "ai-studio",
    category: "ai-generation",
    icon: Video,
    title: "AI Studio — Video Generation (Veo3 & Luma)",
    summary: "Generate realistic moving video clips with precise camera motions, shot framing, and motion controls.",
    route: "/ai-studio",
    creditCost: "10 credits per video clip",
    samplePrompts: [
      "Cinematic slow motion tracking shot following a hero running through a misty neon marketplace, realistic cloth physics, rain droplets.",
      "Low angle drone camera rising over a dramatic mountain ridge revealing a hidden golden temple at dawn."
    ],
    keyFeatures: [
      "Luma Dream Machine & Veo3 video generation engines",
      "Camera motion controls (Pan, Zoom, Tilt, Orbit, Roll)",
      "Real-time status tracker (Queued → Dreaming → Complete)"
    ],
    content: [
      "The **AI Studio** (/ai-studio) powers state-of-the-art text-to-video and image-to-video generation.",
      "**Step-by-Step Guide:**",
      "1. **Input Prompt** — Type a detailed visual prompt describing motion, lighting, subject, and atmosphere.",
      "2. **Camera Settings** — Select shot framing (Wide, Medium, Close-up) and camera angle (Low Angle, Dutch, Tracking, Eye-Level).",
      "3. **Motion Intensity** — Adjust the Motion slider (0 = subtle motion, 100 = dynamic high-action camera push).",
      "4. **Generation & Status** — Click **Generate Video** (10 credits). A live status card tracks your generation in real time with an elapsed timer.",
      "5. Once complete, the video clip is saved directly to your project library and loaded into your timeline editor."
    ]
  },
  {
    id: "video-editor",
    category: "post-production",
    icon: Film,
    title: "Multi-Track Video Editor & Browser MP4 Export",
    summary: "Non-destructive timeline video editor with multi-track audio/video mixing and in-browser FFmpeg rendering.",
    route: "/editor",
    creditCost: "Free rendering & export",
    keyFeatures: [
      "Multi-track timeline: V1 Primary Video, V2 B-Roll, Dialog, Score, Sound FX",
      "Clip drag-and-drop, playhead scrubbing, edge trimming",
      "In-browser FFmpeg.wasm MP4 export — no external rendering server needed"
    ],
    content: [
      "The **Video Editor** (/editor) is a full-featured browser timeline editor for editing your generated video clips into a polished film.",
      "**Timeline Architecture:**",
      "• **V1 (Primary Video)** — Main narrative video clips ordered by scene and shot number.",
      "• **V2 (B-Roll & Overlay)** — Cutaway shots, visual effects overlays, or titles.",
      "• **A1 (Dialog)** — Voiceovers, character dialogue tracks, or AI speech clips.",
      "• **A2 (Score)** — Background music tracks generated via AI Music.",
      "• **A3 (Sound FX)** — Atmospheric sound effects and Foley audio.",
      "**In-Browser MP4 Export Engine:**",
      "When you click **Export Video**, the editor uses **ffmpeg.wasm** to compile your film locally in your browser:",
      "1. *Core Engine Init* — Loads WebAssembly FFmpeg core into browser memory.",
      "2. *Clip Download* — Fetches video and audio assets into virtual filesystem.",
      "3. *Concatenation & Re-encoding* — Combines clips according to timeline trim points and syncs audio tracks.",
      "4. *MP4 Download* — Generates a downloadable MP4 file directly on your machine."
    ]
  },
  {
    id: "ai-music",
    category: "ai-generation",
    icon: Music,
    title: "AI Music & Soundtrack Generator",
    summary: "Compose custom cinematic soundtracks, ambient scores, and genre-specific music tracks.",
    route: "/music",
    creditCost: "3 credits per track",
    samplePrompts: [
      "Tense orchestral thriller score with dark cellos, subtle synth pulses, accelerating tempo.",
      "Warm acoustic folk soundtrack with soft piano and ambient golden hour atmosphere.",
      "Cyberpunk synthwave track with heavy basslines and retro 80s arpeggiators."
    ],
    keyFeatures: [
      "Mood, tempo, duration, and genre tag controls",
      "High-fidelity stereo audio synthesis",
      "One-click send to Video Editor Score track"
    ],
    content: [
      "**AI Music** (/music) lets you compose original scores tailored specifically to the emotional beats of your film.",
      "**How to Compose:**",
      "1. Describe the mood or genre in the prompt field.",
      "2. Choose duration (15s, 30s, 60s) and tempo guidance (Slow, Medium, Fast).",
      "3. Click **Generate Track** (3 credits).",
      "4. Preview audio waveform playback, download MP3/WAV, or click **Add to Timeline** to drop the track straight into your active video project's score layer."
    ]
  },
  {
    id: "festival",
    category: "community",
    icon: Trophy,
    title: "Golden Hour Indie Fest & Voting",
    summary: "In-app film competition where directors submit shots, compete across 6 awards, and earn community votes.",
    route: "/festival",
    creditCost: "Free submission & voting",
    keyFeatures: [
      "6 Competition Categories (Best Overall, Cinematography, VFX, Short, Editing, Art Direction)",
      "Daily limit of 5 community votes per account",
      "Fullscreen Lightbox Cinema with keyboard navigation (← / →)",
      "Live Director Leaderboard"
    ],
    content: [
      "The **Golden Hour Indie Fest** (/festival) is the built-in community film competition inside That's A Wrap.",
      "**Submission Steps:**",
      "1. In the Video Editor or Export modal, pick any rendered shot or video clip.",
      "2. Toggle **Submit to Golden Hour Indie Fest**.",
      "3. Select your award category and click **Export & Submit**.",
      "**Browsing & Voting:**",
      "Visit **/festival** to watch entries in a cinema-grade Lightbox viewer. Every user gets **5 votes every 24 hours**. Vote for your favorite films to propel directors up the global leaderboard!"
    ]
  },
  {
    id: "credits-billing",
    category: "platform",
    icon: CreditCard,
    title: "Credits System & Subscription Plans",
    summary: "Transparent overview of credit costs, plan tiers, and account balance management.",
    route: "/settings",
    keyFeatures: [
      "Live top-bar credit balance display",
      "Clear cost breakdown per AI tool",
      "Detailed usage transaction history in Settings"
    ],
    content: [
      "That's A Wrap operates on a straightforward **Credit System** so you only pay for the AI compute you use.",
      "**Credit Cost Reference Table:**",
      "• **Storyboard Frame Generation** — 2 credits / image",
      "• **AI Music Soundtrack Generation** — 3 credits / track",
      "• **AI Video Generation (Luma / Veo3)** — 10 credits / video clip",
      "• **Director AI & Script AI** — 1 to 2 credits per breakdown",
      "• **Free Actions** — Writing scripts, editing timelines, reordering shot lists, character bible profiles, and MP4 exports are **100% free**.",
      "**Subscription Tiers:**",
      "• **Free Tier** — Monthly complimentary credits to explore all studio tools.",
      "• **Pro Plan** — Expanded monthly credit allowance, priority rendering queue, high-res exports.",
      "• **Studio Plan** — Maximum monthly credit pool, custom branding options, unlimited festival entries."
    ]
  },
  {
    id: "contact-support",
    category: "platform",
    icon: Mail,
    title: "Direct Support & Contact Form",
    summary: "Submit inquiries directly to support desk with target email deliverability to help@aifilmz.app.",
    route: "/contact",
    keyFeatures: [
      "Direct form submissions routed to help@aifilmz.app",
      "Firestore ticket logging with priority levels",
      "One-click contact email clipboard copy"
    ],
    content: [
      "Need assistance with your account, billing, or technical features? You can contact us directly at any time.",
      "**Contact Channels:**",
      "• **Contact Form** — Visit **/contact** to send a structured inquiry. Submissions are stored securely in Firestore and delivered to **help@aifilmz.app**.",
      "• **Help Desk AI Chat** — Visit **/help** to chat with our 24/7 AI Support Assistant for instant answers.",
      "• **Bug Reporter** — Click the floating **Report a Bug** button at the bottom right of your Dashboard to flag issues instantly."
    ]
  }
];

/* ── Main Wiki Component ─────────────────────────────────────────────── */

const Learn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(promptText);
    toast({
      title: "Prompt Copied!",
      description: "Sample prompt copied to clipboard.",
    });
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const filteredGuides = wikiGuides.filter((guide) => {
    const matchesCategory = activeCategory === "all" || guide.category === activeCategory;
    if (!searchQuery.trim()) return matchesCategory;

    const q = searchQuery.toLowerCase();
    const matchesQuery =
      guide.title.toLowerCase().includes(q) ||
      guide.summary.toLowerCase().includes(q) ||
      guide.keyFeatures.some((f) => f.toLowerCase().includes(q)) ||
      guide.content.some((c) => c.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header Hero Banner */}
        <div className="neo-card rounded-2xl p-6 sm:p-8 border border-border relative overflow-hidden bg-gradient-to-r from-background via-card to-background">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <BookOpen className="w-3.5 h-3.5" />
                <span>That's A Wrap Studio Wiki</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                Complete Tool & Feature Guide
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Explore comprehensive tutorials, prompt examples, credit breakdowns, and step-by-step instructions for every tool in the studio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="default"
                className="gap-2 bg-primary hover:bg-primary/90 font-semibold text-xs sm:text-sm"
                onClick={() => navigate("/contact")}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
                onClick={() => navigate("/faq")}
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>FAQ</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tools, guides, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border text-sm"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Jump Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {wikiGuides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => {
                  setActiveSection(activeSection === guide.id ? null : guide.id);
                  setSearchQuery("");
                  setTimeout(() => {
                    document.getElementById(`guide-${guide.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  activeSection === guide.id
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-card/60 text-muted-foreground border-border hover:bg-card hover:text-foreground"
                }`}
              >
                <guide.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{guide.title.split(" — ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guides Accordion List */}
        <div className="space-y-4">
          {filteredGuides.length === 0 && (
            <div className="neo-card rounded-2xl p-12 text-center text-muted-foreground space-y-3">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-base text-foreground">No matching wiki entries found</p>
              <p className="text-xs">Try adjusting your search terms or selecting 'All Topics'.</p>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Clear Filters
              </Button>
            </div>
          )}

          {filteredGuides.map((guide, index) => {
            const isOpen = activeSection === guide.id || !!searchQuery.trim();

            return (
              <motion.div
                key={guide.id}
                id={`guide-${guide.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="neo-card rounded-2xl overflow-hidden border border-border bg-card/80 backdrop-blur-sm"
              >
                {/* Guide Accordion Header */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                     onClick={() => setActiveSection(isOpen && !searchQuery ? null : guide.id)}>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                      <guide.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display font-semibold text-base sm:text-lg text-foreground">
                          {guide.title}
                        </h2>
                        {guide.creditCost && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                            {guide.creditCost}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {guide.route && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs gap-1.5 h-8 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(guide.route!);
                        }}
                      >
                        <span>Open Tool</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-primary" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Guide Accordion Content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5 sm:p-6 space-y-6 bg-card/40">
                        {/* Key Features Bullet Cards */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Key Capabilities</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {guide.keyFeatures.map((feature, fi) => (
                              <div key={fi} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Markdown Content Paragraphs */}
                        <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {guide.content.map((paragraph, pi) => (
                            <div
                              key={pi}
                              className="whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: paragraph
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em class="text-primary/90 font-normal">$1</em>')
                                  .replace(/• /g, '<span class="text-primary font-bold mr-1">•</span>')
                              }}
                            />
                          ))}
                        </div>

                        {/* Sample Prompts Box if available */}
                        {guide.samplePrompts && guide.samplePrompts.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Recommended Prompts to Try</span>
                            </h3>
                            <div className="space-y-2">
                              {guide.samplePrompts.map((promptText, pri) => (
                                <div
                                  key={pri}
                                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 text-xs font-mono text-foreground"
                                >
                                  <span className="truncate">"{promptText}"</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopyPrompt(promptText)}
                                    title="Copy prompt"
                                  >
                                    {copiedPrompt === promptText ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Action Link */}
                        {guide.route && (
                          <div className="pt-2 flex justify-end">
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5"
                              onClick={() => navigate(guide.route!)}
                            >
                              <span>Launch {guide.title.split(" — ")[0]}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Support Banner */}
        <div className="neo-card rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-border bg-card">
          <h2 className="font-display font-bold text-lg sm:text-xl text-foreground">
            Need Personal Technical Assistance?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Our team is available to assist you. Submit an inquiry through our Contact Form or chat with our automated AI support assistant.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              variant="default"
              onClick={() => navigate("/contact")}
              className="gap-2 bg-primary hover:bg-primary/90 font-semibold text-xs sm:text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Form (help@aifilmz.app)</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/help")}
              className="gap-2 text-xs sm:text-sm"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>AI Help Desk Chat</span>
            </Button>
          </div>
        </div>

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <Button
            variant="glow"
            size="icon"
            className="fixed bottom-20 right-6 z-50 rounded-full shadow-lg"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default Learn;
