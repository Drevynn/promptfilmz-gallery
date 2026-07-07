import { Play, Pause, SkipBack, SkipForward, Square, Plus, Film, Music, Type, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { frameToTimecode } from "./types";

interface TransportControlsProps {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onAddTrack: (type: "video" | "audio" | "title") => void;
  onExport?: () => void;
  canExport?: boolean;
}

const TransportControls = ({
  isPlaying, currentFrame, totalFrames,
  onPlay, onPause, onStop, onSkipBack, onSkipForward, onAddTrack,
  onExport, canExport,
}: TransportControlsProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--neo-border)] bg-secondary/20">
      {/* Left: Add tracks */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onAddTrack("video")}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="w-3 h-3" /><Film className="w-3 h-3" /> Video
        </button>
        <button
          onClick={() => onAddTrack("audio")}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="w-3 h-3" /><Music className="w-3 h-3" /> Audio
        </button>
        <button
          onClick={() => onAddTrack("title")}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="w-3 h-3" /><Type className="w-3 h-3" /> Title
        </button>
      </div>

      {/* Center: Transport */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipBack}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStop}>
          <Square className="w-3.5 h-3.5" />
        </Button>
        {isPlaying ? (
          <Button variant="glow" size="icon" className="h-9 w-9" onClick={onPause}>
            <Pause className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="glow" size="icon" className="h-9 w-9" onClick={onPlay}>
            <Play className="w-4 h-4 ml-0.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipForward}>
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Timecode + Export */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-primary tabular-nums">
          {frameToTimecode(currentFrame)}
        </span>
        <span className="text-[10px] text-muted-foreground">/</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {frameToTimecode(totalFrames)}
        </span>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={onExport}
            disabled={!canExport}
          >
            <Download className="w-3 h-3" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
};

export default TransportControls;
