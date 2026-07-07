import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotifPrefs {
  render_complete: boolean;
  script_updates: boolean;
  contest_votes: boolean;
}

const DEFAULTS: NotifPrefs = { render_complete: true, script_updates: true, contest_votes: false };

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("notification_preferences" as any)
        .select("render_complete, script_updates, contest_votes")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setPrefs({
          render_complete: (data as any).render_complete,
          script_updates: (data as any).script_updates,
          contest_votes: (data as any).contest_votes,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updatePref = useCallback(async (key: keyof NotifPrefs, value: boolean) => {
    if (!user) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    const { error } = await supabase
      .from("notification_preferences" as any)
      .upsert({ user_id: user.id, ...updated, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to save notification preference:", error);
      setPrefs(prefs); // revert
    }
  }, [user, prefs]);

  return { prefs, loading, updatePref };
}
