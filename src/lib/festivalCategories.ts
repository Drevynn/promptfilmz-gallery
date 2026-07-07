import { Trophy, Camera, Sparkles, Film, Scissors, Palette } from "lucide-react";

export const FESTIVAL_CATEGORIES = [
  { value: "best_overall", label: "Best Overall", icon: Trophy },
  { value: "best_cinematography", label: "Best Cinematography", icon: Camera },
  { value: "best_vfx", label: "Best VFX", icon: Sparkles },
  { value: "best_short", label: "Best Short", icon: Film },
  { value: "best_editing", label: "Best Editing", icon: Scissors },
  { value: "best_art_direction", label: "Best Art Direction", icon: Palette },
] as const;

export type FestivalCategory = (typeof FESTIVAL_CATEGORIES)[number]["value"];

export const getCategoryLabel = (value: string) =>
  FESTIVAL_CATEGORIES.find((c) => c.value === value)?.label ?? "Best Overall";

export const getCategoryIcon = (value: string) =>
  FESTIVAL_CATEGORIES.find((c) => c.value === value)?.icon ?? Trophy;
