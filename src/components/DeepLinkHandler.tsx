import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Listens for Capacitor App URL open events (iOS Universal Links + custom scheme)
 * and forwards them to React Router so deep links open the right in-app screen.
 *
 * Supported link shapes:
 *   https://aifilmz.app/editor?project=<id>
 *   aifilmz://editor?project=<id>
 */
const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // Lazy import — only runs in the native iOS/Android webview
        const { App } = await import("@capacitor/app");
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const parsed = new URL(url);
            // Strip scheme + host, keep path + query + hash
            const target = `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
            navigate(target);
          } catch {
            /* malformed URL — ignore */
          }
        });

        cleanup = () => handle.remove();
      } catch {
        /* Capacitor not available (web build) — no-op */
      }
    })();

    return () => cleanup?.();
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;
