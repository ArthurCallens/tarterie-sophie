import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal, Stagger } from "../components/motion/Reveal";
import { SprinkleField } from "../components/motion/SprinkleField";
import { CupcakeSwing } from "../components/motion/CupcakeSwing";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { Button } from "../components/ui/Button";
import { CakeCard } from "../components/ui/CakeCard";
import { WaxBadge } from "../components/ui/WaxBadge";
import { Divider } from "../components/ui/Divider";
import { useReducedMotion } from "../lib/use-reduced-motion";
import { HERO_IMAGE, HOME_INTRO, TRUST_BADGES, WORKSHOP } from "../lib/data";
import { formatPriceEUR } from "../lib/supabase/format";
import { getFeaturedProducts } from "../lib/supabase/products";
import type { Product } from "../lib/supabase/types";

export function Home() {
  const reduced = useReducedMotion();
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    getFeaturedProducts().then((products) => {
      if (!cancelled) setFeatured(products);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-dark pt-10 sm:pt-14">
        <SprinkleField />
        <CupcakeSwing className="top-0 right-8 hidden sm:block md:right-16" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 sm:px-8 md:grid-cols-2 md:gap-6 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 order-2 md:order-1"
          >
            <p className="font-stamp text-xs uppercase tracking-[0.25em] text-cherry">
              Taarten &amp; tartelettes op bestelling — Gent
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-cacao sm:text-6xl">
              Tarterie Sophie
            </h1>
            <p className="mt-3 font-script text-3xl text-cherry sm:text-4xl">
              Life is short, make it sweet.
            </p>
            <p className="mt-6 max-w-md text-lg text-cacao-soft">
              Handgemaakte taarten en gebakjes, gebakken op bestelling met verse ingrediënten
              en heel veel plezier.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/bestellen">Bestel een taart</Button>
              <Button to="/over-mij" variant="outline">
                Ontdek mijn verhaal
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-1 md:order-2"
          >
            <motion.div
              animate={reduced ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-card)] ring-4 ring-cream"
            >
              <img
                src={HERO_IMAGE}
                alt="Roze verjaardagstaart met een fondant regenboog en eenhoorn erop, versierd met een gouden cijfer 5"
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -left-6 -z-10 h-40 w-40 rounded-full bg-butter blur-2xl opacity-70"
            />
            <div
              aria-hidden="true"
              className="absolute -top-8 -right-4 -z-10 h-32 w-32 rounded-full bg-rose blur-2xl opacity-60"
            />
          </motion.div>
        </div>
      </section>

      {/* Intro note */}
      <section className="relative mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <FloatingTreat variant="donut" className="right-2 top-6 hidden sm:block" />
        <FloatingTreat variant="cookie" className="left-0 bottom-10 hidden sm:block" delay={0.15} />
        <Reveal>
          <div className="relative rounded-3xl bg-cream-dark p-8 shadow-[var(--shadow-card)] sm:p-10">
            <span
              aria-hidden="true"
              className="absolute -top-5 left-8 rounded-full bg-cherry px-4 py-1 font-script text-xl text-cream shadow-[var(--shadow-tag)]"
            >
              Een woordje van Sophie
            </span>
            <p className="whitespace-pre-line text-[17px] leading-relaxed text-cacao-soft">
              {HOME_INTRO}
            </p>
            <p className="mt-6 font-script text-2xl text-cherry">Groetjes, Sophie</p>
          </div>
        </Reveal>
      </section>

      {/* Featured cakes */}
      <section className="relative bg-cream-dark/60 py-20">
        <CupcakeSwing className="right-10 top-0 hidden sm:block" scale={0.75} />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Uit de oven</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cacao sm:text-4xl">
              Enkele favorieten
            </h2>
            <Divider className="mx-auto mt-4 text-rose" />
          </Reveal>

          <Stagger className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((cake, i) => (
              <Reveal key={cake.id} delay={i * 0.05}>
                <CakeCard
                  name={cake.name}
                  note={cake.description ?? undefined}
                  price={formatPriceEUR(cake.price)}
                  image={cake.images[0]?.image_url ?? ""}
                  alt={cake.images[0]?.alt_text ?? cake.name}
                  allergens={cake.allergens}
                  rotate={i % 2 === 0 ? -3 : 3}
                />
              </Reveal>
            ))}
          </Stagger>

          <Reveal className="mt-16 text-center">
            <Button to="/bestellen">Bekijk alle taarten</Button>
          </Reveal>
        </div>
      </section>

      {/* Trust signals */}
      <section className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
        <FloatingTreat variant="macaron" className="-left-6 top-4 hidden lg:block" />
        <Reveal>
          <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Vertrouwd door</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-cacao">
            Meer dan zelfgebakken alleen
          </h2>
        </Reveal>
        <Stagger className="mt-10 flex flex-wrap items-center justify-center gap-8">
          {TRUST_BADGES.map((badge) => (
            <Reveal key={badge.id}>
              <WaxBadge label={badge.label} detail={badge.detail} />
            </Reveal>
          ))}
        </Stagger>
      </section>

      {/* Workshop teaser */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-cacao px-6 py-14 text-center text-cream sm:px-14">
          <div
            aria-hidden="true"
            className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cherry/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-butter/20 blur-3xl"
          />
          <CupcakeSwing className="left-6 top-0 hidden sm:block" scale={0.62} />
          <p className="relative font-stamp text-xs uppercase tracking-[0.2em] text-rose">
            Zelf aan de slag
          </p>
          <h2 className="relative mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Doe mee aan een workshop
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-cream/80">
            Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops
            die ik geef — zoals "{WORKSHOP.name}", waar we samen kleine gebakjes op basis van
            zanddeeg maken.
          </p>
          <div className="relative mt-8">
            <Button to="/workshops">Bekijk de workshops</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
