import { useMemo } from "react";
import { MapPin, Users, Clock, Eye } from "lucide-react";

interface Props {
  script: string;
}

/** Extract all INT./EXT. locations from the script */
const extractLocations = (text: string): string[] => {
  const locs = new Set<string>();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(INT\.|EXT\.)\s*(.+?)(?:\s*-\s*.+)?$/);
    if (match) {
      locs.add(match[2].trim());
    }
  }
  return Array.from(locs);
};

/** Extract unique character names */
const extractCharacters = (text: string): string[] => {
  const chars = new Set<string>();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed.length > 1 &&
      trimmed === trimmed.toUpperCase() &&
      !trimmed.startsWith("INT.") &&
      !trimmed.startsWith("EXT.") &&
      !trimmed.startsWith("(") &&
      !trimmed.startsWith("INSERT") &&
      !trimmed.includes(":") &&
      /^[A-Z\s()'.]+$/.test(trimmed)
    ) {
      chars.add(trimmed.replace(/\s*\(CONT'D\)/, "").trim());
    }
  }
  return Array.from(chars);
};

/** Extract established story elements for continuity */
const extractStoryElements = (text: string) => {
  const lines = text.split("\n");
  const props = new Set<string>();
  const timeRefs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Extract notable props / visual elements from action lines
    const insertMatch = trimmed.match(/^INSERT\s*-\s*(.+)/i);
    if (insertMatch) {
      props.add(insertMatch[1].replace(/["':]/g, "").trim());
    }
    // Extract time references from sluglines
    const timeMatch = trimmed.match(/^(?:INT\.|EXT\.)\s*.+\s*-\s*(.+)$/);
    if (timeMatch) {
      timeRefs.push(timeMatch[1].trim());
    }
  }

  return { props: Array.from(props), timeRefs };
};

const ContinuityTracker = ({ script }: Props) => {
  const characters = useMemo(() => extractCharacters(script), [script]);
  const locations = useMemo(() => extractLocations(script), [script]);
  const { props, timeRefs } = useMemo(() => extractStoryElements(script), [script]);

  if (characters.length === 0 && locations.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-[var(--neo-border)] space-y-3">
      <div className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Continuity</p>
      </div>

      {/* Characters */}
      {characters.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Users className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Characters ({characters.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {characters.map(char => (
              <span
                key={char}
                className="text-[9px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10"
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Locations ({locations.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {locations.map(loc => (
              <span
                key={loc}
                className="text-[9px] px-2 py-0.5 rounded-full bg-accent/5 text-accent/70 border border-accent/10"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Props / Visual elements */}
      {props.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Props / Inserts</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {props.map(prop => (
              <span
                key={prop}
                className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground/70 border border-[var(--neo-border)]"
              >
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { extractLocations, extractCharacters };
export default ContinuityTracker;
