import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackEvent("page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);
}
