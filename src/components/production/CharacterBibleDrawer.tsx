import { useState, useEffect } from "react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Search, Copy, Sparkles, User, Info, BookOpen, ExternalLink, RefreshCw 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Character {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  role: string;
  visual_description: string;
  personality: string;
  backstory: string;
  avatar_url: string;
}

interface CharacterBibleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeProjectId?: string; // If supplied, can filter/highlight characters of the active project
}

const ROLES = [
  { value: "Protagonist", color: "pink" },
  { value: "Antagonist", color: "red" },
  { value: "Deuteragonist", color: "purple" },
  { value: "Supporting", color: "cyan" },
  { value: "Mentor", color: "yellow" },
  { value: "Comic Relief", color: "green" },
  { value: "Love Interest", color: "orange" },
  { value: "Narrator", color: "slate" },
];

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  pink: { bg: "bg-[var(--neon-pink-10)]", text: "text-[var(--neon-pink)]", border: "border-[var(--neon-pink-30)]" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  purple: { bg: "bg-[var(--neon-purple-10)]", text: "text-[var(--neon-purple)]", border: "border-[var(--neon-purple-30)]" },
  cyan: { bg: "bg-[var(--neon-cyan-10)]", text: "text-[var(--neon-cyan)]", border: "border-[var(--neon-cyan-30)]" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

const getRoleStyle = (roleName: string) => {
  const role = ROLES.find(r => r.value === roleName);
  return roleColors[role?.color || "slate"];
};

export function CharacterBibleDrawer({ open, onOpenChange, activeProjectId }: CharacterBibleDrawerProps) {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<"all" | "active">("all");

  useEffect(() => {
    if (!user || !open) return;

    setLoading(true);
    const q = query(
      collection(db, "characters"),
      where("user_id", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Character[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Character);
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCharacters(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching characters in drawer:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, open]);

  // Handle Copy Prompt
  const copyPrompt = (char: Character) => {
    if (!char.visual_description) {
      toast.error("This character has no visual description to copy.");
      return;
    }
    navigator.clipboard.writeText(char.visual_description);
    toast.success(`Copied visual description of ${char.name}!`);
  };

  // Filter characters
  const filtered = characters.filter((char) => {
    const matchesSearch = 
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (char.visual_description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (filterScope === "active" && activeProjectId) {
      return matchesSearch && char.project_id === activeProjectId;
    }
    return matchesSearch;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[450px] sm:w-[500px] border-l border-border bg-card p-0 flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-6 border-b border-border/80">
          <SheetHeader className="space-y-1.5">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-xl font-extrabold tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--neon-purple)]" />
                Character Bible Ledger
              </SheetTitle>
              <Link 
                to="/characters" 
                onClick={() => onOpenChange(false)}
                className="text-xs text-[var(--neon-cyan)] hover:underline flex items-center gap-1 font-semibold"
              >
                Manage All <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Reference physical appearances, copy prompts, and manage story continuity in real time.
            </SheetDescription>
          </SheetHeader>

          {/* Scope Filters */}
          {activeProjectId && (
            <div className="flex gap-2 mt-4 bg-muted/40 p-1 rounded-lg border border-border/60">
              <button
                onClick={() => setFilterScope("all")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                  filterScope === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Characters
              </button>
              <button
                onClick={() => setFilterScope("active")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                  filterScope === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Project Characters
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search characters, roles, descriptors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-border/80 focus-visible:ring-offset-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* List Content */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
              <p className="text-xs text-muted-foreground font-medium">Fetching character ledger...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border/80 rounded-xl bg-muted/10 p-4">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No characters found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                {searchQuery ? "Try refining your search terms." : "Create character profiles in the Character Bible to reference them here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((char) => {
                const isSelected = selectedCharId === char.id;
                const roleStyle = getRoleStyle(char.role);
                const charProj = char.project_id === "global" 
                  ? "Global Scope" 
                  : projects.find(p => p.id === char.project_id)?.title || "Project Linked";

                return (
                  <div 
                    key={char.id} 
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-muted/80 border-[var(--neon-purple-30)] shadow-[0_0_15px_rgba(168,85,247,0.05)]" 
                        : "bg-card border-border/60 hover:border-border"
                    }`}
                    onClick={() => setSelectedCharId(isSelected ? null : char.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/80 shrink-0 bg-muted flex items-center justify-center">
                        {char.avatar_url ? (
                          <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Name & Role */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-sm font-bold text-foreground truncate">{char.name}</h4>
                          <Badge className={`${roleStyle.bg} ${roleStyle.text} ${roleStyle.border} border text-[8px] font-bold px-1.5 py-0`}>
                            {char.role}
                          </Badge>
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-mono">
                          {charProj}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Panel */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-3 text-xs leading-relaxed">
                        {char.visual_description && (
                          <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Visual Description
                            </span>
                            <p className="text-muted-foreground italic text-xs">
                              "{char.visual_description}"
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-full text-[10px] font-bold uppercase tracking-wider mt-1.5"
                              onClick={(e) => { e.stopPropagation(); copyPrompt(char); }}
                            >
                              <Copy className="w-3 h-3 mr-1" /> Copy Visual Prompt
                            </Button>
                          </div>
                        )}

                        {char.personality && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-foreground flex items-center gap-1">
                              <Info className="w-3 h-3 text-cyan-400" />
                              Personality & Traits
                            </span>
                            <p className="text-muted-foreground text-xs">{char.personality}</p>
                          </div>
                        )}

                        {char.backstory && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-foreground flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-pink-400" />
                              Biography & Arc
                            </span>
                            <p className="text-muted-foreground text-xs">{char.backstory}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer info link */}
        <div className="p-4 bg-muted/30 border-t border-border/80 text-center">
          <p className="text-[10px] text-muted-foreground">
            Copy visual descriptors to paint perfect storyboard frames matching casting details.
          </p>
        </div>

      </SheetContent>
    </Sheet>
  );
}
