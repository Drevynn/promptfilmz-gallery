import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trophy, Film, Play, Share2, Search, Clock, Crown, Flame, TrendingUp, Star, Award, Clapperboard } from "lucide-react";
import { FESTIVAL_CATEGORIES, getCategoryLabel, getCategoryIcon, type FestivalCategory } from "@/lib/festivalCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import VideoLightbox from "@/components/production/VideoLightbox";

interface ContestEntry {
  id: string;
  shot_id: string;
  votes: number;
  created_at: string;
  category: string;
  director_name: string | null;
  director_avatar: string | null;
  shot: {
    description: string;
    shot_type: string;
    scene_number: string;
    shot_code: string;
    thumbnail_url: string | null;
    video_url: string | null;
  } | null;
  hasVoted: boolean;
}

type SortMode = "trending" | "recent" | "top";

const FestivalGallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [lightboxEntry, setLightboxEntry] = useState<ContestEntry | null>(null);
  const [activeCategory, setActiveCategory] = useState<FestivalCategory | "all">("all");

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const prevDiffRef = useRef<number | null>(null);

  const getNextSunday = useCallback(() => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday));
    return next.getTime();
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, getNextSunday() - Date.now());
      if (prevDiffRef.current !== null && prevDiffRef.current > 0 && diff === 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      prevDiffRef.current = diff;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [getNextSunday]);

  const DAILY_VOTE_LIMIT = 5;
  const votesUsedToday = useMemo(() => entries.filter((e) => e.hasVoted).length, [entries]);
  const votesRemaining = Math.max(0, DAILY_VOTE_LIMIT - votesUsedToday);

  const fetchEntries = async () => {
    setLoading(true);
    const { data: contestData, error } = await supabase
      .from("contest_entries_public" as any)
      .select("*")
      .order("votes", { ascending: false });

    if (error) {
      console.error("Error fetching contest entries:", error);
      setLoading(false);
      return;
    }

    let userVotes: Set<string> = new Set();
    if (user) {
      const { data: votes } = await supabase
        .from("contest_votes")
        .select("entry_id")
        .eq("user_id", user.id);
      if (votes) userVotes = new Set(votes.map((v: { entry_id: string }) => v.entry_id));
    }

    const mapped: ContestEntry[] = (contestData || []).map((e: any) => ({
      id: e.id,
      shot_id: e.shot_id,
      votes: e.votes,
      created_at: e.created_at,
      category: e.category || "best_overall",
      director_name: e.director_name,
      director_avatar: e.director_avatar,
      shot: {
        description: e.shot_description,
        shot_type: e.shot_type,
        scene_number: e.shot_scene_number,
        shot_code: e.shot_code,
        thumbnail_url: e.shot_thumbnail_url,
        video_url: e.shot_video_url,
      },
      hasVoted: userVotes.has(e.id),
    }));

    setEntries(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const handleVote = async (entryId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to vote.", variant: "destructive" });
      return;
    }
    const entry = entries.find((e) => e.id === entryId);
    if (entry && !entry.hasVoted && votesRemaining <= 0) {
      toast({ title: "No votes left", description: "You've used all your votes for today.", variant: "destructive" });
      return;
    }
    setVotingId(entryId);
    const { data, error } = await supabase.rpc("toggle_contest_vote", { _entry_id: entryId });
    if (error) {
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
    } else {
      const voted = data as boolean;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, hasVoted: voted, votes: e.votes + (voted ? 1 : -1) }
            : e
        )
      );
      // Keep lightbox in sync
      setLightboxEntry((prev) =>
        prev?.id === entryId
          ? { ...prev, hasVoted: voted, votes: prev.votes + (voted ? 1 : -1) }
          : prev
      );
      toast({ title: voted ? "Voted! 🎬" : "Vote removed" });
    }
    setVotingId(null);
  };

  const sortedEntries = useMemo(() => {
    let filtered = entries;
    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((e) => e.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.shot?.description?.toLowerCase().includes(q) ||
          e.shot?.shot_code?.toLowerCase().includes(q) ||
          e.director_name?.toLowerCase().includes(q)
      );
    }
    const sorted = [...filtered];
    switch (sortMode) {
      case "recent":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "top":
        sorted.sort((a, b) => b.votes - a.votes);
        break;
      case "trending":
      default:
        sorted.sort((a, b) => {
          const ageA = (Date.now() - new Date(a.created_at).getTime()) / 3600000;
          const ageB = (Date.now() - new Date(b.created_at).getTime()) / 3600000;
          return (b.votes / (ageB + 2)) - (a.votes / (ageA + 2));
        });
        break;
    }
    return sorted;
  }, [entries, sortMode, searchQuery, activeCategory]);

  const leaderboard = useMemo(() => {
    const dirMap = new Map<string, { name: string; avatar: string | null; totalVotes: number; entries: number }>();
    entries.forEach((e) => {
      const key = e.director_name || "Anonymous";
      const existing = dirMap.get(key);
      if (existing) {
        existing.totalVotes += e.votes;
        existing.entries += 1;
      } else {
        dirMap.set(key, {
          name: e.director_name || "Anonymous",
          avatar: e.director_avatar || null,
          totalVotes: e.votes,
          entries: 1,
        });
      }
    });
    return Array.from(dirMap.values())
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 10);
  }, [entries]);

  const rankIcons = [Trophy, Award, Star];

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto relative">

        {/* ── Confetti Overlay ── */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {Array.from({ length: 60 }).map((_, i) => {
                const colors = [
                  "hsl(var(--primary))",
                  "hsl(var(--primary) / 0.7)",
                  "hsl(45, 100%, 60%)",
                  "hsl(200, 80%, 60%)",
                  "hsl(340, 80%, 60%)",
                  "hsl(120, 60%, 50%)",
                ];
                const color = colors[i % colors.length];
                const left = Math.random() * 100;
                const delay = Math.random() * 2;
                const duration = 2.5 + Math.random() * 2;
                const size = 6 + Math.random() * 8;
                const rotation = Math.random() * 720 - 360;
                const isCircle = i % 3 === 0;
                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: -20,
                      width: size,
                      height: isCircle ? size : size * 0.6,
                      borderRadius: isCircle ? "50%" : "2px",
                      backgroundColor: color,
                    }}
                    initial={{ y: -20, opacity: 1, rotate: 0 }}
                    animate={{
                      y: "100vh",
                      opacity: [1, 1, 0],
                      rotate: rotation,
                      x: [0, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80],
                    }}
                    transition={{
                      duration,
                      delay,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  />
                );
              })}
              <motion.div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="px-8 py-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                  <Trophy className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-gold-blue-shimmer">Round Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">A new round has begun</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cinematic Festival Header ── */}
        <div className="relative overflow-hidden border-b border-primary/10">
          {/* Layered background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-card to-[#0A0A0A]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary))_0%,transparent_50%)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_left,hsl(200,80%,50%)_0%,transparent_50%)]" />
          {/* Film grain texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />

          <div className="relative px-6 md:px-8 py-8 md:py-10">
            {/* Top row: badge + countdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-semibold">Live Competition</span>
              </motion.div>

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-primary/60 mr-1.5" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-2">Round ends</span>
                {[
                  { label: "D", value: countdown.days },
                  { label: "H", value: countdown.hours },
                  { label: "M", value: countdown.minutes },
                  { label: "S", value: countdown.seconds },
                ].map((unit, idx) => (
                  <div key={unit.label} className="flex items-center">
                    <div className="text-center px-2 py-1.5 rounded-md border border-primary/15 bg-primary/5 backdrop-blur-sm min-w-[36px]">
                      <p className="text-sm font-mono font-bold text-foreground leading-none tabular-nums">
                        {String(unit.value).padStart(2, "0")}
                      </p>
                      <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{unit.label}</p>
                    </div>
                    {idx < 3 && <span className="text-primary/30 font-mono text-xs mx-0.5">:</span>}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Title + CTA row */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Clapperboard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-none">
                      <span className="text-gold-blue-shimmer">Golden Hour</span>
                    </h1>
                    <p className="text-lg md:text-xl font-display text-foreground/80 -mt-0.5">Indie Fest '26</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-md mt-3">
                  Submit your AI-generated shots, compete with fellow filmmakers, and vote for the best cinema every week.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                {/* Vote power indicator */}
                <div className="text-center px-4 py-3 rounded-xl border border-primary/15 bg-primary/5 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {Array.from({ length: DAILY_VOTE_LIMIT }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i < votesRemaining ? "bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.5)]" : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {votesRemaining} vote{votesRemaining !== 1 ? "s" : ""} left
                  </p>
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="gap-2 font-semibold"
                  onClick={() => {
                    toast({ title: "Head to the Video Editor", description: "Export a shot and toggle Festival Submission." });
                  }}
                >
                  <Trophy className="w-4 h-4" />
                  Submit Entry
                </Button>
              </motion.div>
            </div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mt-6 pt-5 border-t border-primary/10"
            >
              {[
                { label: "Entries", value: entries.length, icon: Film },
                { label: "Directors", value: leaderboard.length, icon: Crown },
                { label: "Total Votes", value: entries.reduce((s, e) => s + e.votes, 0), icon: Heart },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-sm font-mono font-bold text-foreground">{value.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Gallery Filters ── */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          {/* Sort + Search row */}
          <div className="flex items-center justify-between gap-4 px-6 md:px-8 py-3">
            <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5">
              {([
                { mode: "trending" as SortMode, icon: Flame, label: "Trending" },
                { mode: "recent" as SortMode, icon: Clock, label: "Recent" },
                { mode: "top" as SortMode, icon: TrendingUp, label: "Top Rated" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    sortMode === mode
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {showSearch && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 200, opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                    <Input
                      placeholder="Search entries…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-sm bg-secondary/30 border-border"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => { setShowSearch((s) => !s); if (showSearch) setSearchQuery(""); }}
                className={`p-2 rounded-lg transition-colors ${
                  showSearch ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category filter row */}
          <div className="flex items-center gap-1.5 px-6 md:px-8 pb-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeCategory === "all"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/20 text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
              }`}
            >
              <Film className="w-3 h-3" />
              All Categories
            </button>
            {FESTIVAL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = entries.filter((e) => e.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat.value
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-secondary/20 text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                  {count > 0 && (
                    <span className="ml-0.5 text-[10px] font-mono opacity-70">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Content + Leaderboard ── */}
        <div className="flex gap-0">
          {/* ── Submission Grid ── */}
          <div className="flex-1 p-6 md:p-8 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="aspect-video bg-secondary/30 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-secondary/30 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-secondary/20 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center mb-5">
                  <Film className="w-10 h-10 text-primary/30" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">
                  {searchQuery ? "No matching entries" : "No entries yet"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? "Try a different search term."
                    : "Submit your best shots from the Video Editor to be the first to enter the festival."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {sortedEntries.map((entry, i) => {
                  const RankIcon = i < 3 ? rankIcons[i] : null;

                  return (
                    <motion.div
                      key={entry.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className={`group relative rounded-xl border overflow-hidden transition-all duration-300 ${
                        i === 0
                          ? "border-primary/30 bg-card shadow-[0_0_30px_hsl(var(--primary)/0.08)]"
                          : "border-border bg-card hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.05)]"
                      }`}
                    >
                      {/* Video Preview */}
                      <div className="aspect-video bg-secondary/20 relative overflow-hidden cursor-pointer" onClick={() => setLightboxEntry(entry)}>
                        {entry.shot?.video_url ? (
                          <video
                            src={entry.shot.video_url}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            muted
                            loop
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => {
                              const v = e.target as HTMLVideoElement;
                              v.pause();
                              v.currentTime = 0;
                            }}
                          />
                        ) : entry.shot?.thumbnail_url ? (
                          <img
                            src={entry.shot.thumbnail_url}
                            alt={entry.shot.description}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-8 h-8 text-muted-foreground/20" />
                          </div>
                        )}

                        {/* Cinematic gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent" />

                        {/* Rank badge */}
                        {RankIcon && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                              i === 0
                                ? "bg-primary/20 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                                : i === 1
                                ? "bg-foreground/10 border-foreground/20"
                                : "bg-foreground/5 border-foreground/15"
                            }`}>
                              <RankIcon className={`w-3.5 h-3.5 ${i === 0 ? "text-primary" : "text-foreground/70"}`} />
                              <span className={`text-xs font-mono font-bold ${i === 0 ? "text-primary" : "text-foreground/70"}`}>#{i + 1}</span>
                            </div>
                          </div>
                        )}

                        {/* Play indicator */}
                        {entry.shot?.video_url && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                            >
                              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                            </motion.div>
                          </div>
                        )}

                        {/* Shot type + category badges */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          {entry.shot?.shot_type && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/70 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10">
                              {entry.shot.shot_type}
                            </span>
                          )}
                          {(() => {
                            const CatIcon = getCategoryIcon(entry.category);
                            return (
                              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary/80 px-2 py-0.5 rounded-md bg-primary/10 backdrop-blur-sm border border-primary/20">
                                <CatIcon className="w-2.5 h-2.5" />
                                {getCategoryLabel(entry.category)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Entry Metadata */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">
                              {entry.shot?.description || "Untitled Shot"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {/* Director avatar */}
                              <div className="w-4 h-4 rounded-full bg-secondary/50 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                {entry.director_avatar ? (
                                  <img src={entry.director_avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[7px] font-bold text-muted-foreground">
                                    {(entry.director_name || "A").charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                @{entry.director_name || "Anonymous"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleVote(entry.id)}
                              disabled={votingId === entry.id}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                                entry.hasVoted
                                  ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
                                  : "bg-secondary/20 hover:bg-primary/10 hover:text-primary border-border hover:border-primary/30 text-muted-foreground"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${entry.hasVoted ? "fill-current" : ""}`} />
                              <span className="font-mono text-xs">{entry.votes.toLocaleString()}</span>
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/festival?entry=${entry.id}`);
                                toast({ title: "Link copied!" });
                              }}
                              className="p-2 bg-secondary/20 hover:bg-secondary/40 rounded-lg border border-border transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ── Leaderboard Sidebar ── */}
          <div className="hidden lg:block w-72 shrink-0 border-l border-border bg-card/30 backdrop-blur-sm">
            <div className="sticky top-[49px] p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Directors</h3>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No entries yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((dir, i) => {
                    const RankIcon = i < 3 ? rankIcons[i] : null;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.04 }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all ${
                          i === 0
                            ? "bg-primary/10 border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.05)]"
                            : "hover:bg-secondary/30"
                        }`}
                      >
                        <span className="w-5 text-center shrink-0">
                          {RankIcon ? (
                            <RankIcon className={`w-3.5 h-3.5 mx-auto ${i === 0 ? "text-primary" : "text-muted-foreground"}`} />
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                          )}
                        </span>
                        <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center border ${
                          i === 0 ? "border-primary/30" : "border-border"
                        } bg-secondary/50`}>
                          {dir.avatar ? (
                            <img src={dir.avatar} alt={dir.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">{dir.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">@{dir.name}</p>
                          <p className="text-[10px] text-muted-foreground">{dir.entries} {dir.entries === 1 ? "entry" : "entries"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Heart className="w-3 h-3 text-primary/60" />
                          <span className="text-xs font-mono font-bold text-primary">{dir.totalVotes.toLocaleString()}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Festival rules mini card */}
              <div className="mt-6 p-3.5 rounded-xl border border-border bg-secondary/10">
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary/80 mb-2">How it works</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5">01</span>
                    <span>Generate & export shots from the Video Editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5">02</span>
                    <span>Toggle "Festival Submission" when exporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5">03</span>
                    <span>Vote for your favorites — {DAILY_VOTE_LIMIT} per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5">04</span>
                    <span>Weekly rounds — top directors earn recognition</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VideoLightbox
        open={!!lightboxEntry}
        onClose={() => setLightboxEntry(null)}
        videoUrl={lightboxEntry?.shot?.video_url ?? null}
        thumbnailUrl={lightboxEntry?.shot?.thumbnail_url}
        title={lightboxEntry?.shot?.description || "Untitled Shot"}
        directorName={lightboxEntry?.director_name || "Anonymous"}
        directorAvatar={lightboxEntry?.director_avatar}
        shotCode={lightboxEntry?.shot?.shot_code}
        shotType={lightboxEntry?.shot?.shot_type}
        votes={lightboxEntry?.votes ?? 0}
        hasVoted={lightboxEntry?.hasVoted ?? false}
        onVote={() => lightboxEntry && handleVote(lightboxEntry.id)}
        onShare={() => {
          if (lightboxEntry) {
            navigator.clipboard.writeText(`${window.location.origin}/festival?entry=${lightboxEntry.id}`);
            toast({ title: "Link copied!" });
          }
        }}
        votingDisabled={votingId === lightboxEntry?.id}
        hasNext={(() => {
          if (!lightboxEntry) return false;
          const idx = sortedEntries.findIndex((e) => e.id === lightboxEntry.id);
          return idx >= 0 && idx < sortedEntries.length - 1;
        })()}
        hasPrev={(() => {
          if (!lightboxEntry) return false;
          const idx = sortedEntries.findIndex((e) => e.id === lightboxEntry.id);
          return idx > 0;
        })()}
        onNext={() => {
          if (!lightboxEntry) return;
          const idx = sortedEntries.findIndex((e) => e.id === lightboxEntry.id);
          if (idx >= 0 && idx < sortedEntries.length - 1) setLightboxEntry(sortedEntries[idx + 1]);
        }}
        onPrev={() => {
          if (!lightboxEntry) return;
          const idx = sortedEntries.findIndex((e) => e.id === lightboxEntry.id);
          if (idx > 0) setLightboxEntry(sortedEntries[idx - 1]);
        }}
      />
    </AppLayout>
  );
};

export default FestivalGallery;
