import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, SITE } from "../../lib/data";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-cherry/90 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold text-cacao">{SITE.name}</span>
          <span className="font-script text-lg text-cherry -mt-1">{SITE.tagline}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "font-body text-[15px] font-medium text-cacao-soft transition-colors hover:text-cherry",
                  isActive && "text-cherry",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Button to="/bestellen" className="px-5! py-2.5! text-sm!">
            Bestel een taart
          </Button>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={open ? "Sluit menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
            className="block h-0.5 w-6 rounded-full bg-cacao"
          />
          <motion.span animate={{ opacity: open ? 0 : 1 }} className="block h-0.5 w-6 rounded-full bg-cacao" />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
            className="block h-0.5 w-6 rounded-full bg-cacao"
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-cacao/10 bg-cream md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2.5 font-body text-base font-medium text-cacao-soft",
                      isActive && "bg-rose-light text-cherry-dark",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
