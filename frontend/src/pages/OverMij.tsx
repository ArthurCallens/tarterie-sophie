import { useEffect, useState } from "react";
import { Reveal } from "../components/motion/Reveal";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { Button } from "../components/ui/Button";
import { PageBanner } from "../components/ui/Divider";
import { WaxBadge } from "../components/ui/WaxBadge";
import { getPageContent } from "../lib/supabase/pageContent";
import { getAllTrustBadges } from "../lib/supabase/trustBadges";
import type { AboutContent, TrustBadge } from "../lib/supabase/types";

export function OverMij() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [badges, setBadges] = useState<TrustBadge[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPageContent<AboutContent>("about"), getAllTrustBadges()]).then(([aboutContent, trustBadges]) => {
      if (cancelled) return;
      setContent(aboutContent);
      setBadges(trustBadges);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageBanner eyebrow={content?.bannerEyebrow ?? ""} title="Over mij" />

      <section className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <FloatingTreat variant="macaron" className="-right-6 top-1/3 hidden xl:block" delay={0.1} />
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_320px] md:gap-16">
          {content && (
            <Reveal>
              <div className="space-y-6 text-lg leading-relaxed text-cacao-soft">
                <p className="font-display text-2xl leading-snug text-cacao">{content.introText}</p>

                <p>{content.trainingIntro}</p>
                <ul className="ml-1 space-y-2 border-l-2 border-rose pl-5">
                  {content.trainingList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p>{content.planningIntro}</p>
                <ul className="ml-1 space-y-2 border-l-2 border-butter pl-5">
                  {content.planningList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p>{content.bakeOffText}</p>
              </div>

              <div className="mt-10 flex flex-wrap gap-6">
                {badges.map((badge) => (
                  <WaxBadge key={badge.id} label={badge.label} detail={badge.detail} />
                ))}
              </div>

              <div className="mt-10">
                <Button to="/bestellen">Bestel jouw taart bij Sophie</Button>
              </div>
            </Reveal>
          )}

          {content?.portraitImageUrl && (
            <Reveal delay={0.1} className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none">
              <div className="sticky top-28 rotate-2 overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)] ring-4 ring-cream-dark">
                <img
                  src={content.portraitImageUrl}
                  alt="Close-up van een gebakken taart uit Sophie's keuken"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
