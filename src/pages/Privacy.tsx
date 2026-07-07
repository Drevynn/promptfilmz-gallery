import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo-circle.png";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center mb-4">
            <Link to="/">
              <img src={logoImg} alt="That's A Wrap" className="h-14 object-contain logo-gold-ring" />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gold-blue-shimmer">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 31, 2026</p>
        </motion.div>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">1. Introduction</h2>
            <p>
              That's A Wrap ("we", "us") operates <a href="https://aifilmz.app" className="text-primary underline">aifilmz.app</a> — an
              AI-native filmmaking studio. This Privacy Policy explains what data we collect,
              how we use it, and the choices you have.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> email, display name, and authentication metadata (Google/Apple sign-in identifiers).</li>
              <li><strong>Project data:</strong> scripts, scenes, shots, storyboards, generated images, video clips, and music you create.</li>
              <li><strong>Usage data:</strong> page views, feature usage, credit consumption, and anonymized analytics events.</li>
              <li><strong>Billing data:</strong> handled by our payment processor (Stripe). We do not store full card numbers.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">3. How We Use Your Data</h2>
            <p>
              We use your data to operate the service, render AI generations, enforce credit
              limits, send transactional emails (password resets, magic links, receipts), and
              improve product quality. We do not sell your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">4. AI Generation</h2>
            <p>
              Prompts you submit are sent to our AI providers (including Google Gemini, Luma
              Dream Machine, and ElevenLabs) solely to fulfill your request. Your projects remain
              private to your account and are protected by row-level security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">5. Storage & Security</h2>
            <p>
              Data is stored on Lovable Cloud infrastructure with encryption in transit and at
              rest. Access is owner-scoped — only you can read or modify your projects.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">6. Your Rights</h2>
            <p>
              You may export, edit, or delete your projects at any time from the dashboard. To
              delete your account or request a data export, contact us at{" "}
              <a href="mailto:support@aifilmz.app" className="text-primary underline">support@aifilmz.app</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">7. Contact</h2>
            <p>
              Questions? Reach us at{" "}
              <a href="mailto:support@aifilmz.app" className="text-primary underline">support@aifilmz.app</a>.
            </p>
          </section>
        </div>

        <div className="text-center pt-8">
          <Link to="/" className="text-primary underline text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
