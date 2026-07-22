import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, Send, CheckCircle2, MessageSquare, Copy, Check, ArrowLeft,
  LifeBuoy, Sparkles, AlertCircle, HelpCircle, BookOpen, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import logoImg from "@/assets/logo-circle.png";

const DESTINATION_EMAIL = "help@aifilmz.app";

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "billing", label: "Billing & Credits" },
  { value: "partnership", label: "Partnership / Business" },
];

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(DESTINATION_EMAIL);
    setCopied(true);
    toast({
      title: "Email Copied",
      description: `${DESTINATION_EMAIL} copied to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !message.trim() || !subject.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in your email, subject, and message.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "contact_submissions"), {
        name: name.trim() || "Anonymous Creator",
        email: email.trim(),
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
        recipient: DESTINATION_EMAIL,
        status: "unread",
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast({
        title: "Message Sent!",
        description: `Your inquiry has been submitted and directed to ${DESTINATION_EMAIL}.`,
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Failed to send your message. Please try again or email help@aifilmz.app directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Mail className="w-3.5 h-3.5" />
          <span>Direct Contact Desk</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Get in Touch
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Have questions, technical issues, or feature ideas? Send us a message and our team will respond to your inbox.
        </p>

        {/* Destination Email Banner */}
        <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border shadow-sm text-xs sm:text-sm">
          <span className="text-muted-foreground">Submissions deliver to:</span>
          <span className="font-mono font-semibold text-primary">{DESTINATION_EMAIL}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopyEmail}
            title="Copy email address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Info Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="neo-card rounded-2xl p-6 space-y-5 border border-border">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-primary" />
              <span>How We Can Help</span>
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">AI Generation Guidance</h3>
                  <p className="mt-0.5">Need help tuning prompts for Director AI, Storyboards, or Luma Video Studio?</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Billing & Credits</h3>
                  <p className="mt-0.5">Questions about credit allocations, plan upgrades, or transaction logs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Technical Support</h3>
                  <p className="mt-0.5">Troubleshooting video exports, timeline rendering, or browser compatibility.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground">Prefer self-service documentation?</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate("/wiki")}
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Browse Tool Wiki</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate("/faq")}
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Frequently Asked Questions</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form / Success Panel */}
        <div className="lg:col-span-7">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neo-card rounded-2xl p-8 text-center space-y-6 border border-emerald-500/30 bg-emerald-500/5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-bold text-foreground">Message Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out. Your message has been logged and routed to{" "}
                  <strong className="text-foreground font-mono">{DESTINATION_EMAIL}</strong>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border text-xs text-left space-y-1 text-muted-foreground">
                <p><strong className="text-foreground">Subject:</strong> {subject}</p>
                <p><strong className="text-foreground">Category:</strong> {CATEGORIES.find(c => c.value === category)?.label}</p>
                <p><strong className="text-foreground">Contact Email:</strong> {email}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  variant="default"
                  onClick={() => {
                    setSubmitted(false);
                    setSubject("");
                    setMessage("");
                  }}
                >
                  Send Another Message
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Return to Dashboard
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="neo-card rounded-2xl p-6 sm:p-8 space-y-5 border border-border"
            >
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Send a Message</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Your Name</label>
                  <Input
                    placeholder="e.g., Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-card border-border text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-card border-border text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-card border-border text-sm">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Priority Level</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-card border-border text-sm">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General Question</SelectItem>
                      <SelectItem value="normal">Normal - Standard Issue</SelectItem>
                      <SelectItem value="high">High - Feature Blocking</SelectItem>
                      <SelectItem value="urgent">Urgent - Account / Export Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Subject *</label>
                <Input
                  placeholder="Brief summary of your inquiry..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="bg-card border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Message Details *</label>
                <Textarea
                  placeholder="Please describe your question or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="bg-card border-border min-h-[140px] text-sm leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Your email is secure and will only be used to reply to your inquiry.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send to help@aifilmz.app
                    </span>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );

  if (user) {
    return <AppLayout>{formContent}</AppLayout>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold font-display text-foreground">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          <img src={logoImg} alt="That's A Wrap" className="h-8 object-contain logo-gold-ring" />
          <span>That's A Wrap</span>
        </Link>
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign In</Button>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto">{formContent}</main>
    </div>
  );
};

export default Contact;
