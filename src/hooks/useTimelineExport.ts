import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { TimelineClip } from "@/components/editor/types";
import { FRAME_RATE } from "@/components/editor/types";

export type ExportStage = "idle" | "loading" | "downloading" | "encoding" | "complete" | "error";

interface ExportState {
  stage: ExportStage;
  progress: number;
  message: string;
  downloadUrl: string | null;
  error: string | null;
}

const CORE_VERSION = "0.12.6";
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

export function useTimelineExport() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [state, setState] = useState<ExportState>({
    stage: "idle",
    progress: 0,
    message: "",
    downloadUrl: null,
    error: null,
  });

  const reset = useCallback(() => {
    if (state.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
    setState({ stage: "idle", progress: 0, message: "", downloadUrl: null, error: null });
  }, [state.downloadUrl]);

  const exportTimeline = useCallback(async (clips: TimelineClip[]) => {
    const videoClips = clips
      .filter((c) => c.type === "video" && c.videoUrl)
      .sort((a, b) => a.startFrame - b.startFrame);

    const audioClips = clips
      .filter((c) => c.type === "audio" && c.audioUrl)
      .sort((a, b) => a.startFrame - b.startFrame);

    if (videoClips.length === 0 && audioClips.length === 0) {
      setState((s) => ({ ...s, stage: "error", error: "No video or audio clips with sources found on the timeline." }));
      return;
    }

    try {
      // Stage 1: Load FFmpeg
      setState({ stage: "loading", progress: 0, message: "Loading video encoder…", downloadUrl: null, error: null });

      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        ffmpeg.on("progress", ({ progress }) => {
          setState((s) => {
            if (s.stage === "encoding") {
              return { ...s, progress: Math.min(Math.round(progress * 100), 99), message: `Encoding… ${Math.round(progress * 100)}%` };
            }
            return s;
          });
        });

        const coreURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript");
        const wasmURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm");
        await ffmpeg.load({ coreURL, wasmURL });
        ffmpegRef.current = ffmpeg;
      }

      const ffmpeg = ffmpegRef.current;

      // Stage 2: Download clips
      const totalDownloads = videoClips.length + audioClips.length;
      setState((s) => ({ ...s, stage: "downloading", progress: 0, message: "Downloading clips…" }));

      const videoFileNames: string[] = [];
      for (let i = 0; i < videoClips.length; i++) {
        const pct = Math.round(((i + 1) / totalDownloads) * 100);
        setState((s) => ({ ...s, progress: pct, message: `Downloading video ${i + 1}/${videoClips.length}…` }));
        const fileName = `vid_${i}.mp4`;
        const data = await fetchFile(videoClips[i].videoUrl!);
        await ffmpeg.writeFile(fileName, data);
        videoFileNames.push(fileName);
      }

      const audioFileNames: string[] = [];
      for (let i = 0; i < audioClips.length; i++) {
        const pct = Math.round(((videoClips.length + i + 1) / totalDownloads) * 100);
        setState((s) => ({ ...s, progress: pct, message: `Downloading audio ${i + 1}/${audioClips.length}…` }));
        const fileName = `aud_${i}.mp3`;
        const data = await fetchFile(audioClips[i].audioUrl!);
        await ffmpeg.writeFile(fileName, data);
        audioFileNames.push(fileName);
      }

      // Stage 3: Encode
      setState((s) => ({ ...s, stage: "encoding", progress: 0, message: "Encoding video + audio…" }));

      const hasVideo = videoFileNames.length > 0;
      const hasAudio = audioFileNames.length > 0;

      if (hasVideo && !hasAudio) {
        // Video only — same as before
        if (videoFileNames.length === 1) {
          await ffmpeg.exec(["-i", videoFileNames[0], "-c", "copy", "-movflags", "+faststart", "output.mp4"]);
        } else {
          const inputs = videoFileNames.flatMap((f) => ["-i", f]);
          const filterParts = videoFileNames.map((_, i) => `[${i}:v:0]`).join("");
          const filter = `${filterParts}concat=n=${videoFileNames.length}:v=1:a=0[outv]`;
          await ffmpeg.exec([
            ...inputs,
            "-filter_complex", filter,
            "-map", "[outv]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-movflags", "+faststart",
            "output.mp4",
          ]);
        }
      } else if (!hasVideo && hasAudio) {
        // Audio only — mix all audio tracks into a single mp4 with silent video
        // Generate a 10-second black video as base, then overlay audio
        const totalAudioDuration = Math.max(
          ...audioClips.map((c) => (c.startFrame + c.durationFrames) / FRAME_RATE)
        );
        const inputs = audioFileNames.flatMap((f) => ["-i", f]);

        if (audioFileNames.length === 1) {
          // Single audio — wrap in mp4 container
          await ffmpeg.exec([
            "-f", "lavfi", "-i", `color=c=black:s=1920x1080:d=${totalAudioDuration}:r=30`,
            ...inputs,
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            "output.mp4",
          ]);
        } else {
          const amixInputs = audioFileNames.map((_, i) => `[${i + 1}:a]`).join("");
          const amixFilter = `${amixInputs}amix=inputs=${audioFileNames.length}:duration=longest[outa]`;
          await ffmpeg.exec([
            "-f", "lavfi", "-i", `color=c=black:s=1920x1080:d=${totalAudioDuration}:r=30`,
            ...inputs,
            "-filter_complex", amixFilter,
            "-map", "0:v", "-map", "[outa]",
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            "output.mp4",
          ]);
        }
      } else {
        // Both video and audio — concat video, mix audio, merge together
        // Step 1: Concat videos into intermediate
        const vInputs = videoFileNames.flatMap((f) => ["-i", f]);

        if (videoFileNames.length === 1) {
          await ffmpeg.exec(["-i", videoFileNames[0], "-c", "copy", "intermediate_video.mp4"]);
        } else {
          const vFilterParts = videoFileNames.map((_, i) => `[${i}:v:0]`).join("");
          const vFilter = `${vFilterParts}concat=n=${videoFileNames.length}:v=1:a=0[outv]`;
          await ffmpeg.exec([
            ...vInputs,
            "-filter_complex", vFilter,
            "-map", "[outv]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "intermediate_video.mp4",
          ]);
        }

        // Step 2: Merge intermediate video + all audio inputs
        const aInputs = audioFileNames.flatMap((f) => ["-i", f]);

        if (audioFileNames.length === 1) {
          // Single audio track — just add it
          await ffmpeg.exec([
            "-i", "intermediate_video.mp4",
            ...aInputs,
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            "output.mp4",
          ]);
        } else {
          // Multiple audio — amix them, then merge
          const amixInputs = audioFileNames.map((_, i) => `[${i + 1}:a]`).join("");
          const amixFilter = `${amixInputs}amix=inputs=${audioFileNames.length}:duration=longest[outa]`;
          await ffmpeg.exec([
            "-i", "intermediate_video.mp4",
            ...aInputs,
            "-filter_complex", amixFilter,
            "-map", "0:v", "-map", "[outa]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            "output.mp4",
          ]);
        }

        // Clean up intermediate
        try { await ffmpeg.deleteFile("intermediate_video.mp4"); } catch {}
      }

      // Stage 4: Read output
      const outputData = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([new Uint8Array(outputData as Uint8Array)], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      // Cleanup input files
      for (const f of [...videoFileNames, ...audioFileNames]) {
        try { await ffmpeg.deleteFile(f); } catch {}
      }
      try { await ffmpeg.deleteFile("output.mp4"); } catch {}

      setState({
        stage: "complete",
        progress: 100,
        message: `Export complete — ${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
        downloadUrl: url,
        error: null,
      });
    } catch (err: any) {
      console.error("Export failed:", err);
      setState((s) => ({
        ...s,
        stage: "error",
        progress: 0,
        message: "",
        error: err.message || "Export failed. Please try again.",
      }));
    }
  }, []);

  return { ...state, exportTimeline, reset };
}
