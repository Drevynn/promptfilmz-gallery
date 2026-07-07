import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Route-level transition wrapper.
 * - Default: gentle fade + 6px lift on pathname change.
 * - prefers-reduced-motion: cross-fade only, no movement, faster timing.
 * Uses `mode="wait"` so the outgoing route fully exits before the next enters,
 * keeping the transition synchronized across pages.
 */
const RouteTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;

  const variants: Variants = reduced
    ? {
        initial: { opacity: 0 },
        enter: { opacity: 1, transition: { duration: 0.18, ease: "linear" } },
        exit: { opacity: 0, transition: { duration: 0.12, ease: "linear" } },
      }
    : {
        initial: { opacity: 0, y: 6 },
        enter: {
          opacity: 1,
          y: 0,
          transition: {
            opacity: { duration: 0.32, ease: "easeOut" },
            y: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
          },
        },
        exit: {
          opacity: 0,
          y: -4,
          transition: {
            opacity: { duration: 0.18, ease: "easeIn" },
            y: { duration: 0.2, ease: [0.4, 0, 1, 1] },
          },
        },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ willChange: reduced ? "opacity" : "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default RouteTransition;
