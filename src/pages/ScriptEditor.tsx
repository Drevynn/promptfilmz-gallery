import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Wand2, Download, Copy, RotateCcw, Send, Bot, User, Loader2,
  Sparkles, X, Plus, FileText, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import GhostwriterPromptBuilder from "@/components/script/GhostwriterPromptBuilder";
import ContinuityTracker, { extractLocations } from "@/components/script/ContinuityTracker";
import { ExportSuite } from "@/components/production/ExportSuite";

type Message = { role: "user" | "assistant"; content: string };

const SCRIPT_ASSIST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/script-assist`;

const QUICK_PROMPTS = [
  { label: "Continue scene", prompt: "Continue the script from where it left off. Write the next 10-15 lines maintaining the tone and pacing." },
  { label: "Add dialogue", prompt: "Write additional dialogue for the current scene that deepens the character relationships and raises the stakes." },
  { label: "Rewrite last scene", prompt: "Rewrite the last scene with more tension and visual dynamism. Make the action lines more cinematic." },
  { label: "Add new character", prompt: "Introduce a new character who enters the current scene and creates an unexpected complication." },
];

/** Parse script content into a scene list */
const extractScenes = (text: string): string[] => {
  const scenes: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("INT.") || trimmed.startsWith("EXT.")) {
      scenes.push(trimmed);
    }
  }
  return scenes.length > 0 ? scenes : ["No scenes detected"];
};

/** Parse unique uppercase character names from the script */
const extractCharacters = (text: string): string[] => {
  const chars = new Set<string>();
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Character cues: all-caps, not a slugline, not empty, not a parenthetical
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

const ScriptEditor = () => {
  const [exportSuiteOpen, setExportSuiteOpen] = useState(false);
  const [script, setScript] = useState(
`INT. APARTMENT - NIGHT

A dimly lit apartment. Rain streaks down the window. ALEX (30s) sits at a desk, staring at a glowing monitor.

ALEX
(whispering)
It wasn't supposed to end like this.

The screen flickers. A message appears:

INSERT - MONITOR SCREEN: "TIME REMAINING: 00:03:42"

Alex stands abruptly, knocking the chair back.

