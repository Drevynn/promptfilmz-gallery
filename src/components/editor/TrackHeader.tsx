import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeOff, Trash2 } from "lucide-react";
import { TimelineTrack, TRACK_HEIGHT } from "./types";

interface TrackHeaderProps {
  track: TimelineTrack;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
}

const TrackHeader = ({ track, onToggleMute, onToggleLock, onToggleVisible, onDelete }: TrackHeaderProps) => {
  const typeColors: Record<string, string> = {
    video: "text-[var(--neon-cyan)]",
    audio: "text-[var(--neon-purple)]",
    title: "text-[var(--neon-pink)]",
  };

  return (
    <div
      className="flex items-center gap-2 px-3 border-b border-[var(--neo-border)] bg-secondary/30 shrink-0"
      style={{ height: TRACK_HEIGHT }}
    >
      <span className={`text-[10px] font-bold uppercase tracking-wider ${typeColors[track.type]}`}>
        {track.name}
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={onToggleVisible} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button onClick={onToggleMute} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {track.muted ? <VolumeOff className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
        <button onClick={onToggleLock} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default TrackHeader;
