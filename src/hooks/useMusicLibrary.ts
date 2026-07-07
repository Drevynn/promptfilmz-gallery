import { useState, useEffect, useCallback } from "react";

export interface MusicLibraryTrack {
  id: string;
  name: string;
  genre: string;
  mood: string;
  duration: string;
  durationSeconds: number;
  bpm: number;
  audioUrl: string;
  prompt: string;
  savedAt: string;
}

const STORAGE_KEY = "golden-hour-music-library";

export const useMusicLibrary = () => {
  const [tracks, setTracks] = useState<MusicLibraryTrack[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTracks(JSON.parse(stored));
    } catch {}
  }, []);

  const save = useCallback((newTracks: MusicLibraryTrack[]) => {
    setTracks(newTracks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTracks));
  }, []);

  const addTrack = useCallback((track: MusicLibraryTrack) => {
    setTracks((prev) => {
      const updated = [track, ...prev.filter((t) => t.id !== track.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { tracks, addTrack, removeTrack };
};