ALEX (CONT'D)
Three minutes. That's all I need.

EXT. CITY STREET - CONTINUOUS

Alex bursts through the apartment door into the rain-soaked street. Neon signs reflect in puddles.`
  );

  const [title, setTitle] = useState("Neon Dreams - Draft 1");
  const [aiOpen, setAiOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm your script writing assistant. I can help you **generate new scenes**, **polish dialogue**, **continue your story**, or **rewrite sections**. What would you like to work on?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scenes = extractScenes(script);
  const characters = extractCharacters(script);
  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const lineCount = script.split("\n").length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // AI Ghostwriter — quick inline suggestion
  const simulateAiSuggestion = () => {
    setIsAiProcessing(true);
    setTimeout(() => {
      setScript(prev => prev.trimEnd() + "\n\nSuddenly, the ground begins to TREMBLE. A shadow grows over the dunes.");
      setIsAiProcessing(false);
      toast({ title: "AI Suggestion added", description: "New content appended to your script." });
    }, 1500);
  };

  const streamChat = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: userPrompt.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(SCRIPT_ASSIST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          currentScript: script,
        }),
      });

      if (resp.status === 401) {
        toast({ title: "Session expired", description: "Please sign out and log in again to continue.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (resp.status === 429 || resp.status === 402) {
        const data = await resp.json();
        toast({ title: "AI Unavailable", description: data.error, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) throw new Error("Failed to connect");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial chunk */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect to the AI service. Please try again." }]);
    }
    setIsLoading(false);
  };

  const scrollToScene = (scene: string) => {
    const idx = script.indexOf(scene);
    if (idx === -1) return;
    // Focus textarea and set cursor position
    const textarea = document.querySelector<HTMLTextAreaElement>("#script-textarea");
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(idx, idx + scene.length);
      // Scroll textarea to show selected scene
      const linesBefore = script.slice(0, idx).split("\n").length;
      const lineHeight = 24;
      textarea.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-0px)] overflow-hidden">
        {/* Left Sidebar: Scene Navigation */}
        <div className="w-56 bg-card border-r border-[var(--neo-border)] p-4 flex flex-col shrink-0 hidden lg:flex">
          <div className="flex items-center gap-2 mb-6 px-1">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground truncate">
              {title.split(" - ")[0]}.fountain
            </span>
          </div>

          {/* Scene List */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">Scene List</p>
            <div className="space-y-1">
              {scenes.map((scene, i) => (
                <button
                  key={i}
                  onClick={() => scrollToScene(scene)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-colors hover:bg-primary/10 text-muted-foreground hover:text-primary truncate"
                >
                  {String(i + 1).padStart(2, "0")}. {scene.replace(/^(INT\.|EXT\.)\s*/, "").split(" - ")[0]}
                </button>
              ))}
            </div>

            {/* Characters */}
            {characters.length > 0 && (
              <div className="pt-4 border-t border-[var(--neo-border)]">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1 mb-2">Characters</p>
                <div className="space-y-2">
                  {characters.map((char, i) => (
                    <div key={char} className="flex items-center gap-2 px-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">
                        {char[0]}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">{char}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Script Stats */}
          <div className="pt-4 border-t border-[var(--neo-border)] space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Words</span>
              <span className="font-mono">{wordCount}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Lines</span>
              <span className="font-mono">{lineCount}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Scenes</span>
              <span className="font-mono">{scenes.length}</span>
            </div>
          </div>
        </div>

        {/* Main Editor Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-6 py-3 border-b border-[var(--neo-border)] bg-card/50 backdrop-blur-sm shrink-0"
          >
            <div className="flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-display text-lg font-bold bg-transparent border-none outline-none text-foreground w-64"
              />
              <Badge className="bg-[var(--neon-cyan-10)] text-[var(--neon-cyan)] border-[var(--neon-cyan-30)] text-[10px]">
                Screenplay
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8"><RotateCcw className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-8"><Copy className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setExportSuiteOpen(true)}>
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button variant="glow" size="sm" className="h-8">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </motion.div>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="max-w-[800px] mx-auto px-8 lg:px-12 pt-10 pb-32">
              <textarea
                id="script-textarea"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-foreground/80 leading-relaxed overflow-hidden"
                style={{
                  minHeight: "80vh",
                  fontFamily: '"Courier Prime", "Courier New", monospace',
                  fontSize: "15px",
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Floating Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-card/80 backdrop-blur-xl p-2 rounded-2xl border border-[var(--neo-border)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-20"
          >
            <button className="p-2.5 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground">
              <Type className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-[var(--neo-border)]" />
            <button
              onClick={simulateAiSuggestion}
              disabled={isAiProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isAiProcessing ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              AI Ghostwriter
            </button>
            <div className="w-px h-6 bg-[var(--neo-border)]" />
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`p-2.5 rounded-xl transition-colors ${aiOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button className="p-2.5 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground">
              <Save className="w-4 h-4" />
            </button>
            <button className="p-2.5 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground">
              <Download className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Right Sidebar: AI Assistant */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="border-l border-[var(--neo-border)] bg-card flex flex-col overflow-hidden shrink-0"
            >
              {/* Close button */}
              <div className="px-5 py-3 border-b border-[var(--neo-border)] flex items-center justify-between">
                <span className="font-display font-semibold text-sm">AI Ghostwriter</span>
                <button onClick={() => setAiOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guided Prompt Builder */}
              <div className="flex-1 overflow-y-auto">
                <GhostwriterPromptBuilder
                  characters={characters}
                  locations={extractLocations(script)}
                  onGenerate={(prompt) => streamChat(prompt)}
                  isLoading={isLoading}
                />

                {/* Quick Prompts */}
                <div className="px-4 py-3 border-t border-[var(--neo-border)]">
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Quick Actions</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => streamChat(qp.prompt)}
                        disabled={isLoading}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuity Tracker (Whisk-style) */}
                <ContinuityTracker script={script} />

                {/* AI Response Area */}
                <div ref={scrollRef} className="px-4 py-4 space-y-3 border-t border-[var(--neo-border)]">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                      }`}>
                        {msg.role === "assistant" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </div>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "assistant" ? "bg-secondary/50 border border-[var(--neo-border)]" : "bg-primary/10 border border-primary/20"
                      }`}>
                        <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:text-[10px] [&_code]:text-[10px]">
                          <ReactMarkdown
                            components={{
                              pre({ children }) {
                                return <pre className="relative group">{children}</pre>;
                              },
                              code({ className, children, ...props }) {
                                const text = String(children).replace(/\n$/, "");
                                const isScreenplay = className?.includes("screenplay") || className?.includes("language-screenplay");
                                if (isScreenplay) {
                                  return (
                                    <div className="relative">
                                      <code className={className} {...props}>{children}</code>
                                      <button
                                        onClick={() => {
                                          setScript(prev => prev.trimEnd() + "\n\n" + text);
                                          trackEvent("script_ai_insert", { content_length: text.length });
                                          toast({ title: "Inserted!", description: "Script content appended." });
                                        }}
                                        className="mt-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                      >
                                        <Plus className="w-3 h-3" /> Insert into script
                                      </button>
                                    </div>
                                  );
                                }
                                return <code className={className} {...props}>{children}</code>;
                              },
                            }}
                          >{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3" />
                      </div>
                      <div className="bg-secondary/50 border border-[var(--neo-border)] rounded-lg px-3 py-2">
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Free-form chat input at bottom */}
              <form
                onSubmit={(e) => { e.preventDefault(); streamChat(input); }}
                className="p-3 border-t border-[var(--neo-border)] flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or just type freely..."
                  className="flex-1 text-xs h-8 bg-card border-[var(--neo-border)]"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90" disabled={isLoading || !input.trim()}>
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <ExportSuite 
          open={exportSuiteOpen} 
          onOpenChange={setExportSuiteOpen} 
          screenplayContent={script} 
          screenplayTitle={title} 
        />
      </div>
    </AppLayout>
  );
};

export default ScriptEditor;
