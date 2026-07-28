import { motion } from "framer-motion";
import { Reveal } from "../components/motion/Reveal";
import { FloatingTreat } from "../components/motion/FloatingTreat";
import { ContactForm } from "../components/ui/ContactForm";
import { PageBanner } from "../components/ui/Divider";
import { SITE } from "../lib/data";
import { useContactContent } from "../lib/useContactContent";

export function Contact() {
  const contact = useContactContent();
  const addressFull = contact ? `${contact.addressStreet}, ${contact.addressCity}` : "";
  const mapSrc = contact ? `https://www.google.com/maps?q=${encodeURIComponent(addressFull)}&output=embed` : "";

  return (
    <>
      <PageBanner eyebrow={contact?.bannerEyebrow ?? ""} title={contact?.bannerTitle ?? ""} />

      <section className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <FloatingTreat variant="macaron" className="-left-10 bottom-24 hidden xl:block" delay={0.1} />
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal className="flex flex-col gap-6">
            {contact && (
              <>
                <div className="rounded-3xl border border-cacao/10 p-8">
                  <h3 className="font-display text-2xl text-cacao">Gegevens</h3>
                  <dl className="mt-5 space-y-4 text-cacao-soft">
                    <div>
                      <dt className="text-sm font-semibold text-cacao">Adres</dt>
                      <dd>{addressFull}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-cacao">Telefoon</dt>
                      <dd>
                        <a href={`tel:${contact.phoneHref}`} className="hover:text-cherry">
                          {contact.phone}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-cacao">E-mail</dt>
                      <dd>
                        <a href={`mailto:${contact.email}`} className="hover:text-cherry">
                          {contact.email}
                        </a>
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex gap-3">
                    <motion.a
                      href={contact.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.08, rotate: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full border border-cacao/20 px-4 py-1.5 text-sm font-medium text-cacao transition-colors hover:border-cherry hover:text-cherry"
                    >
                      Instagram
                    </motion.a>
                    <motion.a
                      href={contact.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full border border-cacao/20 px-4 py-1.5 text-sm font-medium text-cacao transition-colors hover:border-cherry hover:text-cherry"
                    >
                      Facebook
                    </motion.a>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-card)] ring-4 ring-cream-dark">
                  <iframe
                    title={`Kaart met de locatie van ${SITE.name} op ${addressFull}`}
                    src={mapSrc}
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
