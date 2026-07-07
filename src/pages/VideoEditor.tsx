import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, FolderOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import PaywallGate from "@/components/PaywallGate";
import TransportControls from "@/components/editor/TransportControls";
import TrackHeader from "@/components/editor/TrackHeader";
import TimelineRuler from "@/components/editor/TimelineRuler";
import TimelineClipItem from "@/components/editor/TimelineClipItem";
import Playhead from "@/components/editor/Playhead";
import ExportProgressModal from "@/components/editor/ExportProgressModal";
import ClipToolbar from "@/components/editor/ClipToolbar";
import MusicLibraryPanel from "@/components/editor/MusicLibraryPanel";
import { TimelineTrack, TimelineClip, FRAME_RATE, PIXELS_PER_FRAME, TRACK_HEIGHT, RULER_HEIGHT } from "@/components/editor/types";
import { MusicLibraryTrack } from "@/hooks/useMusicLibrary";
import { useTimelineExport } from "@/hooks/useTimelineExport";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CLIP_COLORS: Record<string, string> = {
  video: "hsla(190, 80%, 40%, 0.8)",
  audio: "hsla(270, 70%, 45%, 0.8)",
  title: "hsla(340, 70%, 45%, 0.8)",
  dialog: "hsla(45, 85%, 50%, 0.8)",
  score: "hsla(270, 70%, 45%, 0.8)",
  sfx: "hsla(160, 70%, 40%, 0.8)",
};

const defaultTracks: TimelineTrack[] = [
  { id: "v1", name: "V1 — Video", type: "video", muted: false, locked: false, visible: true },
  { id: "v2", name: "V2 — B-Roll", type: "video", muted: false, locked: false, visible: true },
  { id: "dialog", name: "Dialog", type: "audio", muted: false, locked: false, visible: true },
  { id: "score", name: "Score", type: "audio", muted: false, locked: false, visible: true },
  { id: "sfx", name: "Sound Design", type: "audio", muted: false, locked: false, visible: true },
];

const demoClips: TimelineClip[] = [
  { id: "c1", name: "Scene 1 — Wide", trackId: "v1", startFrame: 0, durationFrames: 90, color: CLIP_COLORS.video, type: "video" },
  { id: "c2", name: "Scene 1 — CU", trackId: "v1", startFrame: 95, durationFrames: 60, color: CLIP_COLORS.video, type: "video" },
  { id: "c3", name: "B-Roll", trackId: "v2", startFrame: 30, durationFrames: 120, color: "hsla(190, 60%, 50%, 0.7)", type: "video" },
  { id: "c4", name: "Character Dialog", trackId: "dialog", startFrame: 0, durationFrames: 150, color: CLIP_COLORS.dialog, type: "audio" },
  { id: "c5", name: "Main Score", trackId: "score", startFrame: 10, durationFrames: 140, color: CLIP_COLORS.score, type: "audio" },
  { id: "c6", name: "Ambient Room Tone", trackId: "sfx", startFrame: 0, durationFrames: 160, color: CLIP_COLORS.sfx, type: "audio" },
  { id: "c7", name: "Door Slam SFX", trackId: "sfx", startFrame: 85, durationFrames: 15, color: "hsla(160, 50%, 50%, 0.7)", type: "audio" },
];

interface ProjectOption {
  id: string;
  title: string;
}

