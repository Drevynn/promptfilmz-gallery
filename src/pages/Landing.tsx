import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useReducedMotion, type Variants } from "framer-motion";
import { forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, FileText, Music, Video, Image, ListChecks, Star, ArrowRight, Check, Sparkles, Zap, Shield, Menu, X } from "lucide-react";
import logoImg from "@/assets/logo-circle.png";
import heroImg from "@/assets/images/hero_chair_wrap_1784685238120.jpg";
import { useMemo, useRef, useState } from "react";

import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const features = [
{ icon: FileText, title: "AI Script Editor", desc: "Write professional screenplays with AI-powered formatting and real-time suggestions.", neon: "pink" },
{ icon: Image, title: "Storyboard Studio", desc: "Plan every scene visually with AI-generated storyboard frames and drag-and-drop.", neon: "cyan" },
{ icon: ListChecks, title: "Shot List Tracker", desc: "Organize shots, angles, and equipment for seamless production.", neon: "pink" },
{ icon: Sparkles, title: "AI Scene Generator", desc: "Generate stunning cinematic scene images from text prompts.", neon: "cyan" },
{ icon: Film, title: "Timeline Editor", desc: "Assemble your final cut with a professional video editor and MP4 export.", neon: "purple" },
{ icon: Music, title: "AI Music Studio", desc: "Compose original soundtracks with mood and genre control.", neon: "pink" },
{ icon: Video, title: "AI Video Generation", desc: "Generate AI video clips from text prompts with cinematic quality.", neon: "cyan" }];


const testimonials = [
{ name: "Early Tester", role: "Beta User", text: "The AI Script Editor and Scene Generator are genuinely impressive. This is a real tool, not a demo.", avatar: "ET" },
{ name: "Beta Feedback", role: "Indie Creator", text: "Being able to go from script to storyboard with AI in one app is a game-changer for pre-production.", avatar: "BF" },
{ name: "First Look", role: "Film Student", text: "I love that everything actually works — no fake buttons. The Director AI ties it all together.", avatar: "FL" }];


const plans = [
{ name: "Starter", price: "Free", features: ["1 Project", "Basic Script Editor", "5 AI Generations/mo", "No Credit Card Required"], cta: "Get Started", popular: false, priceId: null },
{ name: "Pro", price: "$29/mo", features: ["Unlimited Projects", "All Live AI Tools", "500 AI Generations/mo", "AI Scene Generator", "Storyboard Images"], cta: "Go Pro", popular: true, priceId: "price_1TEJMZ7pm1sWSXu2cMZxcH3J" },
{ name: "Studio", price: "$79/mo", features: ["Everything in Pro", "Unlimited AI Generations", "Director AI", "Priority Support", "Early access to Video & Music"], cta: "Go Studio", popular: false, priceId: "price_1TEJN07pm1sWSXu2GWmTPF5r" }];


const neonColors: Record<string, string> = {
  pink: "text-[var(--gold)]",
  cyan: "text-[var(--electric-blue)]",
  purple: "text-[var(--deep-blue-bright)]"
};

/* ─── Shared hero entrance timeline ───
   One source of truth for badge + logo so they stay synced
   across re-renders, route transitions, and prop changes. */
/* Reduced-motion-aware variant factories.
   When prefers-reduced-motion is enabled we drop translate/scale/rotate
   and use a quick opacity fade — keeping the same orchestration order. */
const buildHeroStackVariants = (reduced: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: reduced ? 0 : 0.55,
      staggerChildren: reduced ? 0.05 : 0.12,
      when: "beforeChildren",
    },
  },
});

const buildHeroBadgeVariants = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
      }
    : {
        hidden: { opacity: 0, scale: 0.92, y: 8 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            opacity: { duration: 0.45, ease: "easeOut" },
            y: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            scale: { type: "spring", stiffness: 220, damping: 18 },
          },
        },
      };

const buildHeroLogoVariants = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25, ease: "linear" } },
      }
    : {
        hidden: { opacity: 0, scale: 0.75, y: 16, rotate: -4 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          rotate: 0,
          transition: {
            opacity: { duration: 0.45, ease: "easeOut" },
            y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            rotate: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            scale: { type: "spring", stiffness: 220, damping: 16 },
          },
        },
      };

const buildHeroSubtitleVariants = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
      }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            opacity: { duration: 0.5, ease: "easeOut" },
            y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          },
        },
      };

const buildHeroCtasVariants = (reduced: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: reduced ? 0.04 : 0.1, when: "beforeChildren" },
  },
});

const buildHeroCtaItemVariants = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
      }
    : {
        hidden: { opacity: 0, y: 16, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            opacity: { duration: 0.45, ease: "easeOut" },
            y: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            scale: { type: "spring", stiffness: 220, damping: 18 },
          },
        },
      };

/* Floating orb component */
const Orb = forwardRef<HTMLDivElement, {className: string;delay?: number;}>(
  ({ className, delay = 0 }, ref) =>
  <motion.div
    ref={ref}
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3]
    }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }} />


);

