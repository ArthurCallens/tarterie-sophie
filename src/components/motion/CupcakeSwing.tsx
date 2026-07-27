import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export function CupcakeSwing({ className, scale = 1 }: { className?: string; scale?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn("absolute z-20 origin-top", className)}
      style={{ scale }}
      aria-hidden="true"
      animate={reduced ? {} : { rotate: [-9, 9, -9] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      whileHover={
        reduced
          ? {}
          : { rotate: [-22, 22, -22], transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" } }
      }
    >
      <svg width="92" height="150" viewBox="0 0 92 150" fill="none">
        {/* strings */}
        <path d="M30 0 L44 64" stroke="#a3814f" strokeWidth="2" strokeLinecap="round" />
        <path d="M62 0 L48 64" stroke="#a3814f" strokeWidth="2" strokeLinecap="round" />

        {/* cupcake wrapper */}
        <path
          d="M28 96 L64 96 L58 132 Q46 138 34 132 Z"
          fill="#dd9aa0"
          stroke="#9c332b"
          strokeWidth="1.5"
        />
        <path d="M31 104 L61 104" stroke="#9c332b" strokeWidth="1.2" opacity="0.5" />
        <path d="M33 114 L59 114" stroke="#9c332b" strokeWidth="1.2" opacity="0.5" />

        {/* icing swirl */}
        <path
          d="M46 62c-14 0-20 9-20 17 0 9 9 15 20 15s20-6 20-15c0-8-6-17-20-17Z"
          fill="#fbf3e6"
          stroke="#c9a876"
          strokeWidth="1.5"
        />
        <path
          d="M46 48c-10 0-15 7-15 13 0 6 6 10 15 10s15-4 15-10c0-6-5-13-15-13Z"
          fill="#fbf3e6"
          stroke="#c9a876"
          strokeWidth="1.5"
        />
        <circle cx="46" cy="42" r="9" fill="#fbf3e6" stroke="#c9a876" strokeWidth="1.5" />

        {/* cherry on top */}
        <circle cx="46" cy="32" r="6" fill="#c2453b" stroke="#9c332b" strokeWidth="1.2" />
        <path d="M46 26c2-6 6-8 8-8" stroke="#8fa06a" strokeWidth="2" strokeLinecap="round" />

        {/* sprinkles */}
        <rect x="36" y="70" width="6" height="2.4" rx="1.2" fill="#c2453b" transform="rotate(20 36 70)" />
        <rect x="52" y="74" width="6" height="2.4" rx="1.2" fill="#f3d9a0" transform="rotate(-15 52 74)" />
        <rect x="44" y="80" width="6" height="2.4" rx="1.2" fill="#a3814f" transform="rotate(40 44 80)" />
      </svg>
    </motion.div>
  );
}
