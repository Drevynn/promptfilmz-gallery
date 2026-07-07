import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BOQhOcUyqrM-yMQ47N0ih-kKa94WM_P_fjb5XfNz3C2QY5TrMz1xteLMooFBpysV9jUJp9HGn30pHSx2A8AWv7c";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("Notification" in window)) {
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);
    if (user) checkExistingSubscription();
    else setLoading(false);
  }, [user]);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // SW not available
    }
    setLoading(false);
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions" as any).insert({
        user_id: user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      });

      if (error) throw error;
      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (e) {
      console.error("Push subscription failed:", e);
      setLoading(false);
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase
          .from("push_subscriptions" as any)
          .delete()
          .eq("endpoint", sub.endpoint)
          .eq("user_id", user.id);
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error("Push unsubscribe failed:", e);
    }
    setLoading(false);
  }, [user]);

  const sendTestNotification = useCallback(async () => {
    if (!user) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify({ userId: user.id, title: "Test Notification", body: "Push notifications are working! 🎬", url: "/settings" }),
    });
  }, [user]);

  const supported = "Notification" in window && "serviceWorker" in navigator;

  return { permission, isSubscribed, loading, subscribe, unsubscribe, sendTestNotification, supported };
}
