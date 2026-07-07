import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Scene types ─────────────────────────────────────────────────────
export interface Scene {
  id: string;
  script_id: string;
  scene_number: number;
  slugline: string | null;
  summary: string | null;
}

export function useScenes(scriptId: string | null) {
  return useQuery({
    queryKey: ["scenes", scriptId],
    queryFn: async () => {
      if (!scriptId) return [];
      const { data, error } = await (supabase as any)
        .from("scenes")
        .select("*")
        .eq("script_id", scriptId)
        .order("scene_number", { ascending: true });
      if (error) throw error;
      return data as Scene[];
    },
    enabled: !!scriptId,
  });
}

export function useCreateScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scene: {
      script_id: string;
      scene_number: number;
      slugline?: string;
      summary?: string;
    }) => {
      const { data, error } = await (supabase as any).from("scenes").insert(scene).select().single();
      if (error) throw error;
      return data as Scene;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["scenes", data.script_id] });
    },
  });
}

export function useDeleteScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scriptId }: { id: string; scriptId: string }) => {
      const { error } = await (supabase as any).from("scenes").delete().eq("id", id);
      if (error) throw error;
      return scriptId;
    },
    onSuccess: (scriptId) => {
      qc.invalidateQueries({ queryKey: ["scenes", scriptId] });
    },
  });
}

// ─── Shot types (new schema) ─────────────────────────────────────────
export interface Shot {
  id: string;
  scene_id: string;
  order_index: number;
  shot_type: string;
  camera_angle: string;
  prompt: string | null;
  motion_intensity: number;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export function useShots(sceneId: string | null) {
  return useQuery({
    queryKey: ["shots", sceneId],
    queryFn: async () => {
      if (!sceneId) return [];
      const { data, error } = await (supabase as any)
        .from("shots")
        .select("*")
        .eq("scene_id", sceneId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Shot[];
    },
    enabled: !!sceneId,
  });
}

/** Fetch all shots for all scenes in a project (via script → scenes → shots) */
export function useShotsByProject(projectId: string | null) {
  return useQuery({
    queryKey: ["shots-by-project", projectId],
    queryFn: async () => {
      if (!projectId) return [] as EnrichedShot[];
      // Get script
      const { data: script } = await (supabase as any)
        .from("scripts")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();
      if (!script) return [] as EnrichedShot[];
      // Get scenes
      const { data: scenes } = await (supabase as any)
        .from("scenes")
        .select("id, scene_number, slugline")
        .eq("script_id", script.id)
        .order("scene_number", { ascending: true });
      if (!scenes?.length) return [] as EnrichedShot[];
      // Get shots for all scenes
      const sceneIds = scenes.map((s: any) => s.id);
      const { data: shots, error } = await (supabase as any)
        .from("shots")
        .select("*")
        .in("scene_id", sceneIds)
        .order("order_index", { ascending: true });
      if (error) throw error;
      // Enrich with scene info
      const sceneMap = Object.fromEntries(scenes.map((s: any) => [s.id, s]));
      return (shots as Shot[]).map((shot) => ({
        ...shot,
        scene_number: sceneMap[shot.scene_id]?.scene_number ?? 0,
        slugline: sceneMap[shot.scene_id]?.slugline ?? null,
      })) as EnrichedShot[];
    },
    enabled: !!projectId,
  });
}

export type EnrichedShot = Shot & { scene_number: number; slugline: string | null };

export function useCreateShot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shot: {
      scene_id: string;
      order_index?: number;
      shot_type?: string;
      camera_angle?: string;
      prompt?: string;
      motion_intensity?: number;
      status?: string;
    }) => {
      const { data, error } = await (supabase as any).from("shots").insert(shot).select().single();
      if (error) throw error;
      return data as Shot;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["shots", data.scene_id] });
      qc.invalidateQueries({ queryKey: ["shots-by-project"] });
    },
  });
}

export function useUpdateShot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shot> & { id: string }) => {
      const { data, error } = await (supabase as any).from("shots").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Shot;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["shots", data.scene_id] });
      qc.invalidateQueries({ queryKey: ["shots-by-project"] });
    },
  });
}

export function useDeleteShot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sceneId }: { id: string; sceneId: string }) => {
      const { error } = await (supabase as any).from("shots").delete().eq("id", id);
      if (error) throw error;
      return sceneId;
    },
    onSuccess: (sceneId) => {
      qc.invalidateQueries({ queryKey: ["shots", sceneId] });
      qc.invalidateQueries({ queryKey: ["shots-by-project"] });
    },
  });
}

export function useReorderShots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // Update each shot's order_index
      await Promise.all(
        updates.map(({ id, order_index }) =>
          (supabase as any).from("shots").update({ order_index }).eq("id", id)
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shots-by-project"] });
      qc.invalidateQueries({ queryKey: ["shots"] });
    },
  });
}
