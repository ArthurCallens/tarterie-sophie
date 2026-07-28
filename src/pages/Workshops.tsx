import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/motion/Reveal";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { PageBanner } from "../components/ui/Divider";
import { KraftTag } from "../components/ui/KraftTag";
import { WorkshopSignupForm } from "../components/ui/WorkshopSignupForm";
import { formatPriceEUR } from "../lib/supabase/format";
import { getPageContent } from "../lib/supabase/pageContent";
import { getUpcomingWorkshops } from "../lib/supabase/workshops";
import type { Workshop, WorkshopsBannerContent } from "../lib/supabase/types";

function toDisplayDate(isoDate: string | null): string {
  if (!isoDate) return "";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Workshops() {
  const [content, setContent] = useState<WorkshopsBannerContent | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPageContent<WorkshopsBannerContent>("workshops_banner"), getUpcomingWorkshops()]).then(
      ([banner, upcoming]) => {
        if (cancelled) return;
        setContent(banner);
        setWorkshops(upcoming);
        setLoading(false);
      },
    );
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

      {content?.groupNote && (
        <section className="mx-auto max-w-4xl px-5 pb-4 sm:px-8">
          <Reveal className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-kraft bg-butter/30 px-6 py-6 text-center sm:flex-row sm:text-left">
            <span className="font-script text-4xl text-cherry">!</span>
            <div>
              <p className="font-display text-lg text-cacao">Workshop voor jouw groepje?</p>
              <p className="mt-1 text-sm text-cacao-soft">
                {content.groupNote}{" "}
                <Link to="/contact" className="font-semibold text-cherry underline underline-offset-2">
                  Neem contact op
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </section>
      )}

      <section className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <FloatingTreat variant="donut" className="-right-6 bottom-10 hidden xl:block" delay={0.15} />

        {!loading && workshops.length === 0 && (
          <p className="text-center text-cacao-soft">
            Er staan momenteel geen workshops gepland — kom later nog eens terug!
          </p>
        )}

        <div className="flex flex-col gap-16">
          {workshops.map((workshop) => (
            <Reveal key={workshop.id} className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="relative pt-4">
                {workshop.price !== null && (
                  <div className="absolute -right-3 top-0 z-10">
                    <KraftTag price={formatPriceEUR(workshop.price)} suffix="EUR / plaats" rotate={7} />
                  </div>
                )}
                {workshop.image_url && (
                  <div className="overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)] ring-4 ring-cream-dark">
                    <img
                      src={workshop.image_url}
                      alt={workshop.name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-cacao/10 p-8">
                <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Workshop</p>
                <h2 className="mt-2 font-display text-3xl text-cacao">{workshop.name}</h2>
                <p className="mt-4 text-cacao-soft">{workshop.description}</p>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 font-semibold text-cacao">Datum</dt>
                    <dd className="text-cacao-soft">{toDisplayDate(workshop.event_date)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 font-semibold text-cacao">Tijd</dt>
                    <dd className="text-cacao-soft">{workshop.time_range}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 font-semibold text-cacao">Locatie</dt>
                    <dd className="text-cacao-soft">{workshop.location}</dd>
                  </div>
                  {workshop.price !== null && (
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-semibold text-cacao">Prijs</dt>
                      <dd className="text-cacao-soft">{formatPriceEUR(workshop.price)} EUR</dd>
                    </div>
                  )}
                </dl>

                {workshop.spots_note && (
                  <p className="mt-6 inline-block rounded-full bg-butter px-4 py-1.5 font-stamp text-xs font-semibold uppercase tracking-wide text-cacao">
                    {workshop.spots_note}
                  </p>
                )}

                <p className="mt-6 text-cacao-soft">{workshop.cta_text}:</p>

                <WorkshopSignupForm workshopName={workshop.name} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