/* Stat pill */
const StatPill = ({ value, label, delay }: {value: string;label: string;delay: number;}) =>
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay }}
  className="glass-panel-strong rounded-xl px-5 py-3 text-center">
  
    <p className="text-2xl font-bold text-gold-shimmer font-display">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </motion.div>;


const PricingCTA = ({ plan }: { plan: typeof plans[number] }) => {
  const { user } = useAuth();
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!plan.priceId) return; // free tier → just link to auth
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setLoading(true);
    try {
      await startCheckout(plan.priceId);
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!plan.priceId) {
    return (
      <Link to="/auth">
        <Button className="w-full bg-secondary hover:bg-secondary/80">{plan.cta}</Button>
      </Link>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90 shadow-[0_0_15px_var(--neon-pink-30)]" : "bg-secondary hover:bg-secondary/80"}`}>
      {loading ? "Redirecting…" : plan.cta}
    </Button>
  );
};

const Landing = () => {
  const heroRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const logoY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -120]);

  /* ─── Hero logo cursor-follow parallax ───
     Layered onto the entrance animation via CSS transform composition,
     so Framer Motion's variants for opacity/scale/y/rotate stay untouched. */
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const logoTiltX = useSpring(pointerY, { stiffness: 80, damping: 18, mass: 0.6 });
  const logoTiltY = useSpring(pointerX, { stiffness: 80, damping: 18, mass: 0.6 });
  const logoOffsetX = useSpring(pointerX, { stiffness: 60, damping: 20, mass: 0.8 });
  const logoOffsetY = useSpring(pointerY, { stiffness: 60, damping: 20, mass: 0.8 });
  // Map normalized pointer (-1 → 1) to subtle tilt (deg) and translate (px)
  const rotateX = useTransform(logoTiltX, [-1, 1], [6, -6]);
  const rotateY = useTransform(logoTiltY, [-1, 1], [-8, 8]);
  const translateX = useTransform(logoOffsetX, [-1, 1], [-10, 10]);
  const translateY = useTransform(logoOffsetY, [-1, 1], [-6, 6]);

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerX.set(Math.max(-1, Math.min(1, nx)));
    pointerY.set(Math.max(-1, Math.min(1, ny)));
  };

  const handleHeroPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  /* Reduced-motion-aware variants — rebuilt only when the preference flips. */
  const reduced = !!prefersReducedMotion;
  const heroStackVariants = useMemo(() => buildHeroStackVariants(reduced), [reduced]);
  const heroBadgeVariants = useMemo(() => buildHeroBadgeVariants(reduced), [reduced]);
  const heroLogoVariants = useMemo(() => buildHeroLogoVariants(reduced), [reduced]);
  const heroSubtitleVariants = useMemo(() => buildHeroSubtitleVariants(reduced), [reduced]);
  const heroCtasVariants = useMemo(() => buildHeroCtasVariants(reduced), [reduced]);
  const heroCtaItemVariants = useMemo(() => buildHeroCtaItemVariants(reduced), [reduced]);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/wiki", label: "Wiki", isRoute: true },
    { href: "/contact", label: "Contact", isRoute: true },
    { href: "/faq", label: "FAQ", isRoute: true },
    { href: "/help", label: "Help", isRoute: true }
  ];


  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold font-display text-foreground hover:opacity-90 transition-opacity">
            <span>That's A Wrap</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {navLinks.map((link) =>
            link.isRoute ?
            <Link key={link.href} to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link> :

            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">{link.label}</a>

            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="neo-btn-pink rounded-lg shadow-[0_0_15px_var(--gold-30)] hover:shadow-[0_0_20px_var(--gold-30)] transition-shadow">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu">
              
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl">
            
              <div className="px-6 py-4 flex flex-col gap-3">
                {navLinks.map((link) =>
              link.isRoute ?
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                
                      {link.label}
                    </Link> :

              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                
                      {link.label}
                    </a>

              )}
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="sm:hidden">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">Sign In</Button>
                </Link>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section
        ref={heroRef}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
        className="relative min-h-[100vh] flex items-center justify-center px-6 pt-24 sm:pt-20 pb-12 overflow-hidden"
      >
        {/* Ambient orbs */}
        <motion.div style={{ y: orb1Y }} className="absolute -top-32 -left-40 pointer-events-none">
          <Orb className="w-[500px] h-[500px] bg-[var(--gold)]/15" delay={0} />
        </motion.div>
        <motion.div style={{ y: orb2Y }} className="absolute top-1/4 -right-32 pointer-events-none">
          <Orb className="w-[400px] h-[400px] bg-[var(--electric-blue)]/10" delay={2} />
        </motion.div>
        <motion.div style={{ y: orb3Y }} className="absolute bottom-20 left-1/4 pointer-events-none">
          <Orb className="w-[350px] h-[350px] bg-[var(--amber)]/10" delay={4} />
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_30%,var(--w3-void)_80%)]" />


        {/* Content */}
        <motion.div style={{ opacity }} className="relative z-10 max-w-7xl mx-auto text-center">

          {/* Headline with parallax */}
          <motion.div style={{ y: textY }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}>

              <p className="neo-label text-[var(--gold)] mb-4 tracking-[0.15em]">
                <Sparkles className="w-4 h-4 inline mr-1 -mt-0.5" />
                Next-Gen Filmmaking
              </p>
              {/* Shared timeline: logo + headline + subtitle animate from one orchestrator */}
              <motion.div
                variants={heroStackVariants}
                initial="hidden"
                animate="visible"
                className="contents">
                <div className="relative inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6 mt-1 mb-3 sm:mb-4 md:mb-5">
                  {/* Hero logo — sits to the left of the headline */}
                  <motion.div
                    className="shrink-0 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80"
                    style={{
                      transformPerspective: 700,
                      rotateX,
                      rotateY,
                      x: translateX,
                      y: translateY,
                      willChange: "transform",
                    }}
                  >
                    <motion.img
                      src={heroImg}
                      alt="Director's chair with That's a wrap gold lettering"
                      referrerPolicy="no-referrer"
                      width={288}
                      height={288}
                      loading="eager"
                      // @ts-expect-error: fetchpriority is a valid HTML attribute, not yet typed in React
                      fetchpriority="high"
                      decoding="async"
                      className="block w-full h-full object-cover rounded-2xl shadow-[0_0_50px_rgba(212,148,10,0.30)] border border-white/10"
                      variants={heroLogoVariants}
                      whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 220, damping: 14 } }}
                      style={{ willChange: "transform, opacity" }}
                    />
                  </motion.div>

                  <motion.h1
                    variants={heroBadgeVariants}
                    className="text-gold-blue-shimmer font-normal text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] leading-[1] tracking-tight drop-shadow-[0_2px_24px_rgba(212,148,10,0.35)] motion-reduce:animate-none"
                    style={{ fontFamily: "'Cinzel', serif", willChange: "background-position, filter" }}



                  >
                    That's a wrap,
                  </motion.h1>
                </div>



                {/* Subtitle — next beat in the synchronized timeline */}
                <motion.p
                  variants={heroSubtitleVariants}
                  className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--gold)] max-w-2xl md:max-w-3xl mx-auto mt-4 mb-8 sm:mb-10 leading-tight tracking-wide">
                  your AI-powered movie studio
                </motion.p>



                {/* CTA buttons — final beat, staggered after subtitle */}
                <motion.div
                  variants={heroCtasVariants}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-14">
                  
                  <motion.div variants={heroCtaItemVariants} className="w-full sm:w-auto">
                    <Link to="/auth" className="block w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="glow-pulse-gold w-full sm:w-auto relative text-lg px-8 py-6 bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold)] to-[var(--amber)] text-[var(--w3-void)] font-bold shadow-[0_0_30px_var(--gold-30)] hover:shadow-[0_0_50px_var(--gold-30)] transition-shadow">
                        
                        Start Creating Free <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div variants={heroCtaItemVariants} className="w-full sm:w-auto">
                    <a href="#features" className="block w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-[var(--w3-border)] hover:border-[var(--gold-30)] hover:bg-[var(--gold-05)] transition-all">
                        See Features
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="grid grid-cols-2 gap-3 sm:gap-6 max-w-md sm:max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}>
            
            <StatPill value="0" label="Trust" delay={1.0} />
            <StatPill value="∞" label="Creativity" delay={1.1} />
          </motion.div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything You Need to <span className="text-gold-blue-shimmer">Create</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete filmmaking toolkit powered by AI — from your first draft to final export.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) =>
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`neo-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group relative ${(feat as any).comingSoon ? "opacity-80" : ""}`}>
              
                {(feat as any).comingSoon && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      Coming Soon
                    </span>
                  </div>
                )}
                <feat.icon className={`w-8 h-8 mb-4 ${neonColors[feat.neon]} group-hover:drop-shadow-[0_0_8px_currentColor] transition-all`} />
                <h3 className="font-display font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-[var(--neo-surface)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Loved by <span className="text-gold-blue-shimmer">Creators</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) =>
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="neo-card rounded-xl p-6">
              
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) =>
                <Star key={j} className="w-4 h-4 fill-[var(--neon-yellow-raw)] text-[var(--neon-yellow-raw)]" />
                )}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Simple <span className="text-gold-blue-shimmer">Pricing</span>
            </h2>
            <p className="text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) =>
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`neo-card rounded-xl p-6 relative ${plan.popular ? "border-primary/50 shadow-[0_0_30px_var(--neon-pink-10)]" : ""}`}>
              
                {plan.popular &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-[0_0_15px_var(--neon-pink-30)]">
                    Most Popular
                  </div>
              }
                <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) =>
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                    </li>
                )}
                </ul>
                <PricingCTA plan={plan} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="That's A Wrap" className="h-8 object-contain logo-gold-ring" referrerPolicy="no-referrer" />
            <span className="font-display font-semibold text-sm">That's A Wrap</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/wiki" className="hover:text-foreground transition-colors">Wiki</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
            <Link to="/install" className="hover:text-foreground transition-colors text-gold-shimmer">Install App</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 That's A Wrap. All rights reserved.</p>
        </div>
      </footer>
    </div>);

};

export default Landing;