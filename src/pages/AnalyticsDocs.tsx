import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";

const events = [
  {
    category: "Navigation",
    items: [
      { event: "page_view", params: "page_path, page_title", trigger: "Every route change", source: "usePageTracking hook" },
    ],
  },
  {
    category: "Authentication",
    items: [
      { event: "sign_up", params: "method (email)", trigger: "Successful email signup", source: "Auth.tsx" },
      { event: "login", params: "method (email | google | apple)", trigger: "Successful login via any method", source: "Auth.tsx" },
      { event: "logout", params: "—", trigger: "User signs out", source: "AuthContext.tsx" },
    ],
  },
  {
    category: "Projects",
    items: [
      { event: "project_created", params: "project_id, project_title", trigger: "New project created", source: "useProjects.ts" },
      { event: "project_updated", params: "project_id", trigger: "Project details edited", source: "useProjects.ts" },
      { event: "project_deleted", params: "project_id", trigger: "Project deleted", source: "useProjects.ts" },
    ],
  },
  {
    category: "Script Editor",
    items: [
      { event: "script_ai_insert", params: "content_length", trigger: "AI-generated content inserted into script", source: "ScriptEditor.tsx" },
    ],
  },
  {
    category: "Storyboard",
    items: [
      { event: "storyboard_ai_generated", params: "frame_count", trigger: "AI generates storyboard frames", source: "Storyboard.tsx" },
      { event: "storyboard_image_generated", params: "frame_scene", trigger: "Frame thumbnail generated", source: "Storyboard.tsx" },
    ],
  },
  {
    category: "Shot List",
    items: [
      { event: "shot_toggled", params: "shot_id, completed", trigger: "Shot marked complete / incomplete", source: "ShotList.tsx" },
    ],
  },
  {
    category: "Veo 3 — Video Generation",
    items: [
      { event: "veo3_generate", params: "style, aspect_ratio, duration, prompt_length", trigger: "Generate Video button clicked", source: "Veo3.tsx" },
    ],
  },
  {
    category: "Video Editor",
    items: [
      { event: "video_ai_edit", params: "—", trigger: "AI Edit button clicked", source: "VideoEditor.tsx" },
      { event: "video_export", params: "—", trigger: "Export button clicked", source: "VideoEditor.tsx" },
    ],
  },
  {
    category: "AI Music",
    items: [
      { event: "music_generate", params: "genre, mood, prompt_length", trigger: "Generate Track button clicked", source: "AIMusic.tsx" },
    ],
  },
  {
    category: "Settings",
    items: [
      { event: "profile_updated", params: "—", trigger: "Profile saved successfully", source: "Settings.tsx" },
      { event: "avatar_updated", params: "—", trigger: "Avatar uploaded successfully", source: "Settings.tsx" },
    ],
  },
];

const AnalyticsDocs = () => (
  <AppLayout>
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gold-blue-shimmer">Analytics Event Reference</h1>
        <p className="text-muted-foreground mt-1">
          All custom <code className="text-xs bg-muted px-1.5 py-0.5 rounded">dataLayer</code> events pushed to Google Tag Manager.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground space-y-2">
        <p><strong className="text-foreground">Container ID:</strong> GTM-P46S5GNH</p>
        <p><strong className="text-foreground">Implementation:</strong> All events use <code className="bg-muted px-1 py-0.5 rounded text-xs">trackEvent()</code> from <code className="bg-muted px-1 py-0.5 rounded text-xs">src/lib/analytics.ts</code></p>
        <p><strong className="text-foreground">Setup:</strong> Create a custom event trigger in GTM for each event name below, then forward to your GA4 property.</p>
      </div>

      {events.map((group) => (
        <div key={group.category}>
          <h2 className="font-display text-lg font-semibold mb-3">{group.category}</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2.5 font-medium">Event Name</th>
                  <th className="px-4 py-2.5 font-medium">Parameters</th>
                  <th className="px-4 py-2.5 font-medium">Trigger</th>
                  <th className="px-4 py-2.5 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.event} className="border-t border-border">
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="font-mono text-xs">{item.event}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{item.params}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{item.trigger}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
        <h3 className="font-display font-semibold">Adding New Events</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Import <code className="bg-muted px-1 py-0.5 rounded text-xs">trackEvent</code> from <code className="bg-muted px-1 py-0.5 rounded text-xs">@/lib/analytics</code></li>
          <li>Call <code className="bg-muted px-1 py-0.5 rounded text-xs">trackEvent("event_name", {"{ key: value }"})</code> after the action succeeds</li>
          <li>Create a matching custom event trigger in GTM</li>
          <li>Update this page with the new event details</li>
        </ol>
      </div>
    </div>
  </AppLayout>
);

export default AnalyticsDocs;
