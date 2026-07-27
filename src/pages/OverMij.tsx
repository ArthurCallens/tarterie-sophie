import { Reveal } from "../components/motion/Reveal";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { Button } from "../components/ui/Button";
import { PageBanner } from "../components/ui/Divider";
import { WaxBadge } from "../components/ui/WaxBadge";
import { ABOUT_TEXT, TRUST_BADGES } from "../lib/data";

export function OverMij() {
  return (
    <>
      <PageBanner
        eyebrow="Het verhaal achter de oven"
        title="Over mij"
      />

      <section className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <FloatingTreat variant="macaron" className="-right-6 top-1/3 hidden xl:block" delay={0.1} />
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_320px] md:gap-16">
          <Reveal>
            <div className="space-y-6 text-lg leading-relaxed text-cacao-soft">
              <p className="font-display text-2xl leading-snug text-cacao">
                {ABOUT_TEXT.intro}
              </p>

              <p>{ABOUT_TEXT.training[0]}</p>
              <ul className="ml-1 space-y-2 border-l-2 border-rose pl-5">
                {ABOUT_TEXT.trainingList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p>{ABOUT_TEXT.planningIntro}</p>
              <ul className="ml-1 space-y-2 border-l-2 border-butter pl-5">
                {ABOUT_TEXT.planningList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p>{ABOUT_TEXT.bakeOff}</p>
            </div>

            <div className="mt-10 flex flex-wrap gap-6">
              {TRUST_BADGES.map((badge) => (
                <WaxBadge key={badge.id} label={badge.label} detail={badge.detail} />
              ))}
            </div>

            <div className="mt-10">
              <Button to="/bestellen">Bestel jouw taart bij Sophie</Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none">
            <div className="sticky top-28 rotate-2 overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)] ring-4 ring-cream-dark">
              <img
                src={ABOUT_TEXT.portrait}
                alt="Close-up van een gebakken taart uit Sophie's keuken"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
