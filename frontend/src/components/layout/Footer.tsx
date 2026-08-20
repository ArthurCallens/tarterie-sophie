import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { NAV_LINKS, SITE } from "../../lib/data";
import { useContactContent } from "../../lib/useContactContent";

export function Footer() {
  const contact = useContactContent();

  // Geen extra marge boven de footer: elke sectie brengt zelf al pb-20/pb-24
  // mee, en een mt-24 daarbovenop gaf ~190px lege ruimte waar je doorheen
  // moest scrollen voor je de footer zag.
  return (
    <footer className="relative bg-cacao text-cream">
      <svg
        className="absolute -top-[1px] left-0 w-full text-cacao"
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 24 Q 30 0 60 24 T 120 24 T 180 24 T 240 24 T 300 24 T 360 24 T 420 24 T 480 24 T 540 24 T 600 24 T 660 24 T 720 24 T 780 24 T 840 24 T 900 24 T 960 24 T 1020 24 T 1080 24 T 1140 24 T 1200 24 V 24 H 0 Z" fill="currentColor" />
      </svg>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">{SITE.name}</p>
          {contact && (
            <div className="mt-5 flex gap-3">
              <motion.a
                href={contact.instagramUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.08, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-cream/30 px-4 py-1.5 text-sm transition-colors hover:bg-cream hover:text-cacao"
              >
                Instagram
              </motion.a>
              <motion.a
                href={contact.facebookUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-cream/30 px-4 py-1.5 text-sm transition-colors hover:bg-cream hover:text-cacao"
              >
                Facebook
              </motion.a>
            </div>
          )}
        </div>

        <div>
          <p className="font-stamp text-xs uppercase tracking-widest text-cream/60">Snel naar</p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-cream/85 transition-colors hover:text-rose">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {contact && (
          <div>
            <p className="font-stamp text-xs uppercase tracking-widest text-cream/60">Contact</p>
            <ul className="mt-3 space-y-2 text-cream/85">
              <li>
                {contact.addressStreet}, {contact.addressCity}
              </li>
              <li>
                <a href={`tel:${contact.phoneHref}`} className="hover:text-rose">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-rose">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/50 sm:px-8">
        <p>
          Allergeneninformatie op aanvraag — twijfel je? Laat het altijd weten bij je bestelling.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} {SITE.name}.</p>
      </div>
    </footer>
  );
}
