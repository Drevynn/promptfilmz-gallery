import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, MapPin, Users, Film, Palette, FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const GENRES = ["Thriller", "Drama", "Horror", "Sci-Fi", "Comedy", "Romance", "Action", "Documentary", "Neo-Noir", "Fantasy"];
const TONES = ["Tense", "Dark", "Uplifting", "Mysterious", "Comedic", "Romantic", "Gritty", "Dreamlike", "Chaotic", "Quiet"];
const FORMATS = [
  { label: "Full Scene", desc: "Slugline, action, dialogue" },
  { label: "Dialogue Only", desc: "Character-driven exchange" },
  { label: "Action Lines", desc: "Visual storytelling, no speech" },
  { label: "Monologue", desc: "Single character speech" },
  { label: "Opening Sequence", desc: "Cold open or title sequence" },
  { label: "Transition", desc: "Bridge between scenes" },
];
const SETTINGS_INT = ["Apartment", "Office", "Bar", "Hospital", "Car", "Elevator", "Warehouse", "Classroom", "Kitchen", "Rooftop"];
const SETTINGS_EXT = ["Street", "Alley", "Park", "Parking Lot", "Beach", "Rooftop", "Forest", "Desert", "Docks", "Highway"];
const TIMES = ["DAY", "NIGHT", "DAWN", "DUSK", "CONTINUOUS", "LATER", "MOMENTS LATER"];

interface Props {
  characters: string[];
  locations: string[];
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const GhostwriterPromptBuilder = ({ characters, locations, onGenerate, isLoading }: Props) => {
  const [genre, setGenre] = useState("");
  const [tone, setTone] = useState("");
  const [format, setFormat] = useState("Full Scene");
  const [intExt, setIntExt] = useState<"INT" | "EXT">("INT");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("NIGHT");
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [expanded, setExpanded] = useState(true);

  const toggleChar = (char: string) => {
    setSelectedChars(prev =>
      prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
    );
  };

  const allLocations = [...new Set([...locations, ...(intExt === "INT" ? SETTINGS_INT : SETTINGS_EXT)])];

  const buildPrompt = () => {
    const parts: string[] = [];

    if (format) parts.push(`Write a ${format.toLowerCase()}`);
    if (genre) parts.push(`in the ${genre} genre`);
    if (tone) parts.push(`with a ${tone.toLowerCase()} tone`);

    const loc = customLocation || location;
    if (loc) {
      parts.push(`set at ${intExt}. ${loc.toUpperCase()} - ${timeOfDay}`);
    }

    if (selectedChars.length > 0) {
      parts.push(`featuring ${selectedChars.join(", ")}`);
    }

    if (customPrompt.trim()) {
      parts.push(`\n\nAdditional direction: ${customPrompt.trim()}`);
    }

    return parts.join(" ") + ".";
  };

  const handleGenerate = () => {
    const prompt = buildPrompt();
    onGenerate(prompt);
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-b border-[var(--neo-border)] hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-sm">Ghostwriter Studio</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-y-auto max-h-[calc(100vh-200px)] px-4 py-4 space-y-5"
        >
          {/* Format */}
          <Section icon={<FileText className="w-3.5 h-3.5" />} label="Format">
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATS.map(f => (
                <button
                  key={f.label}
                  onClick={() => setFormat(f.label)}
                  className={`text-left px-3 py-2 rounded-lg border transition-all ${
                    format === f.label
                      ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
                      : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-primary/20"
                  }`}
                >
                  <span className="text-[11px] font-bold block">{f.label}</span>
                  <span className="text-[9px] opacity-60">{f.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Genre */}
          <Section icon={<Film className="w-3.5 h-3.5" />} label="Genre">
            <ChipGroup items={GENRES} selected={genre} onSelect={setGenre} color="neon-purple" />
          </Section>

          {/* Tone */}
          <Section icon={<Palette className="w-3.5 h-3.5" />} label="Tone">
            <ChipGroup items={TONES} selected={tone} onSelect={setTone} color="neon-cyan" />
          </Section>

          {/* Setting */}
          <Section icon={<MapPin className="w-3.5 h-3.5" />} label="Scene Setting">
            <div className="space-y-3">
              {/* INT/EXT Toggle */}
              <div className="flex gap-1.5">
                {(["INT", "EXT"] as const).map(ie => (
                  <button
                    key={ie}
                    onClick={() => setIntExt(ie)}
                    className={`flex-1 text-[11px] font-bold py-2 rounded-lg border transition-all ${
                      intExt === ie
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-primary/20"
                    }`}
                  >
                    {ie}.
                  </button>
                ))}
              </div>

              {/* Location chips */}
              <div className="flex flex-wrap gap-1.5">
                {allLocations.slice(0, 12).map(loc => (
                  <button
                    key={loc}
                    onClick={() => { setLocation(loc); setCustomLocation(""); }}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                      location === loc && !customLocation
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-primary/20"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {/* Custom location */}
              <input
                value={customLocation}
                onChange={e => { setCustomLocation(e.target.value); setLocation(""); }}
                placeholder="Or type a custom location..."
                className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/50 border border-[var(--neo-border)] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 transition-colors"
              />

              {/* Time of Day */}
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeOfDay(t)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                      timeOfDay === t
                        ? "bg-accent/10 text-accent border-accent/30"
                        : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-accent/20"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Characters (Whisk-style continuity) */}
          <Section icon={<Users className="w-3.5 h-3.5" />} label="Characters">
            {characters.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">From your script</p>
                <div className="flex flex-wrap gap-1.5">
                  {characters.map(char => (
                    <button
                      key={char}
                      onClick={() => toggleChar(char)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                        selectedChars.includes(char)
                          ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
                          : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-primary/20"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0">
                        {char[0]}
                      </div>
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/50 italic">
                Characters will appear here as you write your script
              </p>
            )}
          </Section>

          {/* Additional Direction (free text) */}
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">Additional Direction</p>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Any extra details... e.g. 'Build tension slowly, end on a cliffhanger with a phone ringing'"
              className="w-full h-20 p-3 rounded-xl bg-secondary/50 border border-[var(--neo-border)] text-foreground text-xs placeholder:text-muted-foreground outline-none focus:border-primary/30 transition-all resize-none"
            />
          </div>

          {/* Preview + Generate */}
          <div className="space-y-3 pb-2">
            {(genre || tone || location || customLocation || selectedChars.length > 0 || customPrompt) && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-[var(--neo-border)]">
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1">Prompt Preview</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{buildPrompt()}</p>
              </div>
            )}

            <Button
              variant="glow"
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Generate Script
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* Reusable section wrapper */
const Section = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{label}</p>
    </div>
    {children}
  </div>
);

/* Reusable chip group */
const ChipGroup = ({
  items, selected, onSelect, color,
}: { items: string[]; selected: string; onSelect: (v: string) => void; color: string }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map(item => (
      <button
        key={item}
        onClick={() => onSelect(selected === item ? "" : item)}
        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
          selected === item
            ? `bg-[var(--${color}-10)] text-[var(--${color})] border-[var(--${color}-30)] shadow-[0_0_8px_var(--${color}-10)]`
            : "bg-secondary/50 text-muted-foreground border-[var(--neo-border)] hover:border-[var(--" + color + "-30)]"
        }`}
      >
        {item}
      </button>
    ))}
  </div>
);

export default GhostwriterPromptBuilder;
