import { PIXELS_PER_FRAME, RULER_HEIGHT } from "./types";

interface PlayheadProps {
  currentFrame: number;
  scrollLeft: number;
  timelineHeight: number;
}

const Playhead = ({ currentFrame, scrollLeft, timelineHeight }: PlayheadProps) => {
  const x = currentFrame * PIXELS_PER_FRAME - scrollLeft;

  if (x < 0) return null;

  return (
    <div
      className="absolute top-0 z-40 pointer-events-none"
      style={{ left: x, height: timelineHeight + RULER_HEIGHT }}
    >
      {/* Head triangle */}
      <div className="w-3 h-3 -ml-1.5 bg-primary clip-triangle" />
      {/* Line */}
      <div className="w-px h-full bg-primary mx-auto shadow-[0_0_6px_var(--neon-pink-30)]" />
    </div>
  );
};

export default Playhead;
