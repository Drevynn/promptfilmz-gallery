import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Sparkles, Wand2, Copy, Edit2, Trash2, BookOpen, 
  Search, ShieldAlert, Check, RefreshCw, Layers, Sliders, HelpCircle, User
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc } from "firebase/firestore";

interface Character {
  id: string;
  user_id: string;
  project_id: string; // "global" or project ID
  name: string;
  role: string;
  visual_description: string;
  personality: string;
  backstory: string;
  avatar_url: string;
  created_at: string;
}

const ROLES = [
  { value: "Protagonist", label: "Protagonist", color: "pink" },
  { value: "Antagonist", label: "Antagonist", color: "red" },
  { value: "Deuteragonist", label: "Deuteragonist", color: "purple" },
  { value: "Supporting", label: "Supporting Character", color: "cyan" },
  { value: "Mentor", label: "Mentor / Sage", color: "yellow" },
  { value: "Comic Relief", label: "Comic Relief", color: "green" },
  { value: "Love Interest", label: "Love Interest", color: "orange" },
  { value: "Narrator", label: "Narrator", color: "slate" },
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

export default function CharacterBible() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<number | null>(null);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState<Record<string, string>>({});

  // Form Fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("Protagonist");
  const [visualDescription, setVisualDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [backstory, setBackstory] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [associatedProjectId, setAssociatedProjectId] = useState("global");

  // Fetch Characters and user tokens
  useEffect(() => {
    if (!user) return;

    // Real-time listener for user's characters
    const q = query(
      collection(db, "characters"),
      where("user_id", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const charList: Character[] = [];
      snapshot.forEach((docSnap) => {
        charList.push({ id: docSnap.id, ...docSnap.data() } as Character);
      });
      // Sort by name or date
      charList.sort((a, b) => a.name.localeCompare(b.name));
      setCharacters(charList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error listening to characters:", error);
      setLoading(false);
    });

    // Fetch user tokens from profile
    const profileRef = doc(db, "profiles", user.id);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setTokens(docSnap.data().tokens ?? 0);
      }
    });

    return () => {
      unsubscribe();
      unsubProfile();
    };
  }, [user]);

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingChar(null);
      setName("");
      setRole("Protagonist");
      setVisualDescription("");
      setPersonality("");
      setBackstory("");
      setAvatarUrl("");
      setAssociatedProjectId("global");
    }
  };

  // Populate form for editing
  const startEdit = (char: Character) => {
    setEditingChar(char);
    setName(char.name);
    setRole(char.role);
    setVisualDescription(char.visual_description || "");
    setPersonality(char.personality || "");
    setBackstory(char.backstory || "");
    setAvatarUrl(char.avatar_url || "");
    setAssociatedProjectId(char.project_id || "global");
    setIsOpen(true);
  };

  // Save Character Profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error("Character Name is required");
      return;
    }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      role,
      visual_description: visualDescription.trim(),
      personality: personality.trim(),
      backstory: backstory.trim(),
      avatar_url: avatarUrl.trim(),
      project_id: associatedProjectId,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingChar) {
        // Update existing document
        const charRef = doc(db, "characters", editingChar.id);
        await updateDoc(charRef, payload);
        toast.success("Character profile updated successfully!");
      } else {
        // Create new document
        const charactersCol = collection(db, "characters");
        await addDoc(charactersCol, {
          ...payload,
          created_at: new Date().toISOString()
        });
        toast.success("Character profile created successfully!");
      }
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving character:", err);
      toast.error("Failed to save character profile.");
    }
  };

  // Delete Character
  const handleDelete = async (charId: string) => {
    if (!window.confirm("Are you sure you want to delete this character? This action is irreversible.")) return;
    try {
      await deleteDoc(doc(db, "characters", charId));
      toast.success("Character profile deleted.");
    } catch (err) {
      console.error("Error deleting character:", err);
      toast.error("Failed to delete character.");
    }
  };

  // AI Avatar Generator
  const generateAIAvatar = async () => {
    if (!user) return;
    if (!visualDescription.trim()) {
      toast.error("Please fill in the Visual Description first. The AI uses this to paint the portrait.");
      return;
    }

    setGeneratingAvatar(true);
    const loadingToast = toast.loading("Invoking Gemini AI Avatar Painter... (3 credits)");

    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: visualDescription.trim(),
          userId: user.id,
          characterName: name.trim() || "Mysterious Character"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();
      setAvatarUrl(data.imageUrl);
      toast.dismiss(loadingToast);
      toast.success("Cinematic portrait generated! Don't forget to save your profile.");
    } catch (err) {
      console.error("Error generating avatar:", err);
      toast.dismiss(loadingToast);
      const errMsg = err instanceof Error ? err.message : "Failed to generate AI avatar. Check your credits.";
      toast.error(errMsg);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Copy visual description helper
  const copyVisualPrompt = (char: Character) => {
    if (!char.visual_description) {
      toast.error("No visual description to copy.");
      return;
    }
    navigator.clipboard.writeText(char.visual_description);
    toast.success(`Copied ${char.name}'s visual prompt! Use it in your storyboards.`);
  };

  // Quick regenerate avatar from Card directly
  const quickRegenerate = async (char: Character) => {
    if (!user) return;
    if (!char.visual_description) {
      toast.error("Please add a visual description before generating an avatar.");
      return;
    }

    const confirmRegen = window.confirm("Regenerating avatar will consume 3 tokens. Proceed?");
    if (!confirmRegen) return;

    const loadingToast = toast.loading(`Regenerating avatar for ${char.name}...`);
    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: char.visual_description,
          userId: user.id,
          characterName: char.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();
      const charRef = doc(db, "characters", char.id);
      await updateDoc(charRef, { avatar_url: data.imageUrl, updated_at: new Date().toISOString() });
      
      toast.dismiss(loadingToast);
      toast.success(`Generated brand new portrait for ${char.name}!`);
    } catch (err) {
      console.error("Quick regen error:", err);
      toast.dismiss(loadingToast);
      const errMsg = err instanceof Error ? err.message : "Failed to generate AI avatar.";
      toast.error(errMsg);
    }
  };

  // Filter and search characters
  const filteredCharacters = characters.filter(char => {
    const matchesProject = filterProject === "all" || char.project_id === filterProject;
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          char.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          char.visual_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const totalCharacters = characters.length;
  const protagonistCount = characters.filter(c => c.role === "Protagonist").length;
  const antagonistCount = characters.filter(c => c.role === "Antagonist").length;
  const avatarsGenerated = characters.filter(c => c.avatar_url && !c.avatar_url.includes("placeholder")).length;

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        
        {/* Header section with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-[var(--neon-purple-10)] text-[var(--neon-purple)] shadow-[0_0_15px_var(--neon-purple-20)]">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Character Bible</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Maintain a central ledger of visual profiles, backstories, and AI-generated portraits. 
              Persist traits flawlessly across Storyboards, Shot Lists, and Script Editors.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {tokens !== null && (
              <div className="flex items-center gap-2 bg-muted/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>AI Credits: <strong className="text-foreground">{tokens}</strong></span>
              </div>
            )}
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="font-semibold bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:brightness-110 transition-all">
                  <UserPlus className="w-4 h-4 mr-2" /> Design Character
                </Button>
              </DialogTrigger>
              
              {/* Character Creation Modal */}
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
                    {editingChar ? <Edit2 className="w-5 h-5 text-[var(--neon-pink)]" /> : <UserPlus className="w-5 h-5 text-[var(--neon-pink)]" />}
                    {editingChar ? `Edit ${name}` : "Design New Character"}
                  </DialogTitle>
                  <DialogDescription>
                    Define visual descriptions, casting details, and use the built-in Gemini image model to draw production stills.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSave} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column - Metadata */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="char-name">Character Name *</Label>
                        <Input 
                          id="char-name" 
                          placeholder="e.g., Captain Silas Vance" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="char-role">Role in Story</Label>
                          <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="char-role" className="mt-1">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="char-project">Scope/Project</Label>
                          <Select value={associatedProjectId} onValueChange={setAssociatedProjectId}>
                            <SelectTrigger id="char-project" className="mt-1">
                              <SelectValue placeholder="Project Scope" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="global">All Projects (Global)</SelectItem>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="char-personality">Personality Traits</Label>
                        <Input 
                          id="char-personality" 
                          placeholder="e.g., Cynical, sharp-tongued, fiercely loyal" 
                          value={personality}
                          onChange={(e) => setPersonality(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="char-backstory">Biography & Backstory</Label>
                        <Textarea 
                          id="char-backstory" 
                          placeholder="Brief biography, inner conflicts, motivation, and story arc..." 
                          value={backstory}
                          onChange={(e) => setBackstory(e.target.value)}
                          className="mt-1 h-[140px] resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Right Column - Physical / Avatar Generation */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="char-visuals" className="flex items-center gap-1.5 text-foreground font-medium">
                            Visual Description *
                          </Label>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Used for AI Painting</span>
                        </div>
                        <Textarea 
                          id="char-visuals" 
                          placeholder="Detailed appearance, facial structures, hair, typical clothing, camera lens focus, style, lighting..." 
                          value={visualDescription}
                          onChange={(e) => setVisualDescription(e.target.value)}
                          className="mt-1 h-[120px] resize-none border-dashed focus-visible:ring-offset-2 focus-visible:ring-[var(--neon-purple-40)]"
                        />
                      </div>

                      <div className="border border-border/80 rounded-xl p-4 bg-muted/30">
                        <Label className="block mb-2">Character Avatar Portrait</Label>
                        
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-10 h-10 text-muted-foreground/40" />
                            )}
                            {generatingAvatar && (
                              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-[var(--neon-pink)]" />
                                <span className="text-[8px] uppercase tracking-wider font-bold mt-1 text-muted-foreground">Painting</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 flex-1">
                            <Button 
                              id="btn-ai-generate-avatar"
                              type="button"
                              onClick={generateAIAvatar}
                              disabled={generatingAvatar}
                              className="w-full text-xs font-semibold bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] hover:opacity-90 text-white"
                            >
                              <Wand2 className="w-3.5 h-3.5 mr-1.5" /> 
                              {generatingAvatar ? "Generating..." : "AI Generate Avatar"}
                            </Button>
                            
                            <div className="relative">
                              <Input 
                                id="input-char-avatar-url"
                                placeholder="Or paste custom image URL..." 
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                className="text-xs h-8 pr-6"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 mt-2 text-center leading-relaxed">
                          AI generated portraits are custom cinematic renders matching the character description. Costs 3 tokens.
                        </p>
                      </div>
                    </div>
                    
                  </div>

                  <DialogFooter className="pt-4 border-t border-border">
                    <Button id="btn-cancel-char-profile" type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button id="btn-save-char-profile" type="submit" className="bg-primary hover:brightness-105">
                      {editingChar ? "Save Changes" : "Save Profile"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dashboard Grid Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Profiles", val: totalCharacters, desc: "Across all projects", color: "purple" },
            { label: "Protagonists", val: protagonistCount, desc: "Lead main roles", color: "pink" },
            { label: "Antagonists", val: antagonistCount, desc: "Key story obstacles", color: "red" },
            { label: "AI Portrayed", val: avatarsGenerated, desc: "With custom avatars", color: "cyan" },
          ].map((stat, i) => (
            <Card key={i} className="border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full bg-[var(--neon-${stat.color})]`} />
              <CardContent className="p-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                <h3 className="font-display text-2xl font-black text-foreground mt-1 mb-0.5">{stat.val}</h3>
                <span className="text-[10px] text-muted-foreground/80 block">{stat.desc}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search, Filter, Actions Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-border/60 bg-muted/20 backdrop-blur-sm">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, role, visual traits..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-border/80 focus-visible:ring-offset-0 focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global (All Projects)</SelectItem>
                <SelectItem value="global">Unassigned (Global Only)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Characters Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Synchronizing ledger records...</p>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 max-w-lg mx-auto">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-foreground">No characters found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              {searchQuery || filterProject !== "all" 
                ? "Try relaxing your filters or searching for something else." 
                : "Your bible is empty. Design your first character to orchestrate continuity across your projects."}
            </p>
            {!searchQuery && filterProject === "all" && (
              <Button onClick={() => setIsOpen(true)} className="bg-primary">
                <UserPlus className="w-4 h-4 mr-2" /> Design First Character
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCharacters.map((char) => {
                const roleStyle = getRoleStyle(char.role);
                const charTab = activeCardTab[char.id] || "visuals";
                const associatedProject = char.project_id === "global" 
                  ? "Global Scope" 
                  : projects.find(p => p.id === char.project_id)?.title || "Project Linked";

                return (
                  <motion.div
                    key={char.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="h-full flex flex-col justify-between border border-border/50 bg-card/60 backdrop-blur-sm hover:border-[var(--neon-purple-30)] hover:shadow-[0_0_15px_rgba(168,85,247,0.05)] transition-all overflow-hidden group">
                      
                      {/* Character Top visual banner */}
                      <div className="relative h-48 bg-muted flex items-center justify-center overflow-hidden">
                        
                        {/* Background blurred background glow */}
                        {char.avatar_url && (
                          <div 
                            className="absolute inset-0 filter blur-xl scale-110 opacity-30 group-hover:opacity-45 transition-opacity" 
                            style={{ backgroundImage: `url(${char.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                          />
                        )}
                        
                        {/* Real Portrait avatar image */}
                        {char.avatar_url ? (
                          <img 
                            src={char.avatar_url} 
                            alt={char.name} 
                            className="h-full w-full object-cover relative z-10 hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground/40 z-10">
                            <User className="w-12 h-12 mb-2" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/65">No Portrait Rendered</span>
                          </div>
                        )}

                        {/* Top banner labels & overlay gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/60 to-transparent z-20" />
                        
                        {/* Badge for Role */}
                        <div className="absolute top-3 left-3 z-30">
                          <Badge className={`${roleStyle.bg} ${roleStyle.text} ${roleStyle.border} border text-[10px] font-bold uppercase tracking-wider`}>
                            {char.role}
                          </Badge>
                        </div>

                        {/* Quick action buttons */}
                        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="secondary" 
                                  className="w-8 h-8 rounded-lg"
                                  onClick={() => startEdit(char)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Profile</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="w-8 h-8 rounded-lg bg-red-950/40 hover:bg-red-950 border border-red-500/20"
                                  onClick={() => handleDelete(char.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Character</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="absolute bottom-2 left-3 right-3 z-30 flex items-end justify-between">
                          <div>
                            <h3 className="font-display font-black text-xl text-foreground drop-shadow-md truncate">
                              {char.name}
                            </h3>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-mono bg-background/60 backdrop-blur-sm py-0.5 px-1.5 rounded mt-0.5 w-max">
                              {associatedProject}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Content Card Body */}
                      <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        
                        {/* Tab Switchers inside Card */}
                        <div className="space-y-3">
                          <div className="flex border-b border-border/40 pb-1.5">
                            {[
                              { id: "visuals", label: "Visuals", icon: Wand2 },
                              { id: "bio", label: "Biography", icon: BookOpen },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveCardTab(prev => ({ ...prev, [char.id]: tab.id }))}
                                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors mr-2 ${
                                  charTab === tab.id 
                                    ? "bg-muted text-foreground" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                }`}
                              >
                                <tab.icon className="w-3 h-3" />
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="min-h-[100px] text-xs leading-relaxed text-muted-foreground">
                            {charTab === "visuals" ? (
                              <div>
                                {char.visual_description ? (
                                  <p className="line-clamp-4 italic">
                                    "{char.visual_description}"
                                  </p>
                                ) : (
                                  <p className="text-muted-foreground/50">No visual description provided.</p>
                                )}
                                {char.personality && (
                                  <p className="mt-2 text-[11px] font-medium text-foreground/80">
                                    <span className="text-muted-foreground font-normal">Traits:</span> {char.personality}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                {char.backstory ? (
                                  <p className="line-clamp-5">
                                    {char.backstory}
                                  </p>
                                ) : (
                                  <p className="text-muted-foreground/50">No backstory added yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </CardContent>

                      {/* Card Footer Actions */}
                      <CardFooter className="px-4 py-3 bg-muted/10 border-t border-border/40 flex items-center justify-between gap-3 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex-1"
                          onClick={() => copyVisualPrompt(char)}
                        >
                          <Copy className="w-3 h-3 mr-1.5" /> Copy Visual Prompt
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[11px] font-semibold flex-1 border-border/80 hover:border-foreground"
                          onClick={() => quickRegenerate(char)}
                        >
                          <Sparkles className="w-3 h-3 mr-1.5 text-amber-400" /> Regenerate Portrait
                        </Button>
                      </CardFooter>

                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
