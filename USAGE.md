# Prompt Filmz — Core Codebase Usage Guide

This guide provides practical code examples demonstrating how to import and utilize the core functionalities of the **Prompt Filmz** filmmaking environment in frontend applications, dashboards, or developer integrations.

---

## 1. Initializing and Subscribing to User Authentication

To gain access to active user parameters and keep database context securely scoped, mount the `AuthProvider` wrapper around your application.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard_App from "./pages/Dashboard";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Hydrating secure environment...</div>;
  }

  return user ? <Dashboard_App /> : <div className="p-8">Please register to proceed.</div>;
}
```

---

## 2. Reading and Writing Screenplay Data

The following component demonstrates reading a script matching a specific film container, and updating its contents along with custom AI suggestions.

```tsx
import React, { useState } from "react";
import { useScript, useSaveScript } from "@/hooks/useScript";
import { Button } from "@/components/ui/button";

export function ScreenplayEditor({ projectId }: { projectId: string }) {
  const { data: script, isLoading } = useScript(projectId);
  const { mutate: saveScript, isPending } = useSaveScript();
  const [editorText, setEditorText] = useState("");

  // Sync loaded state with local editor state
  React.useEffect(() => {
    if (script?.content) {
      setEditorText(script.content);
    }
  }, [script]);

  const handleSave = () => {
    saveScript({
      projectId,
      content: editorText,
      last_ai_suggestion: "Pacing matches scene requirements. Added emotional resonance to protagonist line.",
    });
  };

  if (isLoading) return <div>Loading screenplay logs...</div>;

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl glass-panel">
      <h2 className="text-xl font-bold tracking-tight text-white mb-2">Screenplay Editor</h2>
      <textarea
        className="w-full h-64 p-4 rounded-xl bg-black/20 text-white font-mono border border-white/10"
        value={editorText}
        onChange={(e) => setEditorText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last AI Tip: {script?.last_ai_suggestion || "No tips generated."}
        </p>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Screenplay"}
        </Button>
      </div>
    </div>
  );
}
```

---

## 3. Creating and Reordering Board Storyboards

To handle dynamic camera storyboard sheets and perform automatic sequence weight overlays, inspect and trigger mutations on the `useShots` hook.

```tsx
import React from "react";
import { useShots, useCreateShot, useUpdateShot, useReorderShots } from "@/hooks/useShots";

export function StoryboardWorkspace({ projectId }: { projectId: string }) {
  const { data: shots = [], isLoading } = useShots(projectId);
  const createShotMutation = useCreateShot();
  const updateShotMutation = useUpdateShot();
  const reorderShotsMutation = useReorderShots();

  const handleAddNewShot = () => {
    createShotMutation.mutate({
      projectId,
      shotData: {
        shot_code: `SC-01-S${shots.length + 1}`,
        scene_number: "1",
        shot_type: "MCU",
        duration: "5",
        description: "The cameras follow protagonist turning into the corridor.",
        prompt: "A neonlit alleyway tracking character in cyber suit, 35mm lens.",
      },
    });
  };

  const handleToggleShotCompletion = (shotId: string, currentStatus: boolean) => {
    updateShotMutation.mutate({
      id: shotId,
      updates: { is_completed: !currentStatus },
    });
  };

  if (isLoading) return <p>Loading scene layers...</p>;

  return (
    <div className="p-6">
      <div className="flex mb-4 justify-between items-center">
        <h3 className="text-lg font-bold">Storyboard Shots ({shots.length})</h3>
        <button
          onClick={handleAddNewShot}
          className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-700 text-white"
        >
          Add Custom Shot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shots.map((shot) => (
          <div key={shot.id} className="p-4 rounded-xl glass-panel relative flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono opacity-50 block mb-1">{shot.shot_code}</span>
              <p className="text-sm font-medium mb-3">{shot.description}</p>
            </div>
            <button
              onClick={() => handleToggleShotCompletion(shot.id, shot.is_completed)}
              className={`w-full py-1.5 rounded text-xs font-bold transition-all ${
                shot.is_completed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/60"
              }`}
            >
              {shot.is_completed ? "✓ Shot Production Ready" : "Mark Production Ready"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```
