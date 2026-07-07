import { motion } from "framer-motion";
import logoImg from "@/assets/logo-circle.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What is That's A Wrap?", a: "That's A Wrap is an AI-powered filmmaking studio that helps you create stunning short films from script to screen — including scriptwriting, storyboarding, shot planning, AI video generation via Luma Dream Machine, a multi-track video editor, and AI music generation." },
  { q: "Do I need filmmaking experience?", a: "Not at all. That's A Wrap is designed for creators at every level. The AI assists with each step — from Director AI shot breakdowns to AI-generated video clips — so you can focus on your creative vision." },
  { q: "What can I create with That's A Wrap?", a: "You can write scripts, generate storyboard images, plan shot lists, generate AI videos in the AI Studio (/ai-studio), edit on a multi-track timeline with dialog/score/sound design tracks, and create AI-generated music — all from a single dashboard." },
  { q: "How does AI Video generation work?", a: "Head to the AI Studio page and select the AI Video tab. Enter a cinematic prompt, adjust camera and motion settings, then click Generate. The Luma Dream Machine API processes your request — you'll see real-time progress (queued → dreaming → completed) with a visual indicator." },
  { q: "How much do AI features cost?", a: "AI features use credits: storyboard images cost 2 credits, AI music costs 3 credits, and AI video generation costs 10 credits. Your remaining balance is displayed on the AI Studio page and in the top bar." },
  { q: "Is my content private?", a: "Yes. Every project is tied to your account and protected by row-level security. Only you can access your scripts, storyboards, videos, and generated media." },
  { q: "Can I install That's A Wrap on my phone?", a: "Yes! That's A Wrap is a Progressive Web App (PWA). Visit the app in your mobile browser and tap 'Add to Home Screen' for a native app-like experience that works offline." },
  { q: "What AI models power That's A Wrap?", a: "We use state-of-the-art models for text generation, image synthesis (storyboards), video generation (Luma Dream Machine), and music composition — all accessible without needing your own API keys." },
  { q: "Is there a free plan?", a: "That's A Wrap offers free credits to get started. You can create projects, write scripts, and explore the tools. Paid plans (Pro and Studio) unlock higher usage limits and premium features." },
  { q: "How do I export my videos?", a: "Open the Video Editor and select your project from the dropdown — your generated shots will load onto the timeline automatically. Click the Export button in the transport bar to start. The encoder runs entirely in your browser using ffmpeg.wasm: it downloads each clip, concatenates them in order, and produces a single MP4. A progress modal shows every stage (Loading Encoder → Downloading Clips → Encoding MP4 → Complete) so you always know what's happening. When it finishes, click Download MP4 to save the file." },
  { q: "What is the AI Studio?", a: "The AI Studio (/ai-studio) is your central hub for all AI generation — storyboard images, AI video clips via Luma Dream Machine, and AI music. Each tab shows your credit balance and generation controls." },
  { q: "What is the Golden Hour Indie Fest?", a: "The Golden Hour Indie Fest is a built-in film festival where you can submit your AI-generated shots and compete for recognition. Visit /festival to browse entries, vote for your favorites, and climb the leaderboard." },
  { q: "What festival categories can I submit to?", a: "Entries compete across six tracks: Best Overall, Best Cinematography, Best VFX, Best Short, Best Editing, and Best Art Direction. Choose a category when submitting from the Export & Submit modal." },
  { q: "How does festival voting work?", a: "Every signed-in user gets 5 votes per day. Click any entry card to open the fullscreen lightbox, then hit the heart button to vote. Use arrow keys or the on-screen chevrons to browse entries without closing the viewer." },
  { q: "How do I submit to the festival?", a: "Open the Export & Submit modal from the Dashboard or Shot List, select a shot with a rendered video, toggle 'Submit to Golden Hour Indie Fest', pick a category, and click Export & Submit. Entry is free." },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center mb-4">
            <img src={logoImg} alt="That's A Wrap" className="h-14 object-contain logo-gold-ring" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
            Frequently Asked <span className="rainbow-text">Questions</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Everything you need to know about creating films with That's A Wrap.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="neo-card rounded-xl px-5 data-[state=open]:border-[var(--gold-30)] data-[state=open]:shadow-[0_0_15px_var(--gold-10)]"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4 hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <div className="text-center space-y-2">
          <a href="/learn" className="block text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            📖 Explore the full App Wiki →
          </a>
          <a href="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
