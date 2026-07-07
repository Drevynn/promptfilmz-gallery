import { motion, AnimatePresence } from "framer-motion";
import { Terminal, CheckCircle, Loader2, XCircle, FileText, Video, Music, Clapperboard } from "lucide-react";

export interface DirectorLogEvent {
  id: string;
  name: string;
  arguments?: Record<string, unknown>;
  status: "pending" | "done" | "error";
  result?: string;
  data?: unknown;
}

const toolIcons: Record<string, typeof FileText> = {
  update_script: FileText,
  generate_video_clip: Video,
  set_music_mood: Music,
};

const toolLabels: Record<string, string> = {
  update_script: "Script Dept",
  generate_video_clip: "VFX Dept",
  set_music_mood: "Music Dept",
};

const toolColors: Record<string, string> = {
  update_script: "var(--neon-cyan)",
  generate_video_clip: "var(--neon-pink)",
  set_music_mood: "var(--neon-purple)",
};

interface DirectorsLogProps {
  events: DirectorLogEvent[];
}

const DirectorsLog = ({ events }: DirectorsLogProps) => {
  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card rounded-xl p-3 border border-border/50"
      style={{ background: "hsl(var(--card) / 0.8)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-2 mb-2.5 text-muted-foreground">
        <Terminal className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
          Live Crew Feedback
        </span>
      </div>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((ev) => {
            const Icon = toolIcons[ev.name] || Clapperboard;
            const color = toolColors[ev.name] || "var(--neon-cyan)";
            const label = toolLabels[ev.name] || ev.name;

            return (
              <motion.div
                key={ev.id + ev.status}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 font-mono"
              >
                {ev.status === "done" ? (
                  <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--neon-green-raw)" }} />
                ) : ev.status === "error" ? (
                  <XCircle className="w-3 h-3 mt-0.5 shrink-0 text-destructive" />
                ) : (
                  <Loader2 className="w-3 h-3 mt-0.5 shrink-0 animate-spin" style={{ color }} />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {ev.status === "pending"
                      ? "Processing…"
                      : ev.status === "error"
                      ? ev.result || "Failed"
                      : ev.result
                      ? ev.result.length > 80 ? ev.result.slice(0, 80) + "…" : ev.result
                      : "Done"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DirectorsLog;
