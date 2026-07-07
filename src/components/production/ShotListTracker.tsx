import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Camera, Plus, Trash2, ChevronRight, Clapperboard, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShotsByProject, useCreateShot, useUpdateShot, useDeleteShot, useReorderShots, EnrichedShot } from "@/hooks/useShots";
import { useScenes, useCreateScene } from "@/hooks/useShots";
import { useScript } from "@/hooks/useScript";
import { useToast } from "@/hooks/use-toast";
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

const shotTypes = ["WS", "MS", "MCU", "CU", "ECU", "Tracking", "Low Angle", "High Angle", "POV", "OTS"];
const cameraAngles = ["Eye Level", "Low Angle", "High Angle", "Dutch Angle", "Bird's Eye", "Worm's Eye"];

interface ShotListTrackerProps {
  projectId: string;
  onSelectShot: (shot: EnrichedShot) => void;
  currentShotId?: string;
}

// ─── Sortable Shot Card ──────────────────────────────────────────────
interface SortableShotCardProps {
  shot: EnrichedShot;
  sceneNumber: number;
  currentShotId?: string;
  onSelect: (shot: EnrichedShot) => void;
  onToggleStatus: (shot: EnrichedShot) => void;
  onDelete: (e: React.MouseEvent, shot: EnrichedShot) => void;
}

