import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useReducedMotion } from "../../lib/use-reduced-motion";

type WaxBadgeProps = {
  label: string;
  detail: string;
  className?: string;
};

export function WaxBadge({ label, detail, className }: WaxBadgeProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      animate={reduced ? {} : { rotate: [-3, 3, -3] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.08, rotate: 0 }}
      className={cn(
        "flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-cherry text-center text-cream shadow-[var(--shadow-tag)] ring-4 ring-cherry-dark/40",
        className,
      )}
    >
      <span className="font-display text-[11px] font-semibold uppercase leading-tight tracking-wide px-2">
        {label}
      </span>
      <span className="mt-1 font-stamp text-[10px] leading-none opacity-90">{detail}</span>
    </motion.div>
  );
}
