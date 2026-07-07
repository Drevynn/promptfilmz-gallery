import { Scissors, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TimelineClip } from "./types";
import { frameToTimecode } from "./types";

interface ClipToolbarProps {
  clip: TimelineClip;
  currentFrame: number;
  onSplit: (clipId: string, atFrame: number) => void;
  onDelete: (clipId: string) => void;
  onDuplicate: (clipId: string) => void;
}

const ClipToolbar = ({ clip, currentFrame, onSplit, onDelete, onDuplicate }: ClipToolbarProps) => {
  const playheadInClip =
    currentFrame > clip.startFrame &&
    currentFrame < clip.startFrame + clip.durationFrames;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/60 border border-[var(--neo-border)] backdrop-blur-sm">
        <span className="text-[10px] text-muted-foreground mr-2 truncate max-w-[120px]">
          {clip.name}
        </span>
        <span className="text-[10px] font-mono text-primary/70 mr-2">
          {frameToTimecode(clip.startFrame)} — {frameToTimecode(clip.startFrame + clip.durationFrames)}
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!playheadInClip}
              onClick={() => onSplit(clip.id, currentFrame)}
            >
              <Scissors className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {playheadInClip
              ? `Split at ${frameToTimecode(currentFrame)}`
              : "Move playhead over clip to split"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDuplicate(clip.id)}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Duplicate clip</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(clip.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Delete clip</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ClipToolbar;
