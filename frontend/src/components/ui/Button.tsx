import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type ButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: "stamp" | "outline";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-body font-semibold text-[15px] tracking-wide transition-colors focus-visible:outline-offset-4";

const variants = {
  stamp: "bg-cherry text-cream shadow-[0_10px_24px_-10px_rgb(194_69_59_/_0.6)] hover:bg-cherry-dark",
  outline: "border-2 border-cacao text-cacao hover:bg-cacao hover:text-cream",
};

export function Button({ children, to, href, variant = "stamp", className, type = "button", onClick }: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  const motionProps = {
    whileHover: { scale: 1.045, rotate: -1 },
    whileTap: { scale: 0.97, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 400, damping: 15 },
  };

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link to={to} onClick={onClick} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <a
          href={href}
          onClick={onClick}
          className={classes}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {children}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.button {...motionProps} type={type} onClick={onClick} className={classes}>
      {children}
    </motion.button>
  );
}
