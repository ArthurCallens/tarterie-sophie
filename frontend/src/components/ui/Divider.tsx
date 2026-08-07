import { motion } from "framer-motion";
import { CupcakeSwing } from "../motion/CupcakeSwing";
import { FloatingTreat } from "../motion/FloatingTreat";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export function Divider({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      className={className}
      width="120"
      height="24"
      viewBox="0 0 120 24"
      fill="none"
      aria-hidden="true"
      animate={reduced ? {} : { y: [0, -3, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M2 12c6-10 12-10 18 0s12 10 18 0 12-10 18 0 12 10 18 0 12-10 18 0 12 10 18 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export function PageBanner({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-20">
      <CupcakeSwing className="right-4 top-0 hidden sm:block md:right-14" scale={0.85} />
      <FloatingTreat variant="cookie" className="left-2 top-10 hidden sm:block md:left-10" />
      <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-cacao sm:text-5xl">{title}</h1>
      <Divider className="mx-auto mt-5 text-rose" />
      {intro && <p className="mt-5 text-lg text-cacao-soft">{intro}</p>}
    </div>
  );
}
