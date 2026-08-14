import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, Eye, FileText, Mail, HelpCircle, ArrowLeft,
  CheckCircle2, Server, Cookie, BarChart3, Database, UserCheck, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo-circle.png";
import { AnalyticsConsentManager } from "@/components/AnalyticsConsentManager";

const Privacy = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"policy" | "choices">("policy");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            <img src={logoImg} alt="Prompt Filmz" className="h-8 object-contain logo-gold-ring" />
            <span>Prompt Filmz</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Terms of Service
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

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        {/* Title Banner */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Google Analytics 4 Compliance</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Privacy Policy & Data Choices
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Your privacy and creative intellectual property are our top priorities. Learn how we handle your data and manage your Google Analytics 4 (GA4) consent choices below.
          </p>

          <div className="text-xs text-muted-foreground font-mono">
            Effective Date: <span className="text-foreground font-semibold">July 20, 2026</span> · Version 3.2
          </div>

          {/* Toggle Tab Bar */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-card border border-border">
              <button
                onClick={() => setActiveTab("policy")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "policy"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Privacy Policy Document
              </button>
              <button
                onClick={() => setActiveTab("choices")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "choices"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                GA4 & Cookie Choice Form
              </button>
            </div>
          </div>
        </div>

        {/* Tab 2: Embedded GA4 Choice Form */}
        {activeTab === "choices" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AnalyticsConsentManager />
          </motion.div>
        )}

        {/* Tab 1: Full Policy Document */}
        {activeTab === "policy" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Direct Link to Interactive Choice Form Banner */}
            <div className="neo-card rounded-2xl p-5 border border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Want to update your Google Analytics 4 preferences?</h3>
                  <p className="text-xs text-muted-foreground">You can manage explicit consent parameters under Google Consent Mode v2 right now.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("choices")} className="shrink-0 text-xs font-semibold">
                Open Choice Form
              </Button>
            </div>

            {/* Document Content Sections */}
            <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
              {/* Section 1 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">1.</span>
                  <span>Overview & Scope</span>
                </h2>
                <p>
                  Prompt Filmz (<strong className="text-foreground">aifilmz.app</strong>, "we", "us", or "our") is an AI-native filmmaking studio platform. This Privacy Policy governs the collection, storage, processing, and protection of personal data when you use our website, application tools, APIs, and associated services.
                </p>
                <p>
                  By creating an account or interacting with our tools (including Script Editor, Director AI, Character Bible, Storyboards, AI Studio Video Generator, and AI Music), you acknowledge the data handling practices described in this policy.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">2.</span>
                  <span>Information We Collect</span>
                </h2>
                <p>We collect information through three primary categories:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">A. Account & Profile Data:</strong> Email address, display name, profile avatar, authentication identifiers (Google OAuth / Firebase Auth), and account creation timestamps.
                  </li>
                  <li>
                    <strong className="text-foreground">B. Creative Project Content:</strong> Scripts, scene sluglines, shot breakdowns, prompt texts, generated images, video render outputs, AI audio compositions, and timeline project state. Your projects are private to your account unless explicitly published to the Golden Hour Indie Fest.
                  </li>
                  <li>
                    <strong className="text-foreground">C. Usage & Telemetry Data:</strong> Credit consumption logs, tool interaction counts, browser specifications, page view routes, error diagnostic codes, and anonymized Google Analytics 4 (GA4) events.
                  </li>
                  <li>
                    <strong className="text-foreground">D. Billing & Transaction Data:</strong> Subscription tier history, payment confirmation receipts, and credit package purchases. Payments are processed securely via Stripe; we never store full credit card numbers on our servers.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">3.</span>
                  <span>Google Analytics 4 (GA4) & Consent Mode v2 Compliance</span>
                </h2>
                <p>
                  We utilize Google Analytics 4 (GA4) to evaluate web traffic, page performance, and application stability. In accordance with European Union ePrivacy Directives, GDPR, and US State Privacy Laws (CCPA/CPRA), we implement <strong className="text-foreground">Google Consent Mode v2</strong>.
                </p>
                <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Explicit Consent Parameters Managed:</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code className="text-primary font-mono font-semibold">analytics_storage</code> — Grants permission to store analytics cookies to measure visits and performance.</li>
                    <li><code className="text-primary font-mono font-semibold">ad_storage</code> — Controls storage of ad-related identifiers.</li>
                    <li><code className="text-primary font-mono font-semibold">ad_user_data</code> — Sets consent for sending end-user data to Google for advertising measurement.</li>
                    <li><code className="text-primary font-mono font-semibold">ad_personalization</code> — Controls consent for personalized retargeting advertisements.</li>
                  </ul>
                </div>
                <p>
                  You can grant or revoke any of these parameters at any time using our embedded <strong className="text-foreground">Analytics Choice Form</strong> above.
                </p>
              </section>

              {/* Section 4 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">4.</span>
                  <span>How We Use Your Data</span>
                </h2>
                <p>Your data is processed strictly for legitimate operational purposes:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>To execute AI model generation requests (Gemini, Luma Dream Machine, Veo, ElevenLabs).</li>
                  <li>To calculate and deduct compute credits accurately.</li>
                  <li>To render in-browser timeline video exports via WebAssembly FFmpeg.</li>
                  <li>To send transactional notifications (receipts, password resets, ticket replies).</li>
                  <li>To detect and prevent fraudulent bot activity, prompt exploitation, or service abuse.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">5.</span>
                  <span>AI Sub-Processors & Service Providers</span>
                </h2>
                <p>
                  To deliver filmmaking features, certain inputs (such as text prompts or reference images) are transmitted to secure third-party AI processing infrastructure:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Google Cloud & Gemini AI:</strong> Script expansion, Director AI shot breakdowns, and infrastructure backend.</li>
                  <li><strong className="text-foreground">Luma Dream Machine / Veo:</strong> High-definition video clip generation.</li>
                  <li><strong className="text-foreground">ElevenLabs & Music Synthesis:</strong> Audio voiceovers and soundtrack generation.</li>
                  <li><strong className="text-foreground">Stripe:</strong> Payment processing and subscription management.</li>
                  <li><strong className="text-foreground">Firebase / Google Firestore:</strong> Encrypted cloud database and user authentication.</li>
                </ul>
                <p className="text-xs text-muted-foreground italic">
                  Note: We do not sell your personal data or creative assets to third parties. AI sub-processors process data solely to execute your explicit generation commands.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">6.</span>
                  <span>Your Data Rights (GDPR / CCPA / CPRA)</span>
                </h2>
                <p>Depending on your jurisdiction, you have the following enforceable privacy rights:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li><strong className="text-foreground">Right to Access & Portability:</strong> Request a full copy of your account data and project files.</li>
                  <li><strong className="text-foreground">Right to Erasure (Right to be Forgotten):</strong> Delete your account and purge all associated Firestore projects from Settings.</li>
                  <li><strong className="text-foreground">Right to Rectification:</strong> Update or correct your profile data at any time.</li>
                  <li><strong className="text-foreground">Right to Opt-Out of Tracking:</strong> Toggle GA4 analytics cookies off at any time using our choice form.</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section className="space-y-3 neo-card rounded-2xl p-6 sm:p-8 border border-border bg-card/60">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono">7.</span>
                  <span>Contact Us & Privacy Officers</span>
                </h2>
                <p>
                  For privacy inquiries, data deletion requests, or regulatory questions, please contact our privacy response desk:
                </p>
                <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
                  <p><strong className="text-foreground">Privacy Email:</strong> <span className="font-mono text-primary font-semibold">help@aifilmz.app</span></p>
                  <p><strong className="text-foreground">Direct Desk Form:</strong> <Link to="/contact" className="text-primary underline">aifilmz.app/contact</Link></p>
                  <p><strong className="text-foreground">Response Time:</strong> Within 48 business hours.</p>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex justify-center gap-6">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors text-primary font-semibold">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </div>
        <p>© 2026 Prompt Filmz. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Privacy;
