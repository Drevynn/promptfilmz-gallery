import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Shield, ArrowLeft, Mail, Scale, Sparkles, CheckCircle2,
  AlertTriangle, CreditCard, Lock, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo-circle.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            <img src={logoImg} alt="That's A Wrap" className="h-8 object-contain logo-gold-ring" />
            <span>That's A Wrap</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Privacy Policy
            </Link>
            <Link to="/contact">
              <Button variant="default" size="sm" className="text-xs font-semibold gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Desk</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        {/* Title Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Scale className="w-4 h-4" />
            <span>Legal Framework & Service Terms</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Please read these Terms of Service carefully before using That's A Wrap. By accessing or using our platform, you agree to be bound by these conditions.
          </p>

          <div className="text-xs text-muted-foreground font-mono">
            Effective Date: <span className="text-foreground font-semibold">July 20, 2026</span> · Version 4.0
          </div>
        </div>

        {/* Navigation Quick Bar */}
        <div className="neo-card rounded-2xl p-4 border border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Looking for our data privacy choices or Google Analytics 4 settings?</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="text-primary underline font-semibold hover:text-primary/80">
              Go to Privacy Policy & GA4 Consent Form →
            </Link>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">1.</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Director", or "you") and That's A Wrap (<strong className="text-foreground">aifilmz.app</strong>, "we", "us", or "our").
            </p>
            <p>
              By signing up for an account, purchasing credit packages, generating content, or utilizing any studio tools (including Script Editor, Director AI, Character Bible, Storyboard, AI Studio Video Generator, AI Music, Timeline Editor, and Golden Hour Indie Fest), you confirm that you have read, understood, and agree to these Terms. If you do not agree, you must immediately discontinue use of the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">2.</span>
              <span>Account Registration & Eligibility</span>
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Minimum Age Requirement:</strong> You must be at least 13 years old to use That's A Wrap. If you are between 13 and 18 years old, you must review these Terms with a parent or legal guardian.
              </li>
              <li>
                <strong className="text-foreground">Account Accuracy:</strong> You agree to provide accurate, complete information when creating an account via Google OAuth or email sign-in.
              </li>
              <li>
                <strong className="text-foreground">Credential Security:</strong> You are solely responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">3.</span>
              <span>Credits, Billing & Subscription Terms</span>
            </h2>
            <p>
              That's A Wrap operates on a credit-based compute system for AI generation tasks:
            </p>
            <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
              <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Credit Deduction Structure:</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Storyboard Keyframe Images:</strong> 2 credits per image.</li>
                <li><strong className="text-foreground">AI Music Soundtrack Renders:</strong> 3 credits per track.</li>
                <li><strong className="text-foreground">AI Studio Video Clips (Veo3 / Luma):</strong> 10 credits per video clip.</li>
                <li><strong className="text-foreground">Director AI Shot Breakdown:</strong> 1 to 2 credits per scene.</li>
                <li><strong className="text-foreground">Free Core Actions:</strong> Scriptwriting, Character Bible setup, Shot List reordering, timeline editing, and MP4 video rendering are 100% free.</li>
              </ul>
            </div>
            <p>
              Credits are deducted only upon successful generation. All paid plans (Pro and Studio) and credit packages are billed securely via <strong className="text-foreground">Stripe</strong>. Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to renewal via the Settings page.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Refund Policy: Unused credits may be refunded within 14 days of purchase upon written request to help@aifilmz.app, provided no significant credit consumption has occurred.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">4.</span>
              <span>Intellectual Property & Content Ownership</span>
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Your Content Rights:</strong> You retain full ownership, commercial rights, and copyright to all scripts, screenplays, character concepts, custom prompts, and final assembled MP4 films created using That's A Wrap.
              </li>
              <li>
                <strong className="text-foreground">Platform License:</strong> By generating content, you grant That's A Wrap a limited, non-exclusive, worldwide license solely to process, render, host, and store your media assets to operate the studio application.
              </li>
              <li>
                <strong className="text-foreground">Golden Hour Indie Fest Submissions:</strong> If you voluntarily submit a shot or project to the Golden Hour Indie Fest (/festival), you grant us permission to display the submission in the public festival gallery for community viewing and voting.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">5.</span>
              <span>Acceptable Use & Community Guidelines</span>
            </h2>
            <p>You agree NOT to use That's A Wrap to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Generate illegal content, child sexual abuse material (CSAM), or content violating minor safety.</li>
              <li>Create non-consensual sexually explicit deepfakes, hate speech, or content promoting violence against protected groups.</li>
              <li>Infringe third-party copyrights, trademarks, or publicity rights without authorization.</li>
              <li>Attempt to reverse-engineer AI model weights, bypass credit paywalls, or run automated web scraping bots against studio endpoints.</li>
              <li>Submit fake votes or manipulate leaderboard standings in the Golden Hour Indie Fest.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">6.</span>
              <span>AI Generation Disclaimers</span>
            </h2>
            <p>
              AI generation outputs (text, imagery, video, audio) are produced by generative probabilistic models. You acknowledge that AI output may occasionally contain unexpected visual artifacts, non-deterministic variations, or unintended similarities to existing media.
            </p>
            <p>
              You are responsible for inspecting generated assets before distributing or commercializing them.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">7.</span>
              <span>Analytics & Privacy Compliance</span>
            </h2>
            <p>
              Our handling of personal data, Google Analytics 4 (GA4) telemetry, and Google Consent Mode v2 choices is governed by our <Link to="/privacy" className="text-primary underline font-semibold">Privacy Policy</Link>. You may update your cookie choices at any time on the Privacy page.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">8.</span>
              <span>Limitation of Liability & Termination</span>
            </h2>
            <p>
              To the maximum extent permitted by applicable law, That's A Wrap and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the studio platform or temporary service outages.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">9.</span>
              <span>Contact Us</span>
            </h2>
            <p>If you have questions regarding these Terms of Service, please reach out to our legal support desk:</p>
            <div className="p-4 rounded-xl bg-card border border-border space-y-1 text-xs">
              <p><strong className="text-foreground">Email:</strong> <span className="font-mono text-primary font-semibold">help@aifilmz.app</span></p>
              <p><strong className="text-foreground">Direct Desk:</strong> <Link to="/contact" className="text-primary underline">aifilmz.app/contact</Link></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex justify-center gap-6">
          <Link to="/terms" className="hover:text-foreground transition-colors text-primary font-semibold">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </div>
        <p>© 2026 That's A Wrap. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Terms;
