# Prompt Filmz — Core Codebase Documentation

This document covers the structural design, core functions, hooks, state engines, and context providers for the **Prompt Filmz — AI Filmmaking Studio** workspace. It provides definitions of parameters, return properties, and intended behaviors to support developers building upon and importing services from this codebase.

---

## 1. Authentication & Context Architecture

### `AuthProvider` and `useAuth`
- **Path**: `src/contexts/AuthContext.tsx`
- **Purpose**: Establishes global user authentication tracking. Handles state hydration synchronizing in-memory, local storage, or remote cloud providers.

#### Context Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `session` | `Session \| null` | The active user session session metadata object. |
| `user` | `User \| null` | Represents the currently authenticated user credentials. |
| `loading` | `boolean` | True until initial cache lookup or token hydration completes. |
| `initialized` | `boolean` | True once the primary authentication listener registers. |
| `signOut` | `() => Promise<void>` | Clears credentials, invalidates user tokens, and registers logout telemetry. |

---

## 2. Core Functional Hooks

All hooks are structured to work with TanStack Query (`@tanstack/react-query`) for seamless caching, optimistic state updates, and database-safe mutations.

### `useProjects`
- **Path**: `src/hooks/useProjects.ts`
- **Description**: Manages user-created projects and film containers.

#### Query Hook: `useProjects()`
- **Output**: Returns traditional React Query results listing project array objects.
- **Data Shape**: `Project[]`

#### Mutation: `useCreateProject`
- **Parameters**: `project: { title: string; description?: string }`
- **Returns**: Promise resolving the newly created `Project` entity.
- **Side Effect**: Captures `project_created` telemetry.

#### Mutation: `useUpdateProject`
- **Parameters**: `payload: { id: string; title?: string; description?: string; status?: string }`
- **Returns**: Promise resolving the updated `Project` entity.

#### Mutation: `useDeleteProject`
- **Parameters**: `id: string` (The unique identifier of the target project)
- **Returns**: Promise confirming successful database deletion.

---

### `useScript`
- **Path**: `src/hooks/useScript.ts`
- **Description**: Manages screenplays, dialog sheets, and interactive AI scene suggestions.

#### Operations
- **`useScript(projectId: string)`**: Returns the unique screenplay matching the project. Uses conditional polling if the document is being auto-generated or modified.
- **`useSaveScript()`**:
  - **Parameters**: `{ projectId: string; content: string; last_ai_suggestion?: string }`
  - **Behavior**: Persists full screenplays client-side or remote, updating temporal `updated_at` variables.

---

### `useShots`
- **Path**: `src/hooks/useShots.ts`
- **Description**: Handles storyboard segments, angle variations, lens options, camera movements, and completions.

#### Key Functions & Mutation Properties
| Function / Mutation | Parameters | Intended Behavior |
| :--- | :--- | :--- |
| `useShots(projectId: string)` | `projectId: string` | Retrieves sorting order list of scenes for index sequencing. |
| `useCreateShot` | `{ projectId: string; shotData: Partial<Shot> }` | Appends a shot block with specified camera movement and custom film frames. |
| `useUpdateShot` | `{ id: string; updates: Partial<Shot> }` | Modifies parameters such as framing bounds or AI generation prompt cues. |
| `useDeleteShot` | `id: string` | Purges the shot item from the scene storyboard stack. |
| `useReorderShots` | `{ sortedIds: string[] }` | Overwrites sequence orders for real-time storyboard drag-and-drop actions. |

---

### `useSubscription`
- **Path**: `src/hooks/useSubscription.ts`
- **Description**: Establishes plan parameters, credit balance levels, and paywall gates.

#### Methods
- **`useSubscription()`**: Fetches plan parameters and user tier states.
- **`useCheckoutMutation()`**: Initiates checkout redirect pipelines.
- **`usePortalMutation()`**: Pulls down customizable settings links.

---

## 3. Storage Definitions & Data Types

The system relies on structured relational documents. Core interfaces include:

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  status: "scripting" | "pre-production" | "storyboard" | "editing" | "released";
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Shot {
  id: string;
  project_id: string;
  shot_code: string;
  scene_number: string;
  shot_type: string;
  angle: string;
  movement: string;
  camera_angle: string;
  lens: string;
  motion_intensity: number;
  duration: string;
  description: string;
  prompt: string;
  sort_order: number;
  is_completed: boolean;
  thumbnail_url: string | null;
  video_url: string | null;
}
```
