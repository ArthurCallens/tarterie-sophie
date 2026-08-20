import { motion } from "framer-motion";
import { KraftTag } from "./KraftTag";

type CakeCardProps = {
  name: string;
  note?: string;
  price?: string;
  priceSuffix?: string;
  image: string;
  alt: string;
  rotate?: number;
  allergens?: string[];
};

export function CakeCard({ name, note, price, priceSuffix, image, alt, rotate = 0, allergens }: CakeCardProps) {
  return (
    <motion.div
      className="group relative pt-4"
      initial={{ rotate }}
      whileHover={{ rotate: 0, scale: 1.03, y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {price && (
        <div className="absolute -right-3 top-0 z-10">
          <KraftTag price={price} suffix={priceSuffix ?? ""} rotate={rotate < 0 ? 8 : -8} />
        </div>
      )}
      <div className="overflow-hidden rounded-3xl bg-cream-dark shadow-[var(--shadow-card)] ring-1 ring-cacao/5">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-cream/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          />
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg leading-tight text-cacao">{name}</h3>
          {note && <p className="mt-1 text-sm italic text-cacao-soft">{note}</p>}
          {allergens && allergens.length > 0 && (
            <p className="mt-2 font-stamp text-[11px] tracking-wide text-cacao-soft/80">
              Bevat: {allergens.map((a) => a.toLowerCase()).join(", ")}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
