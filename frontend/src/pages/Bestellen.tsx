import { useEffect, useState } from "react";
import { Reveal, Stagger } from "../components/motion/Reveal";
import { CupcakeSwing } from "../components/motion/CupcakeSwing";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { Button } from "../components/ui/Button";
import { CakeCard } from "../components/ui/CakeCard";
import { Divider, PageBanner } from "../components/ui/Divider";
import { ALLERGENS } from "../lib/data";
import { formatPriceEUR } from "../lib/supabase/format";
import { getCustomCakeOffer } from "../lib/supabase/customCake";
import { getAllOrderSteps } from "../lib/supabase/orderSteps";
import { getPageContent } from "../lib/supabase/pageContent";
import { getProductsByCategory } from "../lib/supabase/products";
import type { BestellenContent, CustomCakeOffer, OrderStep, Product } from "../lib/supabase/types";

export function Bestellen() {
  const [classics, setClassics] = useState<Product[]>([]);
  const [smallPastries, setSmallPastries] = useState<Product[]>([]);
  const [customCake, setCustomCake] = useState<CustomCakeOffer | null>(null);
  const [content, setContent] = useState<BestellenContent | null>(null);
  const [steps, setSteps] = useState<OrderStep[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProductsByCategory("klassieker"),
      getProductsByCategory("klein-gebak"),
      getCustomCakeOffer(),
      getPageContent<BestellenContent>("bestellen"),
      getAllOrderSteps(),
    ]).then(([classicsData, smallPastriesData, customCakeData, bestellenContent, orderSteps]) => {
      if (cancelled) return;
      setClassics(classicsData);
      setSmallPastries(smallPastriesData);
      setCustomCake(customCakeData);
      setContent(bestellenContent);
      setSteps(orderSteps);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageBanner
        eyebrow={content?.bannerEyebrow ?? ""}
        title={content?.bannerTitle ?? ""}
        intro={content?.bannerIntro}
      />

      <div className="-mt-4 flex justify-center pb-4">
        <Button to="/bestellen/bestelbon">Bestel een taart</Button>
      </div>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.id} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-cacao/10 p-6">
                <span className="font-script text-3xl text-cherry">{i + 1}</span>
                <h3 className="mt-2 font-display text-lg text-cacao">{step.title}</h3>
                <p className="mt-2 text-sm text-cacao-soft">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </Stagger>
      </section>

      {/* Catalog */}
      <section className="relative bg-cream-dark/60 py-20">
        <CupcakeSwing className="right-6 top-0 hidden sm:block md:right-16" scale={0.8} />
        <FloatingTreat variant="donut" className="left-4 top-20 hidden lg:block" delay={0.1} />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Klassiekers</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cacao sm:text-4xl">
              De vaste waarden
            </h2>
            <Divider className="mx-auto mt-4 text-rose" />
          </Reveal>

          <Stagger className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {classics.map((cake, i) => (
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

          <Reveal className="mx-auto mt-20 max-w-xl text-center">
            <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">
              Kleine gebakjes
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cacao sm:text-4xl">
              Voor bij de koffie
            </h2>
          </Reveal>
          <Stagger className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-12">
            {smallPastries.map((cake) => (
              <Reveal key={cake.id} className="w-full max-w-xs sm:w-72">
                <CakeCard
                  name={cake.name}
                  price={formatPriceEUR(cake.price)}
                  image={cake.images[0]?.image_url ?? ""}
                  alt={cake.images[0]?.alt_text ?? cake.name}
                  allergens={cake.allergens}
                />
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Custom cakes */}
      {customCake && (
        <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <FloatingTreat variant="cookie" className="-right-6 top-4 hidden xl:block" />
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">
              Gepersonaliseerde taarten
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cacao sm:text-4xl">
              Jouw feestje, jouw taart
            </h2>
            <p className="mt-4 text-lg text-cacao-soft">{customCake.intro}</p>
          </Reveal>

          <div className="mt-14 grid gap-10 md:grid-cols-2 md:items-start">
            <Reveal>
              <div className="grid grid-cols-3 gap-3">
                {customCake.gallery.map((item, i) => (
                  <div
                    key={item.id}
                    className={`overflow-hidden rounded-2xl shadow-[var(--shadow-card)] ${
                      i === 1 ? "rotate-2" : i === 0 ? "-rotate-3" : "rotate-3"
                    }`}
                  >
                    <img
                      src={item.image_url}
                      alt={item.alt_text}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-cacao/10 p-8">
                <p className="font-display text-2xl text-cherry">
                  {formatPriceEUR(customCake.price)} {customCake.price_unit}
                </p>
                <p className="mt-3 text-cacao-soft">{customCake.detail}</p>
                <p className="mt-5 font-semibold text-cacao">Mogelijke vullingen zijn:</p>
                {(() => {
                  const fillings = customCake.fillings.filter((f) => f.trim() !== "");
                  const left = fillings.filter((_, i) => i % 2 === 0);
                  const right = fillings.filter((_, i) => i % 2 === 1);
                  const column = (items: string[]) => (
                    <ul className="text-sm text-cacao-soft">
                      {items.map((filling) => (
                        <li key={filling} className="mb-2 flex gap-2">
                          <span className="shrink-0 text-cherry">•</span>
                          {filling}
                        </li>
                      ))}
                    </ul>
                  );
                  return (
                    <div className="mt-3 grid max-h-72 grid-cols-1 gap-x-4 overflow-y-auto sm:grid-cols-2">
                      {column(left)}
                      {column(right)}
                    </div>
                  );
                })()}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Allergen callout */}
      <section className="mx-auto max-w-4xl px-5 pb-4 sm:px-8">
        <Reveal className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-kraft bg-butter/30 px-6 py-6 text-center sm:flex-row sm:text-left">
          <span className="font-script text-4xl text-cherry">!</span>
          <div>
            <p className="font-display text-lg text-cacao">Allergenen</p>
            <p className="mt-1 text-sm text-cacao-soft">
              De allergenen staan aangeduid met een icoontje onder elke taart ({ALLERGENS.map((a) => a.label).join(", ")}).
              Twijfel je? Laat het me zeker weten bij je bestelling.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-16 text-center sm:px-8">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold text-cacao sm:text-3xl">
            Klaar om te bestellen?
          </h2>
          <p className="mt-3 text-cacao-soft">
            Vul de bestelbon in en Sophie neemt binnen de 3 dagen contact met je op.
          </p>
          <div className="mt-6 flex justify-center">
            <Button to="/bestellen/bestelbon">Bestel een taart</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
