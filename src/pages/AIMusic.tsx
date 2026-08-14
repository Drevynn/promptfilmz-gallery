import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Music, Play, Pause, Download, Wand2, Clock, RefreshCw, Volume2, Sparkles, Loader2, Square, BookmarkPlus, Check, Share2, ShieldCheck } from "lucide-react";
import { shareFile } from "@/lib/nativeShare";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import PaywallGate from "@/components/PaywallGate";
import { toast } from "sonner";
import { useMusicLibrary } from "@/hooks/useMusicLibrary";
import { SOVRANLY_IP_API } from "@/lib/creativeSovereignty";

const genres = ["Cinematic", "Ambient", "Electronic", "Orchestral", "Lo-Fi", "Suspense", "Action", "Romantic"];
const moods = ["Tense", "Uplifting", "Melancholic", "Mysterious", "Energetic", "Peaceful", "Dark", "Triumphant"];

interface GeneratedTrack {
  id: string;
  name: string;
  genre: string;
  mood: string;
  duration: string;
  bpm: number;
  audioUrl: string;
  prompt: string;
}

const AIMusic = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Cinematic");
  const [selectedMood, setSelectedMood] = useState("Tense");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [bpm, setBpm] = useState(120);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicLibrary = useMusicLibrary();

  const handleRegisterIP = async (track: GeneratedTrack) => {
    try {
      const response = await fetch(`${SOVRANLY_IP_API.BASE_URL}${SOVRANLY_IP_API.endpoints.register}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: track.name,
          prompt: track.prompt,
          metadata: { genre: track.genre, mood: track.mood },
        }),
      });

      if (!response.ok) throw new Error("Registration failed");
      
      setRegisteredIds((prev) => new Set(prev).add(track.id));
      toast.success("Track registered with Sovranly IP!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register IP");
    }
  };

  const buildPrompt = () => {
    const parts = [prompt || "background music"];
    parts.push(`${selectedGenre} genre`);
    parts.push(`${selectedMood.toLowerCase()} mood`);
    parts.push(`${bpm} BPM`);
    return parts.join(", ");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const fullPrompt = buildPrompt();

    try {
      trackEvent("music_generate", { genre: selectedGenre, mood: selectedMood, prompt_length: prompt.length });

      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const { audioBase64 } = await response.json();
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      const newTrack: GeneratedTrack = {
        id: `t-${Date.now()}`,
        name: prompt ? prompt.substring(0, 30) : `${selectedMood} ${selectedGenre}`,
        genre: selectedGenre,
        mood: selectedMood,
        duration: `${Math.floor(selectedDuration / 60)}:${(selectedDuration % 60).toString().padStart(2, "0")}`,
        bpm,
        audioUrl,
        prompt: fullPrompt,
      };

      setTracks((prev) => [newTrack, ...prev]);
      toast.success("Track generated successfully!");
    } catch (error: any) {
      console.error("Music generation error:", error);
      toast.error(error.message || "Failed to generate music");
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = (track: GeneratedTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.audioUrl);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const handleDownload = (track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    a.download = `${track.name.replace(/\s+/g, "_")}.mp3`;
    a.click();
  };

  const handleShare = async (track: GeneratedTrack) => {
    try {
      const filename = `${track.name.replace(/\s+/g, "_")}.mp3`;
      const result = await shareFile({
        url: track.audioUrl,
        filename,
        mimeType: "audio/mpeg",
        title: track.name,
        text: `${track.genre} · ${track.mood} · made with Prompt Filmz`,
      });
      if (result === "download") toast.success("Track downloaded");
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Couldn't open share sheet");
    }
  };

  const handleSaveToLibrary = (track: GeneratedTrack) => {
    musicLibrary.addTrack({
      id: track.id,
      name: track.name,
      genre: track.genre,
      mood: track.mood,
      duration: track.duration,
      durationSeconds: selectedDuration,
      bpm: track.bpm,
      audioUrl: track.audioUrl,
      prompt: track.prompt,
      savedAt: new Date().toISOString(),
    });
    setSavedIds((prev) => new Set(prev).add(track.id));
    toast.success("Saved to Music Library — available in Video Editor");
  };

  return (
    <AppLayout>
      <PaywallGate>
      <div className="p-6 lg:p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-gold-blue-shimmer">AI Music Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate custom soundtracks for your shorts — powered by ElevenLabs</p>
        </motion.div>

        {/* Generator Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neo-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--neon-purple)]" />
            <h2 className="font-display font-semibold">Create a Track</h2>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the music you need... e.g., 'Dark, pulsing electronic beat for a cyberpunk chase scene, building tension with synth layers'"
            className="w-full h-24 p-4 rounded-xl bg-secondary/50 border border-[var(--neo-border)] text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-[var(--neon-purple-30)] focus:shadow-[0_0_15px_var(--neon-purple-10)] transition-all resize-none"
          />

          {/* Genre selection */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Genre</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedGenre === g
                      ? "bg-[var(--neon-purple-10)] text-[var(--neon-purple)] border-[var(--neon-purple-30)] shadow-[0_0_8px_var(--neon-purple-10)]"
                      : "bg-secondary text-muted-foreground border-[var(--neo-border)] hover:border-[var(--neon-purple-30)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood selection */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedMood === m
                      ? "bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] shadow-[0_0_8px_var(--neon-cyan-10)]"
                      : "bg-secondary text-muted-foreground border-[var(--neo-border)] hover:border-[var(--neon-cyan-30)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Generate */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="bg-secondary text-foreground border border-[var(--neo-border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--neon-purple-30)]"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">BPM</p>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-20 bg-secondary text-foreground border border-[var(--neo-border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--neon-purple-30)]"
                />
              </div>
            </div>
            <Button
              variant="glow"
              size="lg"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate Track</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Generated Tracks Library */}
        {tracks.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">Generated Tracks</h2>
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="neo-card rounded-xl p-4 flex items-center gap-4 hover:border-[var(--neon-purple-30)] hover:shadow-[0_0_20px_var(--neon-purple-10)] transition-all group"
                >
                  <button
                    onClick={() => togglePlay(track)}
                    className="w-10 h-10 rounded-full bg-[var(--neon-purple-10)] flex items-center justify-center shrink-0 group-hover:bg-[var(--neon-purple-30)] group-hover:shadow-[0_0_12px_var(--neon-purple-30)] transition-all"
                  >
                    {playingId === track.id ? (
                      <Pause className="w-4 h-4 text-[var(--neon-purple)]" />
                    ) : (
                      <Play className="w-4 h-4 text-[var(--neon-purple)] ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{track.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-[var(--neon-purple-10)] text-[var(--neon-purple)] border-[var(--neon-purple-30)] text-[10px]">{track.genre}</Badge>
                      <Badge className="bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] text-[10px]">{track.mood}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {track.duration}
                    </span>
                    <span className="text-xs text-muted-foreground">{track.bpm} BPM</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRegisterIP(track)}
                      disabled={registeredIds.has(track.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        registeredIds.has(track.id)
                          ? "text-green-500 cursor-default"
                          : "hover:bg-[var(--neon-purple-10)] text-muted-foreground hover:text-foreground"
                      }`}
                      title={registeredIds.has(track.id) ? "Registered with Sovranly IP" : "Register with Sovranly IP"}
                    >
                      {registeredIds.has(track.id) ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSaveToLibrary(track)}
                      disabled={savedIds.has(track.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        savedIds.has(track.id)
                          ? "text-green-400 cursor-default"
                          : "hover:bg-[var(--neon-cyan-10)] text-muted-foreground hover:text-foreground"
                      }`}
                      title={savedIds.has(track.id) ? "Saved to library" : "Save to Music Library"}
                    >
                      {savedIds.has(track.id) ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleShare(track)}
                      className="p-2 rounded-lg hover:bg-[var(--neon-cyan-10)] text-muted-foreground hover:text-foreground transition-colors"
                      title="Share / Export"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(track)}
                      className="p-2 rounded-lg hover:bg-[var(--neon-purple-10)] text-muted-foreground hover:text-foreground transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/50">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tracks generated yet</p>
            <p className="text-xs mt-1">Describe your music above and hit Generate</p>
          </div>
        )}
      </div>
      </PaywallGate>
    </AppLayout>
  );
};

export default AIMusic;
