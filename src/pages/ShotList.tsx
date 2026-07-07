import { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Circle, Camera, Clock, GripVertical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useShotsByProject, useUpdateShot, useReorderShots, EnrichedShot } from "@/hooks/useShots";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CharacterBibleDrawer } from "@/components/production/CharacterBibleDrawer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Table Row ──────────────────────────────────────────────
const SortableRow = ({ shot, onToggle }: { shot: EnrichedShot; onToggle: (s: EnrichedShot) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => onToggle(shot)}
      className={`border-b border-[var(--neo-border)]/50 cursor-pointer transition-colors hover:bg-[var(--neon-pink-05)] ${
        shot.status === "ready" ? "opacity-50" : ""
      } ${isDragging ? "bg-[var(--neon-pink-05)] shadow-[0_0_20px_var(--neon-pink-30)]" : ""}`}
    >
      <td className="p-4 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="p-4">
        {shot.status === "ready" ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--neon-green-raw)]" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground" />
        )}
      </td>
      <td className="p-4 font-mono font-medium text-primary">
        {shot.scene_number}.{shot.order_index + 1}
      </td>
      <td className="p-4">
        <Badge className="bg-[var(--neon-purple-10)] text-[var(--neon-purple)] border-[var(--neon-purple-30)] text-[10px]">
          <Camera className="w-3 h-3 mr-1" />
          {shot.shot_type}
        </Badge>
      </td>
      <td className="p-4 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
        {shot.prompt || "—"}
      </td>
      <td className="p-4 hidden lg:table-cell text-muted-foreground">{shot.camera_angle}</td>
      <td className="p-4 hidden lg:table-cell text-muted-foreground">{shot.motion_intensity}%</td>
      <td className="p-4">
        <Badge variant="outline" className="text-[10px]">{shot.status}</Badge>
      </td>
    </tr>
  );
};

const ShotList = () => {
  const [charBibleOpen, setCharBibleOpen] = useState(false);
  const { data: projects } = useProjects();
  const activeProject = projects?.[0];
  const projectId = activeProject?.id ?? null;

  const { data: shots = [], isLoading } = useShotsByProject(projectId);
  const updateShot = useUpdateShot();
  const reorderShots = useReorderShots();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Realtime subscription — private per-project channel enforced via realtime.messages RLS
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`shots:${projectId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shots", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["shots-by-project", projectId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);


  const readyCount = shots.filter((s) => s.status === "ready").length;

  const toggleShot = (shot: EnrichedShot) => {
    const nextStatus = shot.status === "ready" ? "draft" : "ready";
    updateShot.mutate({ id: shot.id, status: nextStatus });
    trackEvent("shot_toggled", { shot_id: shot.id, status: nextStatus });
  };

  // Group by scene for per-scene drag contexts
  const groupedByScene = shots.reduce<Record<number, EnrichedShot[]>>((acc, shot) => {
    const sn = shot.scene_number;
    if (!acc[sn]) acc[sn] = [];
    acc[sn].push(shot);
    return acc;
  }, {});
  const sceneNumbers = Object.keys(groupedByScene).map(Number).sort((a, b) => a - b);

  const handleDragEnd = useCallback(
    (sceneNum: number) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const sceneShots = [...groupedByScene[sceneNum]];
      const oldIndex = sceneShots.findIndex((s) => s.id === active.id);
      const newIndex = sceneShots.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const [moved] = sceneShots.splice(oldIndex, 1);
      sceneShots.splice(newIndex, 0, moved);

      const updates = sceneShots.map((s, i) => ({ id: s.id, order_index: i }));
      reorderShots.mutate(updates);
    },
    [groupedByScene, reorderShots]
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-gold-blue-shimmer">Shot List</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-[var(--neon-pink-10)] text-[var(--neon-pink)] border-[var(--neon-pink-30)] text-[10px]">
                {readyCount}/{shots.length} ready
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCharBibleOpen(true)}
              className="border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <Users className="w-4 h-4 text-[var(--neon-purple)]" /> Character Bible
            </Button>
            <Button variant="glow" size="sm">
              <Plus className="w-4 h-4" /> Add Shot
            </Button>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="mb-6 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: shots.length > 0 ? `${(readyCount / shots.length) * 100}%` : "0%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-primary shadow-[0_0_10px_var(--neon-pink-30)]"
          />
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="neo-card rounded-xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading shots…</div>
          ) : shots.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No shots yet. Add one or let the Director AI create them.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--neo-border)] text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-8"></th>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Shot</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 hidden md:table-cell">Prompt</th>
                  <th className="p-4 hidden lg:table-cell">Angle</th>
                  <th className="p-4 hidden lg:table-cell">Motion</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              {sceneNumbers.map((sn) => {
                const sceneShots = groupedByScene[sn];
                return (
                  <DndContext key={sn} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(sn)}>
                    <SortableContext items={sceneShots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {sceneShots.map((shot) => (
                          <SortableRow key={shot.id} shot={shot} onToggle={toggleShot} />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                );
              })}
            </table>
          )}
        </motion.div>
        <CharacterBibleDrawer 
          open={charBibleOpen} 
          onOpenChange={setCharBibleOpen}
          activeProjectId={projectId || undefined}
        />
      </div>
    </AppLayout>
  );
};

export default ShotList;
