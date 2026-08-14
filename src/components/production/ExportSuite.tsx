import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Printer, 
  Download, 
  Settings, 
  Eye, 
  FileCheck, 
  Image as ImageIcon, 
  Layout, 
  Sparkles,
  Sliders,
  Type
} from "lucide-react";
import { toast } from "sonner";

export interface StoryboardFrame {
  id: number | string;
  scene: string;
  description: string;
  notes: string;
  imageUrl?: string;
  status?: string;
}

interface ExportSuiteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenplayContent?: string;
  screenplayTitle?: string;
  storyboardFrames?: StoryboardFrame[];
}

export const ExportSuite = ({ 
  open, 
  onOpenChange, 
  screenplayContent = "", 
  screenplayTitle = "Untitled Masterpiece",
  storyboardFrames = [] 
}: ExportSuiteProps) => {
  // Form Config states for Title Page
  const [projectTitle, setProjectTitle] = useState(screenplayTitle);
  const [writtenBy, setWrittenBy] = useState("A Creative Filmmaker");
  const [contactInfo, setContactInfo] = useState("contact@firmname.com | (555) 0199");
  const [draftDate, setDraftDate] = useState(new Date().toLocaleDateString());
  const [draftType, setDraftType] = useState("First Draft");
  
  // Customizer options
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [documentType, setDocumentType] = useState<"screenplay" | "storyboard" | "combined">("combined");
  const [layoutTheme, setLayoutTheme] = useState<"classic" | "cinematic_dark" | "executive_portfolio">("classic");
  const [storyboardGridCols, setStoryboardGridCols] = useState<"2" | "3">("2");
  const [isPreviewActive, setIsPreviewActive] = useState(true);

  // Parse plain-text screenplays into structured elements for perfect screenplay rendering
  const parseScreenplay = (text: string) => {
    if (!text.trim()) return [];
    
    const lines = text.split("\n");
    const elements: { type: "slugline" | "character" | "parenthetical" | "dialogue" | "action" | "transition"; text: string }[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (!line) {
        i++;
        continue;
      }
      
      // Transitions (e.g., CUT TO:, FADE IN:)
      if ((line.toUpperCase() === line && (line.endsWith(":") || line.startsWith("FADE ") || line.startsWith("CUT "))) || line.startsWith("DISSOLVE ")) {
        elements.push({ type: "transition", text: line });
        i++;
        continue;
      }
      
      // Scene Heading / Sluglines
      if (line.startsWith("INT.") || line.startsWith("EXT.") || line.startsWith("I/E.") || line.toUpperCase().startsWith("SCENE ")) {
        elements.push({ type: "slugline", text: line.toUpperCase() });
        i++;
        continue;
      }
      
      // Parentheticals & dialogues are typically preceded by a character cue
      if (line.toUpperCase() === line && !line.startsWith("(") && line.length > 1 && !/^[0-9\-\.\s]+$/.test(line)) {
        elements.push({ type: "character", text: line });
        i++;
        
        // Grab subsequent dialogue & parentheticals grouped together
        while (i < lines.length) {
          const subLine = lines[i].trim();
          if (!subLine) {
            i++;
            break; // Empty space ends dialogue sequence
          }
          if (subLine.startsWith("(")) {
            elements.push({ type: "parenthetical", text: subLine });
          } else if (subLine.toUpperCase() === subLine && (subLine.startsWith("INT.") || subLine.startsWith("EXT."))) {
            // New slugline, break this loop
            break;
          } else if (subLine.toUpperCase() === subLine && subLine.endsWith(":")) {
            // New transition, break this loop
            break;
          } else if (subLine.toUpperCase() === subLine && subLine.length > 2 && !/^[0-9\-\.\s]+$/.test(subLine) && !subLine.startsWith("(")) {
            // Looks like another character cue, break to handle nested characters
            break;
          } else {
            elements.push({ type: "dialogue", text: subLine });
          }
          i++;
        }
        continue;
      }
      
      // Fallback: regular scene action description block
      elements.push({ type: "action", text: line });
      i++;
    }
    
    return elements;
  };

  const formattedElements = parseScreenplay(screenplayContent);

  // Generate dynamic full html structure for the browser print engine
  const renderDocumentHtml = () => {
    // Generate Styles depending on selection
    const isDark = layoutTheme === "cinematic_dark";
    const bgStyle = isDark ? "background-color: #0b0f19; color: #f1f5f9;" : "background-color: #ffffff; color: #111827;";
    const cardBg = isDark ? "background-color: #1e293b; border-color: #334155;" : "background-color: #f8fafc; border-color: #e2e8f0;";
    const mutedText = isDark ? "color: #94a3b8;" : "color: #64748b;";
    const labelBadge = isDark ? "background-color: rgba(129, 140, 248, 0.2); color: #818cf8; border-color: rgba(129, 140, 248, 0.4);" : "background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; border-color: rgba(79, 70, 229, 0.3);";
    
    let htmlContent = "";

    // 1. Cover Page
    if (includeTitlePage) {
      htmlContent += `
        <div class="page cover-page flex flex-col justify-between" style="min-height: 100vh; padding: 2.5in 1.5in 1.5in 1.5in; box-sizing: border-box; font-family: 'Courier Prime', Courier, monospace; ${bgStyle}">
          <div></div>
          <div class="text-center" style="margin-bottom: 2in;">
            <h1 style="font-size: 28pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12pt; letter-spacing: -0.02em;">${projectTitle}</h1>
            <p style="font-size: 14pt; font-style: italic; margin-bottom: 40pt; opacity: 0.8;">${draftType}</p>
            <div style="width: 60px; height: 1px; background-color: ${isDark ? "#475569" : "#cbd5e1"}; margin: 0 auto 30pt auto;"></div>
            <p style="font-size: 11pt; margin-bottom: 6pt;">Written by</p>
            <p style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${writtenBy}</p>
          </div>
          <div class="flex justify-between items-end border-t" style="border-color: ${isDark ? "#334155" : "#e2e8f0"}; pt-12; font-size: 10pt; opacity: 0.75;">
            <div>
              <p style="margin: 0; font-weight: 500;">Draft Date: ${draftDate}</p>
              <p style="margin: 3px 0 0 0;">Created using Prompt Filmz</p>
            </div>
            <div style="text-align: right; max-width: 250px;">
              <p style="margin: 0; font-style: italic; line-height: 1.4;">${contactInfo}</p>
            </div>
          </div>
        </div>
        <div class="page-break"></div>
      `;
    }

    // 2. Screenplay Section
    if (documentType === "screenplay" || documentType === "combined") {
      htmlContent += `
        <div class="page screenplay-section screenplay-container" style="padding: 1.2in 1.2in; box-sizing: border-box; min-height: 100vh; ${bgStyle}">
          <div class="flex justify-between items-center mb-10 pb-4 border-b border-dashed" style="border-color: ${isDark ? "#334155" : "#e2e8f0"};">
            <span style="font-size: 11pt; font-family: 'Courier Prime', monospace; opacity: 0.6; text-transform: uppercase;">${projectTitle} — Screenplay</span>
            <span style="font-size: 11pt; font-family: 'Courier Prime', monospace; opacity: 0.6;">Page 1</span>
          </div>
          
          <div style="font-family: 'Courier Prime', 'Courier New', monospace; font-size: 11pt; line-height: 1.6;">
            ${formattedElements.map(el => {
              if (el.type === "slugline") {
                return `<div class="slugline" style="font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 8px; letter-spacing: 0.02em;">${el.text}</div>`;
              }
              if (el.type === "character") {
                return `<div class="character-name" style="text-align: center; text-transform: uppercase; margin-top: 20px; margin-bottom: 2px; padding-left: 15%;">${el.text}</div>`;
              }
              if (el.type === "parenthetical") {
                return `<div class="parenthetical" style="text-align: center; font-style: italic; margin-bottom: 2px; padding-left: 10%; opacity: 0.9;">${el.text}</div>`;
              }
              if (el.type === "dialogue") {
                return `<div class="dialogue" style="width: 60%; margin: 0 auto; text-align: left; margin-bottom: 12px; padding-left: 8%; opacity: 0.95;">${el.text}</div>`;
              }
              if (el.type === "transition") {
                return `<div class="transition" style="text-align: right; text-transform: uppercase; margin-top: 18px; margin-bottom: 18px; font-weight: bold;">${el.text}</div>`;
              }
              return `<div class="action-line" style="margin-top: 12px; margin-bottom: 12px; line-height: 1.5; opacity: 0.85;">${el.text}</div>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    if (documentType === "combined") {
      htmlContent += `<div class="page-break"></div>`;
    }

    // 3. Storyboard Section
    if (documentType === "storyboard" || documentType === "combined") {
      const isCols3 = storyboardGridCols === "3";
      
      htmlContent += `
        <div class="page storyboard-section" style="padding: 1.2in 1.2in; box-sizing: border-box; min-height: 100vh; ${bgStyle}">
          <div class="flex justify-between items-center mb-8 pb-4 border-b border-dashed" style="border-color: ${isDark ? "#334155" : "#e2e8f0"};">
            <span style="font-size: 11pt; font-family: 'Courier Prime', monospace; opacity: 0.6; text-transform: uppercase;">${projectTitle} — Storyboard Boards</span>
            <span style="font-size: 11pt; font-family: 'Courier Prime', monospace; opacity: 0.6;">Storyboard Section</span>
          </div>
          
          <h2 style="font-size: 18pt; font-weight: bold; margin-bottom: 8px; font-family: 'Inter', sans-serif;">Production Storyboard Sequences</h2>
          <p style="margin-top: 0; margin-bottom: 30px; font-size: 10.5pt; opacity: 0.7; font-family: 'Inter', sans-serif;">
            Visual shots blueprint and camera frame structures (${storyboardFrames.length} keyframes).
          </p>

          <div style="display: grid; grid-template-columns: ${isCols3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)"}; gap: 24px;">
            ${storyboardFrames.map((frame, idx) => {
              const imageSource = frame.imageUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop";
              return `
                <div class="avoid-break" style="border: 1px solid; border-radius: 12px; overflow: hidden; display: flex; flex-col: column; ${cardBg}">
                  <div style="position: relative; width: 100%; aspect-ratio: 16/9; background-color: rgba(15,23,42,0.1); overflow: hidden;">
                    <img src="${imageSource}" alt="frame" class="image-node" style="width: 100%; height: 100%; object-fit: cover; border-bottom: 1px solid ${isDark ? "#334155" : "#e2e8f0"};" />
                    <span style="position: absolute; top: 10px; left: 10px; font-size: 8pt; font-weight: bold; border: 1px solid; border-radius: 6px; padding: 3px 8px; font-family: 'Courier Prime', monospace; ${labelBadge}">
                      SHOT ${1 + idx}
                    </span>
                  </div>
                  <div style="padding: 14px; font-family: 'Inter', sans-serif;">
                    <p style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: ${isDark ? "#818cf8" : "#4f46e5"}; margin: 0 0 6px 0;">
                      ${frame.scene || "ESTABLISHING SHOT"}
                    </p>
                    <p style="font-size: 10pt; font-weight: 500; margin: 0 0 10px 0; line-height: 1.4;">
                      ${frame.description || "No visual sequence details specified."}
                    </p>
                    ${frame.notes ? `
                      <div style="font-size: 8.5pt; margin-top: 8px; padding-top: 8px; border-top: 1px dashed ${isDark ? "#334155" : "#e2e8f0"}; ${mutedText}">
                        <span style="font-weight: 600;">Director Notes:</span> ${frame.notes}
                      </div>
                    ` : ""}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    return htmlContent;
  };

  const handlePrintPdf = () => {
    // Create or reuse hidden iframe element
    let iframe = document.getElementById("print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-iframe";
      iframe.style.position = "absolute";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Generate style strings
    const fontInclusions = `
      <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    `;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${projectTitle || "Prompt Filmz — Production Export"}</title>
          ${fontInclusions}
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: letter;
              margin: 0;
            }
            
            @media print {
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page-break {
                page-break-before: always;
                break-before: page;
              }
              .avoid-break {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .image-node {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }

            body {
              margin: 0;
              padding: 0;
              background-color: transparent;
            }
          </style>
        </head>
        <body>
          ${renderDocumentHtml()}
        </body>
      </html>
    `;

    doc.open();
    doc.write(printHtml);
    doc.close();

    // Trigger printing once links have securely hydrated
    toast.info("Assembling filmmaking packets... printing window will pop-up shortly!");
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-[var(--neo-border)]">
        
        {/* Header Block with Neon styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--neo-border)] bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] flex items-center justify-center border border-[var(--neon-cyan-30)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Export Production Suite
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Format and compile classic screenplay layouts and visuals into vectors-ready PDFs.
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPreviewActive(!isPreviewActive)}
              className="h-8 text-xs hidden md:flex"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              {isPreviewActive ? "Hide Live Preview" : "Show Live Preview"}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.open('https://sovranly-ip-425151855682.us-west1.run.app', '_blank')}
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5" />
              Register with Sovranly IP
            </Button>
            <Button 
              variant="glow" 
              size="sm" 
              onClick={handlePrintPdf}
              className="h-8 font-black text-xs uppercase tracking-wider"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Dual Layout Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Options panel */}
          <div className="w-full md:w-[380px] border-r border-[var(--neo-border)] overflow-y-auto p-6 space-y-6 bg-card/10">
            
            {/* Project & Format selection */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" /> Package Layout
              </h3>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Package Elements</Label>
                <Select value={documentType} onValueChange={(v: any) => setDocumentType(v)}>
                  <SelectTrigger className="bg-secondary/40 border-[var(--neo-border)]">
                    <SelectValue placeholder="Selection" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-[var(--neo-border)]">
                    <SelectItem value="combined">Combined Package (Script + Storyboards)</SelectItem>
                    <SelectItem value="screenplay">Screenplay Text Only</SelectItem>
                    <SelectItem value="storyboard">Storyboard Boards Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Styling Pattern</Label>
                <Select value={layoutTheme} onValueChange={(v: any) => setLayoutTheme(v)}>
                  <SelectTrigger className="bg-secondary/40 border-[var(--neo-border)]">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-[var(--neo-border)]">
                    <SelectItem value="classic">Hollywood Standard (Light)</SelectItem>
                    <SelectItem value="cinematic_dark">Cinematic Editorial (Slate Dark)</SelectItem>
                    <SelectItem value="executive_portfolio">Executive Clean (Minimal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {documentType !== "screenplay" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Storyboard Grid</Label>
                  <Select value={storyboardGridCols} onValueChange={(v: any) => setStoryboardGridCols(v)}>
                    <SelectTrigger className="bg-secondary/40 border-[var(--neo-border)]">
                      <SelectValue placeholder="Grid Columns" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-[var(--neo-border)]">
                      <SelectItem value="2">Two Columns per stage</SelectItem>
                      <SelectItem value="3">Three Columns per stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Customizer switch */}
            <div className="pt-4 border-t border-[var(--neo-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Title Cover Page</Label>
                  <p className="text-[10px] text-muted-foreground">Include a professional cover-sheet.</p>
                </div>
                <Switch 
                  checked={includeTitlePage} 
                  onCheckedChange={setIncludeTitlePage}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {includeTitlePage && (
                <div className="space-y-3.5 bg-secondary/20 p-3 rounded-lg border border-[var(--neo-border)] mt-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Program Output Title</Label>
                    <Input 
                      value={projectTitle} 
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="h-8 text-xs bg-card border-[var(--neo-border)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Written By / Writer</Label>
                    <Input 
                      value={writtenBy} 
                      onChange={(e) => setWrittenBy(e.target.value)}
                      className="h-8 text-xs bg-card border-[var(--neo-border)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Draft Classification</Label>
                        <Input 
                          value={draftType} 
                          onChange={(e) => setDraftType(e.target.value)}
                          className="h-8 text-xs bg-card border-[var(--neo-border)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Official Date</Label>
                        <Input 
                          value={draftDate} 
                          onChange={(e) => setDraftDate(e.target.value)}
                          className="h-8 text-xs bg-card border-[var(--neo-border)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Contact details</Label>
                    <input 
                      value={contactInfo} 
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full text-xs bg-card border border-[var(--neo-border)] rounded-md px-2 py-1 h-12 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Print metadata diagnostics */}
            <div className="pt-4 border-t border-[var(--neo-border)] space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Diagnostics & Elements</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Screenplay lines</span>
                  <span className="font-mono text-xs">{formattedElements.length} lines parsed</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Storyboard shots</span>
                  <span className="font-mono text-xs">{storyboardFrames.length} frames detected</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live document sheets preview */}
          {isPreviewActive ? (
            <div className="flex-1 overflow-y-auto bg-slate-900/60 p-8 flex justify-center border-l border-black/40">
              <div 
                className="w-full max-w-2xl shadow-2xl rounded-lg p-10 font-mono transition-transform duration-300"
                style={{
                  fontFamily: layoutTheme === "classic" || layoutTheme === "cinematic_dark" ? '"Courier Prime", Courier, monospace' : 'inherit',
                  backgroundColor: layoutTheme === "cinematic_dark" ? "#0b0f19" : "#ffffff",
                  color: layoutTheme === "cinematic_dark" ? "#f1f5f9" : "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  minHeight: "100%",
                }}
              >
                {/* Visual Cover Preview inside Previewer */}
                {includeTitlePage && (
                  <div className="mb-12 border-b border-dashed border-slate-500/20 pb-12 flex flex-col justify-between" style={{ minHeight: "450px" }}>
                    <div></div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">{projectTitle}</h2>
                      <p className="text-sm italic opacity-60 mb-8">{draftType}</p>
                      
                      <p className="text-xs opacity-70">Written by</p>
                      <p className="text-[15px] font-bold uppercase tracking-wider mt-1">{writtenBy}</p>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-400/20 pt-4 text-[10px] opacity-60">
                      <div>
                        <p>Draft: {draftDate}</p>
                      </div>
                      <div className="text-right max-w-xs">
                        <p>{contactInfo}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cover Page break indicator */}
                {includeTitlePage && (
                  <div className="my-8 flex items-center justify-center gap-4 text-xs text-muted-foreground opacity-40 select-none">
                    <span className="h-px bg-slate-500/20 flex-1"></span>
                    <span>PAGE BREAK</span>
                    <span className="h-px bg-slate-500/20 flex-1"></span>
                  </div>
                )}

                {/* SCRIPT SHEETS PREVIEW */}
                {(documentType === "screenplay" || documentType === "combined") && (
                  <div className="mb-12">
                    <p className="text-[10px] opacity-40 uppercase tracking-widest text-center mb-6">--- Screenplay Act Core ---</p>
                    {formattedElements.length === 0 ? (
                      <p className="text-xs text-center italic opacity-40 py-8">Screenplay content is empty.</p>
                    ) : (
                      <div className="space-y-3.5 text-xs">
                        {formattedElements.slice(0, 50).map((el, i) => {
                          if (el.type === "slugline") {
                            return <div key={i} className="font-bold uppercase tracking-wide mt-5 text-[#06b6d4]">{el.text}</div>;
                          }
                          if (el.type === "character") {
                            return <div key={i} className="text-center uppercase mt-3 text-emerald-400/90" style={{ paddingLeft: "15%" }}>{el.text}</div>;
                          }
                          if (el.type === "parenthetical") {
                            return <div key={i} className="text-center italic opacity-75" style={{ paddingLeft: "10%" }}>{el.text}</div>;
                          }
                          if (el.type === "dialogue") {
                            return <div key={i} className="w-10/12 mx-auto leading-relaxed text-slate-300" style={{ paddingLeft: "8%" }}>{el.text}</div>;
                          }
                          if (el.type === "transition") {
                            return <div key={i} className="text-right font-bold uppercase py-2 text-rose-400">{el.text}</div>;
                          }
                          return <div key={i} className="opacity-80 leading-relaxed">{el.text}</div>;
                        })}
                        {formattedElements.length > 50 && (
                          <div className="text-center text-[10px] opacity-40 mt-6 pt-6 border-t border-dashed border-slate-500/10">
                            (+ {formattedElements.length - 50} more script statements truncated in preview)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Screenplay - Storyboard Break */}
                {documentType === "combined" && (
                  <div className="my-8 flex items-center justify-center gap-4 text-xs text-muted-foreground opacity-40 select-none">
                    <span className="h-px bg-slate-500/20 flex-1"></span>
                    <span>PAGE BREAK</span>
                    <span className="h-px bg-slate-500/20 flex-1"></span>
                  </div>
                )}

                {/* STORYBOARD PREVIEWER */}
                {(documentType === "storyboard" || documentType === "combined") && (
                  <div>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest text-center mb-6">--- Visual storyboard grid ---</p>
                    {storyboardFrames.length === 0 ? (
                      <p className="text-xs text-center italic opacity-40 py-8">Storyboard contains no shots.</p>
                    ) : (
                      <div className={`grid ${storyboardGridCols === "3" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                        {storyboardFrames.map((frame, index) => {
                          const fallbackImg = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&fit=crop";
                          return (
                            <div key={frame.id || index} className="border border-slate-500/10 rounded-lg overflow-hidden bg-black/10 text-xs">
                              <div className="aspect-video bg-slate-800 relative">
                                <img src={frame.imageUrl || fallbackImg} alt="board" className="w-full h-full object-cover opacity-60" />
                                <span className="absolute top-2 left-2 bg-black/60 border border-slate-300/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                                  S-{index + 1}
                                </span>
                              </div>
                              <div className="p-3 font-sans space-y-1">
                                <p className="text-[9px] font-mono font-bold text-[#06b6d4] tracking-wider uppercase">{frame.scene}</p>
                                <p className="font-semibold text-slate-200 line-clamp-2 leading-tight">{frame.description}</p>
                                {frame.notes && <p className="text-[10px] text-muted-foreground line-clamp-1 border-t border-slate-500/5 pt-1.5 mt-1">Note: {frame.notes}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/45 text-center">
              <div className="w-12 h-12 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center mb-4 text-muted-foreground">
                <Sliders className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold mb-1">Previewer Disabled</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                To maximize editing window focus, you have hidden the live layout sheet preview.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsPreviewActive(true)} className="mt-4">
                Enable Interactive Preview
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
