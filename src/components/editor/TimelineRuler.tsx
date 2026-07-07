import { PIXELS_PER_FRAME, FRAME_RATE, RULER_HEIGHT, frameToTimecode } from "./types";

interface TimelineRulerProps {
  totalFrames: number;
  scrollLeft: number;
  onSeek: (frame: number) => void;
}

const TimelineRuler = ({ totalFrames, scrollLeft, onSeek }: TimelineRulerProps) => {
  const totalWidth = totalFrames * PIXELS_PER_FRAME;
  const marks: { frame: number; label: string; major: boolean }[] = [];

  for (let f = 0; f <= totalFrames; f += FRAME_RATE) {
    const isMajor = f % (FRAME_RATE * 5) === 0;
    if (isMajor) marks.push({ frame: f, label: frameToTimecode(f), major: true });
    else marks.push({ frame: f, label: "", major: false });
  }

  return (
    <div
      className="relative select-none cursor-pointer border-b border-[var(--neo-border)]"
      style={{ height: RULER_HEIGHT, width: totalWidth, marginLeft: -scrollLeft }}
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const frame = Math.round(x / PIXELS_PER_FRAME);
        onSeek(Math.max(0, Math.min(frame, totalFrames)));
      }}
    >
      {marks.map((m) => (
        <div
          key={m.frame}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: m.frame * PIXELS_PER_FRAME }}
        >
          <div
            className={`w-px ${m.major ? "h-3 bg-muted-foreground/60" : "h-2 bg-muted-foreground/20"}`}
          />
          {m.major && (
            <span className="text-[8px] text-muted-foreground/50 font-mono mt-0.5 whitespace-nowrap">
              {m.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TimelineRuler;