const SortableShotCard = ({ shot, sceneNumber, currentShotId, onSelect, onToggleStatus, onDelete }: SortableShotCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const statusColor = {
    draft: "text-muted-foreground",
    rendering: "text-primary animate-pulse",
    ready: "text-[var(--neon-green-raw)]",
    failed: "text-destructive",
  }[shot.status] || "text-muted-foreground";

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={() => onSelect(shot)}
        className={`neo-card rounded-xl p-4 cursor-pointer transition-all group ${
          currentShotId === shot.id
            ? "border-[var(--neon-cyan-30)] shadow-[0_0_20px_var(--neon-cyan-10)]"
            : "hover:border-[var(--neon-pink-30)]"
        } ${shot.status === "ready" ? "opacity-70" : ""} ${isDragging ? "shadow-[0_0_30px_var(--neon-pink-30)]" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(shot); }}
            className="mt-0.5 shrink-0"
          >
            {shot.status === "ready" ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--neon-green-raw)]" />
            ) : (
              <Circle className={`w-4 h-4 ${statusColor} hover:text-primary transition-colors`} />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-primary">
                {sceneNumber}.{shot.order_index + 1}
              </span>
              <Badge className="bg-[var(--neon-purple-10)] text-[var(--neon-purple)] border-[var(--neon-purple-30)] text-[9px]">
                <Camera className="w-2.5 h-2.5 mr-0.5" />
                {shot.shot_type}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                {shot.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{shot.prompt || "No prompt"}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
              <span>{shot.camera_angle}</span>
              <span>• Motion: {shot.motion_intensity}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => onDelete(e, shot)} className="p-1 hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
            <ChevronRight className={`w-4 h-4 transition-colors ${currentShotId === shot.id ? "text-accent" : "text-muted-foreground"}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────
const ShotListTracker = ({ projectId, onSelectShot, currentShotId }: ShotListTrackerProps) => {
  const { data: script } = useScript(projectId);
  const { data: scenes = [] } = useScenes(script?.id ?? null);
  const { data: shots = [], isLoading } = useShotsByProject(projectId);
  const createShot = useCreateShot();
  const createScene = useCreateScene();
  const updateShot = useUpdateShot();
  const deleteShot = useDeleteShot();
  const reorderShots = useReorderShots();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [sceneNumber, setSceneNumber] = useState("1");
  const [slugline, setSlugline] = useState("");
  const [shotType, setShotType] = useState("WS");
  const [cameraAngle, setCameraAngle] = useState("Eye Level");
  const [prompt, setPrompt] = useState("");
  const [motionIntensity, setMotionIntensity] = useState("50");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const readyCount = shots.filter((s) => s.status === "ready").length;

  // Group shots by scene
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

      // Reorder array
      const [moved] = sceneShots.splice(oldIndex, 1);
      sceneShots.splice(newIndex, 0, moved);

      // Build updates
      const updates = sceneShots.map((s, i) => ({ id: s.id, order_index: i }));
      reorderShots.mutate(updates);
    },
    [groupedByScene, reorderShots]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script) {
      toast({ title: "No script found", description: "Create a script for this project first.", variant: "destructive" });
      return;
    }
    try {
      const sceneNum = parseInt(sceneNumber) || 1;
      let scene = scenes.find((s) => s.scene_number === sceneNum);
      if (!scene) {
        scene = await createScene.mutateAsync({
          script_id: script.id,
          scene_number: sceneNum,
          slugline: slugline || undefined,
        });
      }

      const shotsInScene = shots.filter((s) => s.scene_id === scene!.id);
      await createShot.mutateAsync({
        scene_id: scene.id,
        order_index: shotsInScene.length,
        shot_type: shotType,
        camera_angle: cameraAngle,
        prompt,
        motion_intensity: parseInt(motionIntensity) || 50,
      });
      setDialogOpen(false);
      setPrompt("");
      setSlugline("");
      toast({ title: "Shot added to storyboard" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (shot: EnrichedShot) => {
    const nextStatus = shot.status === "ready" ? "draft" : "ready";
    await updateShot.mutateAsync({ id: shot.id, status: nextStatus });
  };

  const handleDeleteShot = async (e: React.MouseEvent, shot: EnrichedShot) => {
    e.stopPropagation();
    await deleteShot.mutateAsync({ id: shot.id, sceneId: shot.scene_id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {shots.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest px-1">
            <span>Ready</span>
            <span>{readyCount}/{shots.length}</span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${shots.length > 0 ? (readyCount / shots.length) * 100 : 0}%` }}
              className="h-full rounded-full bg-primary shadow-[0_0_10px_var(--neon-pink-30)]"
            />
          </div>
        </div>
      )}

      {/* Shots grouped by scene with drag-and-drop */}
      {sceneNumbers.map((sn) => {
        const sceneShots = groupedByScene[sn];
        const sceneSlugline = sceneShots[0]?.slugline;
        return (
          <div key={sn} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clapperboard className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Scene {sn}
              </span>
              {sceneSlugline && (
                <span className="text-[10px] text-muted-foreground truncate">· {sceneSlugline}</span>
              )}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(sn)}>
              <SortableContext items={sceneShots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sceneShots.map((shot) => (
                    <SortableShotCard
                      key={shot.id}
                      shot={shot}
                      sceneNumber={sn}
                      currentShotId={currentShotId}
                      onSelect={onSelectShot}
                      onToggleStatus={toggleStatus}
                      onDelete={handleDeleteShot}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}

      {/* Empty state */}
      {shots.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No shots yet. Add your first shot to begin.</p>
          {!script && (
            <p className="text-xs mt-1 text-destructive">Create a script for this project first.</p>
          )}
        </div>
      )}

      {/* Add shot button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full border border-dashed border-[var(--neo-border)] hover:border-[var(--neon-cyan-30)] text-muted-foreground text-xs">
            <Plus className="w-3 h-3" /> Add Shot
          </Button>
        </DialogTrigger>
        <DialogContent className="neo-card border-[var(--neon-pink-30)]">
          <DialogHeader>
            <DialogTitle className="font-display">Add Shot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Scene #</Label>
                <Input value={sceneNumber} onChange={(e) => setSceneNumber(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Slugline</Label>
                <Input value={slugline} onChange={(e) => setSlugline(e.target.value)} placeholder="EXT. DESERT - DAY" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prompt</Label>
              <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Cinematic wide shot of a vast desert at dawn..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Shot Type</Label>
                <Select value={shotType} onValueChange={setShotType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {shotTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Camera Angle</Label>
                <Select value={cameraAngle} onValueChange={setCameraAngle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cameraAngles.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Motion Intensity (0–100)</Label>
              <Input type="number" min="0" max="100" value={motionIntensity} onChange={(e) => setMotionIntensity(e.target.value)} />
            </div>
            <Button type="submit" variant="glow" className="w-full" disabled={createShot.isPending}>
              {createShot.isPending ? "Adding..." : "Add Shot"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShotListTracker;
