import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ArrowUp, ChevronRight, LayoutDashboard, FileText, ListChecks,
  Image, Video, Film, Music, Clapperboard, Settings, BarChart3, Search,
  Zap, HelpCircle, Sparkles, CreditCard, Shield, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";

/* ── Wiki Section Data ─────────────────────────────────────── */

interface WikiSection {
  id: string;
  icon: React.ElementType;
  title: string;
  content: string[];
}

const wikiSections: WikiSection[] = [
  {
    id: "getting-started",
    icon: Zap,
    title: "Getting Started",
    content: [
      "**Welcome to That's A Wrap** — your AI-native filmmaking studio. This guide covers every feature so you can go from script to screen.",
      "**1. Sign up / Log in** — Create an account with your email. You'll receive a verification link before you can access the studio.",
      "**2. Create a Project** — From the Dashboard, click **+ New Project**. Give it a title and optional description. Every project is your central hub for a single film or video.",
      "**3. Navigate** — Use the sidebar on the left to jump between tools: Script Editor, Director AI, Shot List, Storyboard, AI Studio, Video Editor, AI Music, and more. On mobile, tap the ☰ hamburger menu.",
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    content: [
      "The **Dashboard** is your home base. It shows all your projects as cards with status badges (Draft, In Progress, Complete).",
      "**Create a project** — Click the glowing **+ New Project** button. Fill in a title, optional description, and hit Create.",
      "**Open a project** — Click any project card to set it as your active project. All other tools (Script, Shot List, etc.) will operate on the active project.",
      "**Credits display** — Your current credit balance is always visible in the top bar so you can plan your AI generations.",
    ],
  },
  {
    id: "script-editor",
    icon: FileText,
    title: "Script Editor",
    content: [
      "The **Script Editor** is a distraction-free writing environment with AI assistance built in.",
      "**Writing** — Type your screenplay directly. The editor auto-formats standard screenplay elements: Sluglines (INT./EXT.), Action, Character names, and Dialogue.",
      "**AI Assist** — Click the ✨ **AI Suggest** button to get AI-powered scene suggestions, dialogue rewrites, or story continuations. Suggestions appear with a typewriter effect.",
      "**Saving** — Your script auto-saves to the cloud. The last-saved timestamp is shown at the top.",
      "**Tip:** Write a rough outline first, then use AI Assist to flesh out individual scenes.",
    ],
  },
  {
    id: "director-ai",
    icon: Clapperboard,
    title: "Director AI",
    content: [
      "**Director AI** is your intelligent co-director. Describe what you want to shoot and it generates a complete shot breakdown.",
      "**How to use:** Type a natural-language prompt like *\"Create an eerie night shot of a desert\"* and click **Generate**.",
      "**What it creates:**\n- A **Scene** (with slugline and summary)\n- One or more **Shots** (with shot type, camera angle, description, motion intensity, and a ready-to-render prompt)",
      "**Scene hierarchy:** Shots are organized under Scenes, which belong to your active project's Script. You can view the results on the Shot List page.",
      "**Credits:** Each Director AI generation costs credits. Your balance is shown in the top bar.",
    ],
  },
  {
    id: "shot-list",
    icon: ListChecks,
    title: "Shot List",
    content: [
      "The **Shot List** page displays every shot across all scenes in your project, organized in a production-ready table.",
      "**Columns:** Shot Code, Scene #, Description, Type, Angle, Duration, and Status (draft / rendering / complete).",
      "**Drag & Drop** — Grab the ⠿ grip handle on any row to reorder shots within a scene. The new order is saved automatically.",
      "**Mark complete** — Click the circle icon to toggle a shot's completion status. Completed shots show a green checkmark.",
      "**Filtering** — Shots are grouped by scene. Expand or collapse scene groups to focus on what matters.",
    ],
  },
  {
    id: "storyboard",
    icon: Image,
    title: "Storyboard",
    content: [
      "The **Storyboard** page gives you a visual grid of your shots with AI-generated thumbnail images.",
      "**Generating images** — Select a shot and click **Generate Thumbnail**. The AI creates a cinematic frame based on the shot's description and prompt. Each image costs **2 credits**.",
      "**Layout** — Thumbnails are displayed in a responsive grid, arranged by scene and shot order. Each card shows the shot code, description, and status.",
      "**Tip:** Use the Storyboard to get a bird's-eye view of your visual flow before moving to video generation.",
    ],
  },
  {
    id: "ai-studio",
    icon: Video,
    title: "AI Studio — Video Generation",
    content: [
      "The **AI Studio** (/ai-studio) is your central hub for AI-powered generation, including video clips via the **Luma Dream Machine** API.",
      "**Workflow:** Select the AI Video tab → enter a cinematic prompt → adjust shot type, camera angle, and motion intensity → click **Generate Video**.",
      "**Parameters:**\n- **Shot Type** — Wide, Medium, Close-up, Extreme Close-up, etc.\n- **Camera Angle** — Eye Level, Low Angle, High Angle, Dutch, Bird's Eye, Worm's Eye\n- **Motion Intensity** — Slider from 0 (static) to 100 (dynamic movement)",
      "**Progress tracking** — Videos go through *queued → dreaming → completed*. A real-time progress indicator shows you exactly where your generation is, with an elapsed time counter.",
      "**Credits** — Video generation costs **10 credits** per clip. Your remaining balance is shown at the top of the page before you generate.",
    ],
  },
  {
    id: "video-editor",
    icon: Film,
    title: "Video Editor",
    content: [
      "The **Video Editor** is a non-destructive, multi-track timeline editor for assembling your generated clips into a finished film.",
      "**Project Selector** — Choose a project from the dropdown at the top. All shots with generated video URLs are automatically loaded onto the timeline as clips, ordered by scene and shot code.",
      "**Tracks** — The timeline includes dedicated tracks for **Video (V1)**, **B-Roll (V2)**, **Dialog**, **Score**, and **Sound Design**, giving you full control over your audio-visual mix.",
      "**Preview Monitor** — A built-in video player shows the active clip under the playhead in real time. Transport controls let you play, pause, stop, skip forward/back, and scrub the timeline.",
      "**Trimming** — Drag clip edges to trim in/out points without destroying the original media.",
      "**MP4 Export** — Click the **Export** button in the transport bar to render your timeline into a single MP4 file. The process runs entirely in your browser using **ffmpeg.wasm** (no server upload needed):\n- *Loading Encoder* — Downloads the FFmpeg WebAssembly core (~30 MB, cached after first use)\n- *Downloading Clips* — Fetches each video source from cloud storage\n- *Encoding MP4* — Concatenates clips with libx264 and produces a faststart-optimized file\n- *Complete* — Click **Download MP4** to save your finished film\n\nA progress modal tracks each stage with a percentage indicator so you always know the status.",
    ],
  },
  {
    id: "ai-music",
    icon: Music,
    title: "AI Music",
    content: [
      "**AI Music** generates original soundtrack and score for your project, costing **3 credits** per generation.",
      "**Describe the mood** — Enter a text prompt describing the musical feel: *\"Tense orchestral build-up with deep bass\"* or *\"Warm acoustic guitar, golden hour vibes\"*.",
      "**Parameters** — Set duration, tempo preference, and genre tags to guide the generation.",
      "**Layering** — Generated tracks can be added to your timeline's Score or Sound Design tracks in the Video Editor for a complete audio-visual experience.",
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    content: [
      "The **Settings** page lets you manage your account and project preferences.",
      "**Profile** — Update your display name, avatar, and bio.",
      "**Theme** — That's A Wrap is dark-mode by default. Theme preferences are saved per device.",
      "**Project settings** — Rename or update the description of your active project.",
      "**Account** — Manage your email, password, and sign-out.",
    ],
  },
  {
    id: "credits",
    icon: CreditCard,
    title: "Credits & Usage",
    content: [
      "That's A Wrap uses a **credit system** to manage AI operations.",
      "**Credit costs:**\n- Storyboard image generation — **2 credits**\n- AI Music generation — **3 credits**\n- AI Video generation (Luma Dream Machine) — **10 credits**\n- Director AI & Script AI suggestions — credits vary",
      "**Checking balance** — Your current credit balance is displayed in the top bar, on the Dashboard, and at the top of the AI Studio page.",
      "**Transaction history** — View a detailed log of all credit-consuming actions in Settings → Usage.",
      "**Free actions** — Browsing, editing text, reordering shots, and viewing the Learn page are always free.",
    ],
  },
  {
    id: "festival",
    icon: Trophy,
    title: "Golden Hour Indie Fest",
    content: [
      "The **Golden Hour Indie Fest** is an in-app film competition where creators submit AI-generated shots and compete for community votes.",
      "**Categories** — Entries are organized into six tracks: **Best Overall**, **Best Cinematography**, **Best VFX**, **Best Short**, **Best Editing**, and **Best Art Direction**. Choose your category when submitting from the Export & Submit modal.",
      "**Submitting** — Open the Export modal, select a shot with a rendered video, toggle 'Submit to Golden Hour Indie Fest', pick a category, and click Export & Submit. Submission is free.",
      "**Browsing & Voting** — Visit **/festival** to see all entries. Use the category pills to filter by track, or search by shot code, description, or director name. Sort by Trending, Recent, or Top Rated.",
      "**Lightbox Viewer** — Click any entry to open a fullscreen cinematic lightbox. Use **← / →** arrow keys (or the on-screen chevrons) to browse entries without closing the viewer. Vote, share, mute/unmute, and toggle fullscreen from the overlay controls.",
      "**Daily Vote Limit** — Each user gets **5 votes per day**. Your remaining votes are displayed at the top of the festival page.",
      "**Leaderboard** — The sidebar shows the **Top 10 Directors** ranked by total votes received across all their submissions.",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics Docs",
    content: [
      "The **Analytics Docs** page documents the event tracking system built into That's A Wrap.",
      "**Page views** — Every page navigation is tracked automatically.",
      "**Custom events** — Key actions (project creation, shot generation, video export) fire analytics events.",
      "**Privacy** — Analytics data is anonymized and used only to improve the platform. No personal data is shared with third parties.",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security & Privacy",
    content: [
      "Your data security is a top priority.",
      "**Authentication** — All accounts are protected with email verification and secure password hashing.",
      "**Row-Level Security** — Every database table uses RLS policies. You can only access your own projects, scripts, shots, and media.",
      "**Edge Functions** — Server-side logic runs in isolated, sandboxed environments. API keys are never exposed to the client.",
      "**Data ownership** — You own all content you create. Projects, scripts, and generated media belong to you.",
    ],
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "FAQ & Tips",
    content: [
      "**Q: How do I start a new film project?**\nA: Go to Dashboard → click **+ New Project** → enter a title → start writing in the Script Editor.",
      "**Q: Can I use Director AI without writing a script first?**\nA: Yes! Director AI works with free-form prompts. It will create scenes and shots directly.",
      "**Q: How do I generate an AI video?**\nA: Go to **AI Studio** (/ai-studio) → select the AI Video tab → enter a prompt → click Generate. You'll see real-time progress as Luma Dream Machine processes your clip.",
      "**Q: What happens if I run out of credits?**\nA: Free actions (editing, browsing, reordering) still work. AI generation features require credits — images (2), music (3), video (10).",
      "**Q: Can I reorder shots?**\nA: Yes — use drag-and-drop on the Shot List page. Grab the grip handle and move shots within a scene.",
      "**Q: Is my work saved automatically?**\nA: Yes. Scripts, shots, and project data auto-save to the cloud. Generated media is stored securely.",
      "**Q: What are the timeline tracks for?**\nA: The Video Editor has separate tracks for Video (V1), B-Roll (V2), Dialog, Score, and Sound Design — giving you full control over your edit's audio-visual layers.",
      "**Q: How does MP4 export work?**\nA: The export runs entirely in your browser using ffmpeg.wasm. Click Export in the Video Editor transport bar — it downloads your clips, concatenates them in sequence, and outputs a single MP4 file. A progress modal shows each stage (Loading → Downloading → Encoding → Complete). No server upload required.",
      "**Q: How do I get help?**\nA: Visit the **Help** page from the sidebar, submit a support ticket, or use the AI-powered chat widget in the bottom-right corner.",
    ],
  },
];

/* ── Component ─────────────────────────────────────────────── */

const Learn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filtered = wikiSections.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gold-blue-shimmer">App Wiki</h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about That's A Wrap
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wiki…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        {/* Quick-jump chips */}
        <div className="flex flex-wrap gap-2">
          {wikiSections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(activeSection === s.id ? null : s.id);
                setSearchQuery("");
                setTimeout(() => {
                  document.getElementById(`wiki-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeSection === s.id
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.title}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="neo-card rounded-xl p-8 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          )}

          {filtered.map((section, i) => {
            const isOpen = activeSection === section.id || !!searchQuery.trim();

            return (
              <motion.div
                key={section.id}
                id={`wiki-${section.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="neo-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveSection(isOpen && !searchQuery ? null : section.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <section.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 font-display font-semibold text-sm">
                    {section.title}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                        {section.content.map((paragraph, pi) => (
                          <div
                            key={pi}
                            className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: paragraph
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="text-primary/80">$1</em>')
                                .replace(/\n/g, "<br />"),
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer nav */}
        <div className="flex flex-col items-center gap-2 pt-4 pb-8">
          <Button variant="outline" size="sm" onClick={() => navigate("/faq")}>
            ❓ View Frequently Asked Questions
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(user ? "/dashboard" : "/")}>
            ← {user ? "Back to Dashboard" : "Back to Home"}
          </Button>
        </div>

        {/* Scroll to top */}
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
