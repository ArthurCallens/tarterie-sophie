import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useReducedMotion } from "../../lib/use-reduced-motion";

type Variant = "donut" | "cookie" | "macaron";

function DonutSvg() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="22" fill="#dd9aa0" stroke="#9c332b" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="8" fill="#fbf3e6" stroke="#9c332b" strokeWidth="1.2" />
      <path
        d="M10 22c4-4 10-6 18-6s14 2 18 6"
        stroke="#fbf3e6"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
        fill="none"
      />
      <rect x="16" y="14" width="6" height="2.4" rx="1.2" fill="#c2453b" transform="rotate(15 16 14)" />
      <rect x="34" y="12" width="6" height="2.4" rx="1.2" fill="#f3d9a0" transform="rotate(-20 34 12)" />
      <rect x="24" y="9" width="6" height="2.4" rx="1.2" fill="#a3814f" transform="rotate(50 24 9)" />
    </svg>
  );
}

function CookieSvg() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="21" fill="#f3d9a0" stroke="#a3814f" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="2.6" fill="#6b5646" />
      <circle cx="31" cy="16" r="2.2" fill="#6b5646" />
      <circle cx="35" cy="28" r="2.6" fill="#6b5646" />
      <circle cx="20" cy="32" r="2.2" fill="#6b5646" />
      <circle cx="27" cy="36" r="2.4" fill="#6b5646" />
      <circle cx="14" cy="27" r="2" fill="#6b5646" />
    </svg>
  );
}

function MacaronSvg() {
  return (
    <svg width="60" height="44" viewBox="0 0 60 44" fill="none">
      <path
        d="M6 16c0-6 8-10 24-10s24 4 24 10c0 3-2 5-4 6 2 1 4 3 4 6 0 6-10 10-24 10S6 34 6 28c0-3 2-5 4-6-2-1-4-3-4-6Z"
        fill="#dd9aa0"
        stroke="#9c332b"
        strokeWidth="1.5"
      />
      <ellipse cx="30" cy="22" rx="18" ry="5" fill="#fbf3e6" stroke="#c9a876" strokeWidth="1.2" />
    </svg>
  );
}

const VARIANTS: Record<Variant, typeof DonutSvg> = {
  donut: DonutSvg,
  cookie: CookieSvg,
  macaron: MacaronSvg,
};

export function FloatingTreat({
  variant,
  className,
  delay = 0,
}: {
  variant: Variant;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const Svg = VARIANTS[variant];

  return (
    <motion.div
      className={cn("pointer-events-none absolute z-10", className)}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.3, rotate: -12 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 260, damping: 12, delay }}
    >
      <motion.div
        animate={reduced ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <Svg />
      </motion.div>
    </motion.div>
  );
}
