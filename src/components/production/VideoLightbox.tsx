import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Share2, Maximize2, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface VideoLightboxProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string | null;
  thumbnailUrl?: string | null;
  title: string;
  directorName: string;
  directorAvatar?: string | null;
  shotCode?: string;
  shotType?: string;
  votes: number;
  hasVoted: boolean;
  onVote: () => void;
  onShare: () => void;
  votingDisabled?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const VideoLightbox = ({
  open,
  onClose,
  videoUrl,
  thumbnailUrl,
  title,
  directorName,
  directorAvatar,
  shotCode,
  shotType,
  votes,
  hasVoted,
  onVote,
  onShare,
  votingDisabled,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: VideoLightboxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    setControlsVisible(true);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext && hasNext) onNext();
      if (e.key === "ArrowLeft" && onPrev && hasPrev) onPrev();
    };
    window.addEventListener("keydown", onKey);
    scheduleHide();
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hideTimer.current);
    };
  }, [open, onClose, scheduleHide, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [open, videoUrl]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseMove={scheduleHide}
          onTouchStart={scheduleHide}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
            {/* Top bar */}
            <motion.div
              className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-b from-black/70 to-transparent"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {directorAvatar ? (
                    <img src={directorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {directorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                  <p className="text-xs text-white/60">@{directorName}</p>
                </div>
                {shotCode && (
                  <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {shotCode}
                  </span>
                )}
                {shotType && (
                  <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {shotType}
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Video */}
            <div className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain bg-black"
                  controls={false}
                  loop
                  muted={muted}
                  playsInline
                  onClick={() => {
                    if (videoRef.current?.paused) {
                      videoRef.current.play();
                    } else {
                      videoRef.current?.pause();
                    }
                  }}
                />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt={title} className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black text-white/30 text-sm">
                  No video available
                </div>
              )}
            </div>

            {/* Prev / Next arrows */}
            {hasPrev && (
              <motion.button
                onClick={onPrev}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white transition-all active:scale-90"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: controlsVisible ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                aria-label="Previous entry"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            )}
            {hasNext && (
              <motion.button
                onClick={onNext}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white transition-all active:scale-90"
                initial={{ x: 12, opacity: 0 }}
                animate={{ x: 0, opacity: controlsVisible ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                aria-label="Next entry"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}

            {/* Bottom bar */}
            <motion.div
              className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-t from-black/70 to-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                {videoUrl && (
                  <button
                    onClick={() => setMuted((m) => !m)}
                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                {videoUrl && (
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          videoRef.current.requestFullscreen?.();
                        }
                      }
                    }}
                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onShare}
                  className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onVote}
                  disabled={votingDisabled}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                    hasVoted
                      ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "bg-white/10 hover:bg-primary/15 hover:text-primary border-white/10 hover:border-primary/30 text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasVoted ? "fill-current" : ""}`} />
                  <span className="font-mono">{votes.toLocaleString()}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoLightbox;
