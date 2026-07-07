import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Image, ListChecks, Film, Video, Music, Settings,
  ChevronLeft, ChevronRight, BarChart3, BookOpen, Menu, X, Clapperboard, Trophy,
  Sun, Moon, Crown, Users,
} from "lucide-react";
import logoImg from "@/assets/logo-circle.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", neon: "pink" },
  { icon: FileText, label: "Script", path: "/script", neon: "cyan" },
  { icon: ListChecks, label: "Shot List", path: "/shots", neon: "pink" },
  { icon: Image, label: "Storyboard", path: "/storyboard", neon: "cyan" },
  { icon: Users, label: "Character Bible", path: "/characters", neon: "purple" },
  { icon: Video, label: "Scene Gen", path: "/ai-studio", neon: "cyan" },
  { icon: Film, label: "Editor", path: "/editor", neon: "pink" },
  { icon: Music, label: "AI Music", path: "/music", neon: "purple" },
  { icon: Clapperboard, label: "Director AI", path: "/director", neon: "pink" },
  { icon: Trophy, label: "Festival", path: "/festival", neon: "purple" },
  { icon: Settings, label: "Settings", path: "/settings", neon: "pink" },
  { icon: BookOpen, label: "Learn", path: "/learn", neon: "cyan" },
  { icon: BarChart3, label: "Analytics Docs", path: "/analytics-docs", neon: "cyan" },
];

const neonStyles: Record<string, { bg: string; text: string; bar: string; glow: string }> = {
  pink: { bg: "bg-[var(--neon-pink-10)]", text: "text-[var(--neon-pink)]", bar: "bg-[var(--neon-pink)]", glow: "shadow-[0_0_10px_var(--neon-pink-30)]" },
  cyan: { bg: "bg-[var(--neon-cyan-10)]", text: "text-[var(--neon-cyan)]", bar: "bg-[var(--neon-cyan)]", glow: "shadow-[0_0_10px_var(--neon-cyan-30)]" },
  purple: { bg: "bg-[var(--neon-purple-10)]", text: "text-[var(--neon-purple)]", bar: "bg-[var(--neon-purple)]", glow: "shadow-[0_0_10px_var(--neon-purple-30)]" },
};

const tierBadgeStyles: Record<string, { bg: string; text: string; glow: string }> = {
  free: { bg: "bg-muted", text: "text-muted-foreground", glow: "" },
  pro: { bg: "bg-[var(--neon-pink-10)]", text: "text-[var(--neon-pink)]", glow: "shadow-[0_0_8px_var(--neon-pink-30)]" },
  studio: { bg: "bg-[var(--neon-purple-10)]", text: "text-[var(--neon-purple)]", glow: "shadow-[0_0_8px_var(--neon-purple-30)]" },
};

const PlanBadge = ({ collapsed }: { collapsed: boolean }) => {
  const { tier, loading } = useSubscription();
  if (loading) return null;
  const label = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Studio";
  const styles = tierBadgeStyles[tier] || tierBadgeStyles.free;
  return (
    <Link
      to="/settings"
      className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-80 ${styles.bg} ${styles.text} ${styles.glow}`}
    >
      <Crown className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="truncate">{label} Plan</span>}
    </Link>
  );
};

const ThemeToggle = ({ collapsed }: { collapsed: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--neon-pink-05)] transition-all duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
      {!collapsed && <span className="truncate">{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
};

const NavContent = ({ collapsed, location, onNavigate }: { collapsed: boolean; location: ReturnType<typeof useLocation>; onNavigate?: () => void }) => (
  <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
    {navItems.map((item) => {
      const isActive = location.pathname === item.path;
      const colors = neonStyles[item.neon];
      return (
          <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
            isActive
              ? `${colors.bg} ${colors.text} ${colors.glow}`
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--neon-pink-05)]"
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 ${colors.bar} rounded-r-full shadow-[0_0_6px_currentColor]`}
            />
          )}
          <item.icon className={`w-5 h-5 shrink-0 ${isActive ? colors.text : ""}`} />
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate flex items-center gap-2">
              {item.label}
              {(item as any).comingSoon && (
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 leading-none">Soon</span>
              )}
            </motion.span>
          )}
        </Link>
      );
    })}
  </nav>
);

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar-background border border-border text-sidebar-foreground shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile overlay + drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-50 bg-black/60"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-border bg-sidebar-background text-sidebar-foreground"
              >
                <div className="flex items-center justify-between px-4 h-16 border-b border-border">
                  <div className="flex items-center gap-3">
                    <img src={logoImg} alt="That's A Wrap" className="h-9 shrink-0 object-contain logo-gold-ring" />
                    <span className="font-display font-bold text-lg text-foreground truncate">That's A Wrap</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <NavContent collapsed={false} location={location} onNavigate={() => setMobileOpen(false)} />
                <div className="border-t border-border py-2 space-y-1">
                  <PlanBadge collapsed={false} />
                  <ThemeToggle collapsed={false} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar-background text-sidebar-foreground"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <img src={logoImg} alt="That's A Wrap" className={`shrink-0 object-contain logo-gold-ring ${collapsed ? 'h-9' : 'h-10'}`} />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display font-bold text-lg text-foreground truncate"
          >
            That's A Wrap
          </motion.span>
        )}
      </div>

      <NavContent collapsed={collapsed} location={location} />

      {/* Theme toggle + Collapse toggle */}
      <div className="border-t border-border py-2 space-y-1">
        <PlanBadge collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 p-2 mb-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--neon-pink-05)] transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
