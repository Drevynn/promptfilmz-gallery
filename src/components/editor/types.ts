export interface TimelineClip {
  id: string;
  name: string;
  trackId: string;
  startFrame: number;
  durationFrames: number;
  color: string;
  thumbnailUrl?: string;
  type: "video" | "audio" | "title";
  videoUrl?: string;
  audioUrl?: string;
  shotId?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: "video" | "audio" | "title";
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export const FRAME_RATE = 30;
export const PIXELS_PER_FRAME = 4;
export const TRACK_HEIGHT = 56;
export const RULER_HEIGHT = 28;

export const frameToTimecode = (frame: number): string => {
  const totalSeconds = Math.floor(frame / FRAME_RATE);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const f = frame % FRAME_RATE;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
