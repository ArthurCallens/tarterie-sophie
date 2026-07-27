import { Reveal } from "../components/motion/Reveal";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { PageBanner } from "../components/ui/Divider";
import { KraftTag } from "../components/ui/KraftTag";
import { WorkshopSignupForm } from "../components/ui/WorkshopSignupForm";
import { WORKSHOP } from "../lib/data";

export function Workshops() {
  return (
    <>
      <PageBanner
        eyebrow="Zelf de handen uit de mouwen steken"
        title="Workshops"
        intro="Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops die ik geef!"
      />

      <section className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <FloatingTreat variant="donut" className="-right-6 bottom-10 hidden xl:block" delay={0.15} />
        <Reveal className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="relative pt-4">
            <div className="absolute -right-3 top-0 z-10">
              <KraftTag price={WORKSHOP.price} suffix="EUR / plaats" rotate={7} />
            </div>
            <div className="overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)] ring-4 ring-cream-dark">
              <img
                src={WORKSHOP.image}
                alt={WORKSHOP.imageAlt}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-cream-dark p-8 shadow-[var(--shadow-card)]">
            <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Workshop</p>
            <h2 className="mt-2 font-display text-3xl text-cacao">{WORKSHOP.name}</h2>
            <p className="mt-4 text-cacao-soft">{WORKSHOP.description}</p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-semibold text-cacao">Datum</dt>
                <dd className="text-cacao-soft">{WORKSHOP.date}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-semibold text-cacao">Tijd</dt>
                <dd className="text-cacao-soft">{WORKSHOP.time}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-semibold text-cacao">Locatie</dt>
                <dd className="text-cacao-soft">{WORKSHOP.location}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-semibold text-cacao">Prijs</dt>
                <dd className="text-cacao-soft">{WORKSHOP.price} EUR</dd>
              </div>
            </dl>

            <p className="mt-6 inline-block rounded-full bg-butter px-4 py-1.5 font-stamp text-xs font-semibold uppercase tracking-wide text-cacao">
              {WORKSHOP.spotsNote}
            </p>

            <p className="mt-6 text-cacao-soft">{WORKSHOP.cta}:</p>

            <WorkshopSignupForm workshopName={WORKSHOP.name} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
