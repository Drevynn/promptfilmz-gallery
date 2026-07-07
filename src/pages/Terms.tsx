import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo-circle.png";

const Terms = () => {
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
          <h1 className="text-3xl font-bold text-gold-blue-shimmer">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 31, 2026</p>
        </motion.div>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <a href="https://aifilmz.app" className="text-primary underline">aifilmz.app</a> ("That's A Wrap",
              the "Service"), you agree to be bound by these Terms of Service. If you do not
              agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">2. Accounts</h2>
            <p>
              You must provide accurate information when creating an account and are responsible
              for safeguarding your credentials. You must be at least 13 years old to use That's A Wrap.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">3. Credits, Plans & Billing</h2>
            <p>
              That's A Wrap operates on a credit system (text 1, image 2, audio/director 3, video 10).
              Paid plans (Pro, Studio) are billed via Stripe. Credits are deducted only on
              successful generation. Subscriptions renew automatically until cancelled from
              Settings. Refunds are at our discretion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">4. Your Content</h2>
            <p>
              You retain all rights to scripts, storyboards, videos, and music you create with
              That's A Wrap. By using the Service, you grant us a limited license to process and store
              your content solely to operate the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">5. Acceptable Use</h2>
            <p>You agree not to use That's A Wrap to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate illegal, harmful, hateful, or sexually explicit content involving minors.</li>
              <li>Infringe intellectual property rights or impersonate others.</li>
              <li>Reverse-engineer, abuse rate limits, or attempt to bypass paywalls.</li>
              <li>Submit content to the Indie Fest that you do not own or have rights to.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">6. AI Output Disclaimer</h2>
            <p>
              AI-generated output may be inaccurate, inconsistent, or unintentionally similar to
              existing works. You are responsible for reviewing and using generated content
              appropriately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">7. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these Terms. You may delete your
              account at any time from Settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">8. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties. To the maximum extent permitted
              by law, That's A Wrap is not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">9. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after
              changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gold-blue-shimmer">10. Contact</h2>
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

export default Terms;
