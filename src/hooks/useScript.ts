import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Script {
  id: string;
  project_id: string;
  content: string;
  last_ai_suggestion: string | null;
  updated_at: string;
}

export function useScript(projectId: string | null) {
  return useQuery({
    queryKey: ["script", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await (supabase as any)
        .from("scripts")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data as Script | null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      content,
      last_ai_suggestion,
    }: {
      projectId: string;
      content: string;
      last_ai_suggestion?: string | null;
    }) => {
      const { data: existing } = await (supabase as any)
        .from("scripts")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        const updates: Record<string, unknown> = { content };
        if (last_ai_suggestion !== undefined) updates.last_ai_suggestion = last_ai_suggestion;
        const { data, error } = await (supabase as any)
          .from("scripts")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as Script;
      } else {
        const { data, error } = await (supabase as any)
          .from("scripts")
          .insert({ project_id: projectId, content, last_ai_suggestion: last_ai_suggestion ?? null })
          .select()
          .single();
        if (error) throw error;
        return data as Script;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["script", data.project_id] });
    },
  });
}
