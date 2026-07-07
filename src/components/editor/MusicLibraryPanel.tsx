import { useState, useRef } from "react";
import { Music, Play, Pause, Plus, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { useMusicLibrary, MusicLibraryTrack } from "@/hooks/useMusicLibrary";
import { Badge } from "@/components/ui/badge";
import { FRAME_RATE } from "./types";

interface MusicLibraryPanelProps {
  onAddToTimeline: (track: MusicLibraryTrack, durationFrames: number) => void;
}

const MusicLibraryPanel = ({ onAddToTimeline }: MusicLibraryPanelProps) => {
  const { tracks } = useMusicLibrary();
  const [expanded, setExpanded] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dragTrackId, setDragTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (track: MusicLibraryTrack) => {
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

  const handleDragStart = (e: React.DragEvent, track: MusicLibraryTrack) => {
    setDragTrackId(track.id);
    e.dataTransfer.setData("application/x-music-track", JSON.stringify(track));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => setDragTrackId(null);

  if (tracks.length === 0) return null;

  return (
    <div className="border-t border-[var(--neo-border)] bg-secondary/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Music className="w-3 h-3" />
        <span className="font-medium">Music Library</span>
        <Badge variant="secondary" className="text-[9px] ml-auto">{tracks.length}</Badge>
      </button>

      {expanded && (
        <div className="max-h-32 overflow-y-auto px-2 pb-2 space-y-1">
          {tracks.map((track) => (
            <div
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, track)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all cursor-grab active:cursor-grabbing ${
                dragTrackId === track.id
                  ? "border-primary bg-primary/10 opacity-70"
                  : "border-transparent hover:border-[var(--neo-border)] hover:bg-secondary/20"
              }`}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              <button
                onClick={() => togglePlay(track)}
                className="w-6 h-6 rounded-full bg-[var(--neon-purple-10)] flex items-center justify-center shrink-0"
              >
                {playingId === track.id ? (
                  <Pause className="w-2.5 h-2.5 text-[var(--neon-purple)]" />
                ) : (
                  <Play className="w-2.5 h-2.5 text-[var(--neon-purple)] ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{track.name}</p>
                <p className="text-[9px] text-muted-foreground">{track.genre} · {track.duration}</p>
              </div>
              <button
                onClick={() => onAddToTimeline(track, track.durationSeconds * FRAME_RATE)}
                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
                title="Add to timeline"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicLibraryPanel;
