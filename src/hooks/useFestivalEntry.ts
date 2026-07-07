import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFestivalEntry() {
  const { user } = useAuth();
  const [freeEntryAvailable, setFreeEntryAvailable] = useState(false);
  const [isInTrial, setIsInTrial] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("free_fest_used, trial_started_at")
        .eq("id", user.id)
        .single();

      if (data) {
        setFreeEntryAvailable(!data.free_fest_used);

        if (data.trial_started_at) {
          const trialEnd = new Date(data.trial_started_at);
          trialEnd.setDate(trialEnd.getDate() + 30);
          setIsInTrial(new Date() < trialEnd);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const submitEntry = async (shotId: string, category: string) => {
    const { data, error } = await supabase.functions.invoke("create-festival-entry", {
      body: { shotId, category },
    });
    if (error) throw error;
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed?.error) throw new Error(parsed.error);
    
    // Refresh status after submission
    await checkStatus();
    return parsed;
  };

  return { freeEntryAvailable, isInTrial, loading, submitEntry, refresh: checkStatus };
}
