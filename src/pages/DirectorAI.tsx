import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Clapperboard, FileText, Video, Music,
  Loader2, Sparkles, Mic, Volume2, MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import PaywallGate from "@/components/PaywallGate";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";
import ReactMarkdown from "react-markdown";
import DirectorsLog, { DirectorLogEvent } from "@/components/production/DirectorsLog";

// Add Web Speech types if not available
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  logEvents?: DirectorLogEvent[];
  timestamp: Date;
}

const DIRECTOR_URL = `/api/director-master`;

const DirectorAI = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { data: projects } = useProjects();
  const activeProject = projects?.[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Voice Interaction setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = window.speechSynthesis.getVoices().find(v => v.name.includes("Google")) || null;
    window.speechSynthesis.speak(speech);
  };

  const handleSend = async (complexity?: 'high' | 'video' | 'low') => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const assistantId = crypto.randomUUID();
    let assistantContent = "";
    let logEvents: DirectorLogEvent[] = [];

    const updateAssistant = () => {
      setMessages((prev) => {
        const msg: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: assistantContent,
          logEvents: logEvents.length > 0 ? [...logEvents] : undefined,
          timestamp: new Date(),
        };
        const existing = prev.find((m) => m.id === assistantId);
        if (existing) {
          return prev.map((m) => (m.id === assistantId ? msg : m));
        }
        return [...prev, msg];
      });
    };

    try {
      const resp = await fetch(DIRECTOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          messages: apiMessages,
          complexity: complexity || 'low',
          projectId: activeProject?.id || null,
          userId: session?.user?.id,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.error || "AI service error", variant: "destructive" });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
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
          if (line.trim() === "") continue;

          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            speak(assistantContent);
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              toast({ title: "Error", description: parsed.error, variant: "destructive" });
              setIsStreaming(false);
              break;
            }
            if (parsed.flagged) {
              toast({ title: "Copyright Sentinel Warning", description: "Potential copyright infringement detected.", variant: "destructive" });
            }
            if (parsed.text !== undefined) {
              assistantContent += parsed.text;
              updateAssistant();
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
        if (textBuffer.includes("[DONE]")) break;
      }

      updateAssistant();
    } catch (e) {
      toast({ title: "Connection Error", description: "Failed to reach The Director.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout>
      <PaywallGate requiredTier={["studio"]}>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[var(--neon-pink)] flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold flex items-center gap-2 text-gold-blue-shimmer">
                The Director
                <Badge className="bg-[var(--neon-green-10)] text-[var(--neon-green-raw)] border-[var(--neon-green-30)] text-[9px] font-mono">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> LIVE
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Your cinematic mentor & digital encyclopaedia
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
              <Clapperboard className="w-12 h-12 text-muted-foreground" />
              <div>
                <p className="font-display text-lg font-semibold">How can I assist your vision?</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Speak, ask, or describe your vision. I am your filmmaking encyclopaedia.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[var(--neon-pink)] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "neo-card rounded-2xl rounded-br-md px-4 py-3" : ""}`}>
                  {msg.logEvents && msg.logEvents.length > 0 && <DirectorsLog events={msg.logEvents} />}
                  {msg.content && (
                    <div className="prose prose-sm prose-invert max-w-none text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[var(--neon-pink)] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                The Director is consulting the archives...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 border-t border-border">
          <div className="flex gap-2 items-end">
            <Button
              variant="ghost"
              size="icon"
              className={`shrink-0 h-11 w-11 ${isListening ? 'text-destructive animate-pulse' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask The Director..."
              className="min-h-[44px] max-h-32 resize-none text-sm"
              rows={1}
            />
            <Button
              variant="glow"
              size="icon"
              className="shrink-0 h-11 w-11"
              onClick={() => handleSend(input.length > 500 ? 'high' : 'low')}
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      </PaywallGate>
    </AppLayout>
  );
};

export default DirectorAI;

