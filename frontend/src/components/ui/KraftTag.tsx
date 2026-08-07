import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useReducedMotion } from "../../lib/use-reduced-motion";

type KraftTagProps = {
  price: string;
  suffix?: string;
  rotate?: number;
  className?: string;
};

export function KraftTag({ price, suffix = "EUR/pp", rotate = -6, className }: KraftTagProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn("relative select-none origin-top drop-shadow-[var(--shadow-tag)]", className)}
      animate={reduced ? { rotate } : { rotate: [rotate - 4, rotate + 4, rotate - 4] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.1, rotate: 0 }}
    >
      <svg
        width="30"
        height="34"
        viewBox="0 0 30 34"
        className="absolute -top-7 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <path
          d="M15 0 C 5 6, 25 14, 15 22"
          fill="none"
          stroke="#a3814f"
          strokeWidth="1.5"
          strokeDasharray="3 2.5"
        />
      </svg>
      <div className="relative rounded-md bg-kraft px-3.5 py-2 text-center ring-1 ring-kraft-dark/40">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-cream ring-1 ring-kraft-dark/50"
        />
        <p className="mt-2 font-stamp text-[13px] font-bold leading-none text-cacao">
          {price}
          <span className="ml-1 text-[10px] font-normal text-cacao-soft">{suffix}</span>
        </p>
      </div>
    </motion.div>
  );
}
