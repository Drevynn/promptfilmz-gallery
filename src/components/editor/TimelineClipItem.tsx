import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { TimelineClip, PIXELS_PER_FRAME, TRACK_HEIGHT } from "./types";

interface TimelineClipItemProps {
  clip: TimelineClip;
  onMove: (clipId: string, newStartFrame: number) => void;
  onResize: (clipId: string, newDuration: number, side: "left" | "right") => void;
  onSelect: (clipId: string) => void;
  isSelected: boolean;
}

const MIN_FRAMES = 10;

const TimelineClipItem = ({ clip, onMove, onResize, onSelect, isSelected }: TimelineClipItemProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeSide, setResizeSide] = useState<"left" | "right" | null>(null);
  const dragStartRef = useRef({ x: 0, startFrame: 0 });
  const resizeStartRef = useRef({ x: 0, startFrame: 0, duration: 0 });

  const width = clip.durationFrames * PIXELS_PER_FRAME;
  const left = clip.startFrame * PIXELS_PER_FRAME;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, startFrame: clip.startFrame };

    const handleDragMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartRef.current.x;
      const dFrames = Math.round(dx / PIXELS_PER_FRAME);
      const newStart = Math.max(0, dragStartRef.current.startFrame + dFrames);
      onMove(clip.id, newStart);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  }, [clip.id, clip.startFrame, onMove, onSelect]);

  const handleResizeStart = useCallback((e: React.MouseEvent, side: "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(clip.id);
    setResizeSide(side);
    resizeStartRef.current = { x: e.clientX, startFrame: clip.startFrame, duration: clip.durationFrames };

    const handleResizeMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeStartRef.current.x;
      const dFrames = Math.round(dx / PIXELS_PER_FRAME);

      if (side === "right") {
        const newDuration = Math.max(MIN_FRAMES, resizeStartRef.current.duration + dFrames);
        onResize(clip.id, newDuration, "right");
      } else {
        // Left trim: move start forward, shrink duration
        const maxTrim = resizeStartRef.current.duration - MIN_FRAMES;
        const trimFrames = Math.min(maxTrim, Math.max(-resizeStartRef.current.startFrame, dFrames));
        const newStart = resizeStartRef.current.startFrame + trimFrames;
        const newDuration = resizeStartRef.current.duration - trimFrames;
        if (newDuration >= MIN_FRAMES && newStart >= 0) {
          onResize(clip.id, newDuration, "left");
          onMove(clip.id, newStart);
        }
      }
    };

    const handleResizeEnd = () => {
      setResizeSide(null);
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  }, [clip.id, clip.startFrame, clip.durationFrames, onResize, onMove, onSelect]);

  const isResizing = resizeSide !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute top-1 group cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border transition-all ${
        isSelected
          ? "border-primary shadow-[0_0_12px_var(--neon-pink-30)] z-20"
          : "border-transparent hover:border-muted-foreground/30 z-10"
      } ${isDragging ? "opacity-80 z-30" : ""}`}
      style={{
        left,
        width: Math.max(width, 20),
        height: TRACK_HEIGHT - 10,
        backgroundColor: clip.color,
      }}
      onMouseDown={handleDragStart}
    >
      {/* Left trim handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 transition-colors ${
          resizeSide === "left" ? "bg-primary/40" : "hover:bg-white/25"
        }`}
        onMouseDown={(e) => handleResizeStart(e, "left")}
      >
        <div className="absolute inset-y-0 left-0.5 w-[2px] rounded-full bg-white/0 group-hover:bg-white/50 transition-colors" />
      </div>

      {/* Grip handle */}
      <div className="absolute left-2 top-0 bottom-0 w-5 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
        <GripVertical className="w-3 h-3 text-white/80" />
      </div>

      {/* Clip content */}
      <div className="px-5 py-1 h-full flex items-center overflow-hidden">
        <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
          {clip.name}
        </span>
      </div>

      {/* Right trim handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 transition-colors ${
          resizeSide === "right" ? "bg-primary/40" : "hover:bg-white/25"
        }`}
        onMouseDown={(e) => handleResizeStart(e, "right")}
      >
        <div className="absolute inset-y-0 right-0.5 w-[2px] rounded-full bg-white/0 group-hover:bg-white/50 transition-colors" />
      </div>

      {/* Waveform/thumbnail decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {clip.type === "audio" && (
          <div className="flex items-center h-full gap-px px-6">
            {Array.from({ length: Math.floor(width / 4) }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] bg-white rounded-full"
                style={{ height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trim indicators when resizing */}
      {isResizing && (
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/60 rounded-lg" />
      )}
    </motion.div>
  );
};

export default TimelineClipItem;