const VideoEditor = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracks, setTracks] = useState<TimelineTrack[]>(defaultTracks);
  const [clips, setClips] = useState<TimelineClip[]>(demoClips);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Project & shot loading
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingShots, setLoadingShots] = useState(false);

  // Export
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const exportState = useTimelineExport();

  const totalFrames = FRAME_RATE * 30;
  const hasExportableClips = clips.some((c) => (c.type === "video" && c.videoUrl) || (c.type === "audio" && c.audioUrl));

  // Load user's projects
  useEffect(() => {
    if (!user) return;
    const loadProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (data) setProjects(data);
    };
    loadProjects();
  }, [user]);

  // Deep-link: respect ?project=<id> from URL (web links + iOS deep links)
  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam && projectParam !== selectedProjectId) {
      setSelectedProjectId(projectParam);
    }
  }, [searchParams, selectedProjectId]);

  // Keep URL in sync when user changes project via the dropdown
  useEffect(() => {
    const current = searchParams.get("project");
    if (selectedProjectId && current !== selectedProjectId) {
      setSearchParams({ project: selectedProjectId }, { replace: true });
    } else if (!selectedProjectId && current) {
      const next = new URLSearchParams(searchParams);
      next.delete("project");
      setSearchParams(next, { replace: true });
    }
  }, [selectedProjectId, searchParams, setSearchParams]);

  // Load shots when project selected
  useEffect(() => {
    if (!selectedProjectId) {
      setClips(demoClips);
      return;
    }
    const loadShots = async () => {
      setLoadingShots(true);
      const { data, error } = await supabase
        .from("shots")
        .select("id, shot_code, description, scene_number, video_url, thumbnail_url, duration, sort_order")
        .eq("project_id", selectedProjectId)
        .order("sort_order", { ascending: true });

      if (error) {
        toast.error("Failed to load shots");
        setLoadingShots(false);
        return;
      }

      if (data && data.length > 0) {
        let frameOffset = 0;
        const shotClips: TimelineClip[] = data.map((shot) => {
          const durationSec = parseInt(shot.duration || "5", 10) || 5;
          const durationFrames = durationSec * FRAME_RATE;
          const clip: TimelineClip = {
            id: shot.id,
            name: `S${shot.scene_number}-${shot.shot_code} ${shot.description?.slice(0, 30) || ""}`,
            trackId: "v1",
            startFrame: frameOffset,
            durationFrames,
            color: shot.video_url ? CLIP_COLORS.video : "hsla(190, 40%, 30%, 0.5)",
            type: "video",
            videoUrl: shot.video_url || undefined,
            thumbnailUrl: shot.thumbnail_url || undefined,
            shotId: shot.id,
          };
          frameOffset += durationFrames + 5; // 5 frame gap
          return clip;
        });
        setClips(shotClips);
        setCurrentFrame(0);
      } else {
        setClips([]);
      }
      setLoadingShots(false);
    };
    loadShots();
  }, [selectedProjectId]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000 / FRAME_RATE) {
        lastTimeRef.current = now;
        setCurrentFrame((f) => {
          if (f >= totalFrames) { setIsPlaying(false); return totalFrames; }
          return f + 1;
        });
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, totalFrames]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const moveClip = useCallback((clipId: string, newStart: number) => {
    setClips((prev) => prev.map((c) => c.id === clipId ? { ...c, startFrame: newStart } : c));
  }, []);

  const resizeClip = useCallback((clipId: string, newDuration: number, _side: "left" | "right") => {
    setClips((prev) => prev.map((c) => c.id === clipId ? { ...c, durationFrames: newDuration } : c));
  }, []);

  const splitClip = useCallback((clipId: string, atFrame: number) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === clipId);
      if (!clip) return prev;
      const splitPoint = atFrame - clip.startFrame;
      if (splitPoint <= 0 || splitPoint >= clip.durationFrames) return prev;

      const leftClip: TimelineClip = {
        ...clip,
        durationFrames: splitPoint,
      };
      const rightClip: TimelineClip = {
        ...clip,
        id: `${clip.id}-split-${Date.now()}`,
        name: `${clip.name} (2)`,
        startFrame: atFrame,
        durationFrames: clip.durationFrames - splitPoint,
      };
      return prev.map((c) => (c.id === clipId ? leftClip : c)).concat(rightClip);
    });
    toast.success("Clip split at playhead");
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
    setSelectedClip(null);
    toast.success("Clip deleted");
  }, []);

  const duplicateClip = useCallback((clipId: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === clipId);
      if (!clip) return prev;
      const newClip: TimelineClip = {
        ...clip,
        id: `${clip.id}-dup-${Date.now()}`,
        name: `${clip.name} (copy)`,
        startFrame: clip.startFrame + clip.durationFrames + 5,
      };
      return [...prev, newClip];
    });
    toast.success("Clip duplicated");
  }, []);

  const addTrack = (type: "video" | "audio" | "title") => {
    const count = tracks.filter((t) => t.type === type).length + 1;
    const prefix = type === "video" ? "V" : type === "audio" ? "A" : "T";
    setTracks([...tracks, {
      id: `${prefix.toLowerCase()}${Date.now()}`,
      name: `${prefix}${count}`,
      type,
      muted: false,
      locked: false,
      visible: true,
    }]);
  };

  const deleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
  };

  const addMusicToTimeline = useCallback((musicTrack: MusicLibraryTrack, durationFrames: number) => {
    const scoreTrack = tracks.find((t) => t.type === "audio");
    if (!scoreTrack) {
      toast.error("No audio track available. Add one first.");
      return;
    }
    const existingOnTrack = clips.filter((c) => c.trackId === scoreTrack.id);
    const startFrame = existingOnTrack.length > 0
      ? Math.max(...existingOnTrack.map((c) => c.startFrame + c.durationFrames)) + 5
      : 0;

    const newClip: TimelineClip = {
      id: `music-${Date.now()}`,
      name: musicTrack.name,
      trackId: scoreTrack.id,
      startFrame,
      durationFrames,
      color: CLIP_COLORS.score,
      type: "audio",
      audioUrl: musicTrack.audioUrl,
    };
    setClips((prev) => [...prev, newClip]);
    toast.success(`"${musicTrack.name}" added to ${scoreTrack.name}`);
  }, [tracks, clips]);

  const handleTimelineDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/x-music-track");
    if (!data) return;
    try {
      const track: MusicLibraryTrack = JSON.parse(data);
      addMusicToTimeline(track, track.durationSeconds * FRAME_RATE);
    } catch {}
  }, [addMusicToTimeline]);

  const toggleTrackProp = (trackId: string, prop: "muted" | "locked" | "visible") => {
    setTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, [prop]: !t[prop] } : t));
  };

  const handleExport = () => {
    if (!hasExportableClips) {
      toast.error("No video clips with sources. Generate videos in AI Studio first, then load your project here.");
      return;
    }
    setExportModalOpen(true);
    exportState.exportTimeline(clips);
  };

  const timelineHeight = tracks.length * TRACK_HEIGHT;

  // Find active video clip for preview
  const activeVideoClip = clips.find(
    (c) => c.type === "video" && c.videoUrl &&
      currentFrame >= c.startFrame && currentFrame < c.startFrame + c.durationFrames
  );

  return (
    <AppLayout>
      <PaywallGate>
        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Preview Monitor */}
          <div className="flex-1 min-h-0 bg-black flex flex-col">
            {/* Project selector bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border-b border-[var(--neo-border)]">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <Select
                value={selectedProjectId ?? "demo"}
                onValueChange={(v) => setSelectedProjectId(v === "demo" ? null : v)}
              >
                <SelectTrigger className="w-48 h-7 text-xs bg-secondary/30 border-[var(--neo-border)]">
                  <SelectValue placeholder="Select project…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">
                    <span className="text-muted-foreground">Demo Timeline</span>
                  </SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingShots && (
                <span className="text-[10px] text-muted-foreground animate-pulse">Loading shots…</span>
              )}
              {selectedProjectId && !loadingShots && (
                <span className="text-[10px] text-muted-foreground">
                  {clips.filter((c) => c.type === "video").length} video · {clips.filter((c) => c.type === "audio" && c.audioUrl).length} audio
                  {hasExportableClips && " · ready to export"}
                </span>
              )}
            </div>

            {/* Preview area */}
            <div className="flex-1 flex items-center justify-center relative">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex items-center justify-center"
              >
                <div className="aspect-video w-full max-w-2xl mx-auto bg-secondary/10 rounded-lg border border-[var(--neo-border)] flex items-center justify-center overflow-hidden relative">
                  {activeVideoClip?.videoUrl ? (
                    <video
                      key={activeVideoClip.id}
                      src={activeVideoClip.videoUrl}
                      className="w-full h-full object-contain"
                      muted
                      autoPlay
                      loop
                    />
                  ) : (
                    <div className="text-center p-8">
                      <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground/50">Preview Monitor</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-1">
                        {selectedProjectId
                          ? "Move playhead over a clip with video to preview"
                          : "Select a project above or use the demo timeline"}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Timeline Panel */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="border-t border-[var(--neo-border)] bg-background"
          >
            <TransportControls
              isPlaying={isPlaying}
              currentFrame={currentFrame}
              totalFrames={totalFrames}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onStop={() => { setIsPlaying(false); setCurrentFrame(0); }}
              onSkipBack={() => setCurrentFrame((f) => Math.max(0, f - FRAME_RATE * 5))}
              onSkipForward={() => setCurrentFrame((f) => Math.min(totalFrames, f + FRAME_RATE * 5))}
              onAddTrack={addTrack}
              onExport={handleExport}
              canExport={hasExportableClips}
            />

            {/* Clip context toolbar */}
            {selectedClip && clips.find((c) => c.id === selectedClip) && (
              <div className="flex items-center justify-center px-4 py-1.5 border-b border-[var(--neo-border)] bg-secondary/10">
                <ClipToolbar
                  clip={clips.find((c) => c.id === selectedClip)!}
                  currentFrame={currentFrame}
                  onSplit={splitClip}
                  onDelete={deleteClip}
                  onDuplicate={duplicateClip}
                />
              </div>
            )}

            <div className="flex overflow-hidden" style={{ height: timelineHeight + RULER_HEIGHT + 4 }}>
              <div className="w-36 shrink-0 border-r border-[var(--neo-border)]">
                <div style={{ height: RULER_HEIGHT }} className="border-b border-[var(--neo-border)] bg-secondary/10" />
                {tracks.map((track) => (
                  <TrackHeader
                    key={track.id}
                    track={track}
                    onToggleMute={() => toggleTrackProp(track.id, "muted")}
                    onToggleLock={() => toggleTrackProp(track.id, "locked")}
                    onToggleVisible={() => toggleTrackProp(track.id, "visible")}
                    onDelete={() => deleteTrack(track.id)}
                  />
                ))}
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-x-auto overflow-y-hidden relative"
                onScroll={handleScroll}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                onDrop={handleTimelineDrop}
              >
                <div className="sticky top-0 z-30" style={{ width: totalFrames * PIXELS_PER_FRAME }}>
                  <TimelineRuler totalFrames={totalFrames} scrollLeft={0} onSeek={(f) => setCurrentFrame(f)} />
                </div>

                <div className="relative" style={{ width: totalFrames * PIXELS_PER_FRAME, height: timelineHeight }}>
                  {tracks.map((track, i) => (
                    <div
                      key={track.id}
                      className={`absolute w-full border-b border-[var(--neo-border)] ${i % 2 === 0 ? "bg-secondary/5" : "bg-transparent"}`}
                      style={{ top: i * TRACK_HEIGHT, height: TRACK_HEIGHT }}
                    />
                  ))}

                  {clips.map((clip) => {
                    const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
                    if (trackIndex === -1) return null;
                    return (
                      <div key={clip.id} className="absolute" style={{ top: trackIndex * TRACK_HEIGHT }}>
                        <TimelineClipItem
                          clip={clip}
                          onMove={moveClip}
                          onResize={resizeClip}
                          onSelect={setSelectedClip}
                          isSelected={selectedClip === clip.id}
                        />
                      </div>
                    );
                  })}
                </div>

                <Playhead currentFrame={currentFrame} scrollLeft={0} timelineHeight={timelineHeight} />
              </div>
            </div>

            {/* Music Library Panel */}
            <MusicLibraryPanel onAddToTimeline={addMusicToTimeline} />
          </motion.div>
        </div>

        {/* Export Modal */}
        <ExportProgressModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          stage={exportState.stage}
          progress={exportState.progress}
          message={exportState.message}
          downloadUrl={exportState.downloadUrl}
          error={exportState.error}
          onReset={exportState.reset}
        />
      </PaywallGate>
    </AppLayout>
  );
};

export default VideoEditor;
