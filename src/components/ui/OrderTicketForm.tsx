import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ALLERGENS } from "../../lib/data";
import type { Product } from "../../lib/supabase/types";
import { Button } from "./Button";
import { SuccessBurst } from "../motion/SuccessBurst";
import { submitOrder, uploadOrderReferencePhoto } from "../../lib/supabase/orders";

type OrderTicketFormProps = {
  products: Product[];
};

export function OrderTicketForm({ products }: OrderTicketFormProps) {
  const CAKE_OPTIONS = products.map((p) => p.name);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allergenChoices, setAllergenChoices] = useState<string[]>([]);

  function toggleAllergen(id: string) {
    setAllergenChoices((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const form = new FormData(event.currentTarget);
    const photo = form.get("referencePhoto") as File | null;

    try {
      const referencePhotoUrl = photo && photo.size > 0 ? await uploadOrderReferencePhoto(photo) : null;

      await submitOrder({
        customer_name: String(form.get("name") || ""),
        customer_email: String(form.get("email") || ""),
        customer_phone: String(form.get("phone") || ""),
        occasion: String(form.get("occasion") || ""),
        servings: Number(form.get("servings") || 0),
        flavor: String(form.get("flavor") || ""),
        allergens: allergenChoices,
        pickup_date: String(form.get("pickupDate") || ""),
        message: String(form.get("message") || "") || null,
        reference_photo_url: referencePhotoUrl,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Kon bestelling niet versturen:", error);
      setSubmitError("Er ging iets mis bij het versturen. Probeer het opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-3xl p-10 text-center"
      >
        <SuccessBurst />
        <motion.p
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
          className="font-display text-2xl text-cacao"
        >
          Bestelbon verstuurd! 🎂
        </motion.p>
        <p className="mt-3 text-cacao-soft">
          Dankjewel! Sophie neemt binnen de 3 dagen persoonlijk contact met je op via e-mail om je
          bestelling te bevestigen en een afhaalmoment af te spreken.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 font-body text-sm font-semibold text-cherry underline underline-offset-4"
        >
          Nog een bestelling invullen
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-[1.75rem] border border-cacao/10 p-6 sm:p-10"
    >
      <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Bestelbon</p>
      <h3 className="mt-2 font-display text-2xl text-cacao">Vertel me over je feestje</h3>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Jouw naam
          <input
            name="name"
            required
            type="text"
            placeholder="Bv. Marie Janssens"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Jouw e-mailadres
          <input
            name="email"
            required
            type="email"
            placeholder="jij@voorbeeld.be"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Jouw telefoonnummer
          <input
            name="phone"
            required
            type="tel"
            placeholder="Bv. 0470 12 34 56"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Gelegenheid
          <input
            name="occasion"
            required
            type="text"
            placeholder="Bv. verjaardag, babyshower, huwelijk…"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Aantal personen
          <input
            name="servings"
            required
            type="number"
            min={1}
            placeholder="Bv. 12"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao sm:col-span-2">
          Gewenste taart
          <select
            name="flavor"
            required
            defaultValue=""
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          >
            <option value="" disabled>
              Kies een klassieker of vraag iets persoonlijks
            </option>
            {CAKE_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Gepersonaliseerde themataart">Gepersonaliseerde themataart (op maat)</option>
          </select>
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-cacao">
            Allergenen waar ik rekening mee moet houden
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => {
              const active = allergenChoices.includes(allergen.label);
              return (
                <motion.button
                  key={allergen.id}
                  type="button"
                  whileHover={{ scale: 1.06, rotate: -2 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => toggleAllergen(allergen.label)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-cherry bg-cherry text-cream"
                      : "border-cacao/20 bg-cream text-cacao-soft hover:border-cherry"
                  }`}
                >
                  {allergen.label}
                </motion.button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Gewenste afhaaldatum
          <input
            name="pickupDate"
            required
            type="date"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Inspiratiefoto (optioneel)
          <input
            name="referencePhoto"
            type="file"
            accept="image/*"
            className="rounded-xl border border-dashed border-cacao/25 bg-cream px-4 py-3 text-sm text-cacao-soft file:mr-3 file:rounded-full file:border-0 file:bg-cherry file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-cream"
          />
          <span className="text-xs font-normal text-cacao-soft/70">
            Optioneel — dit helpt me je wens beter te begrijpen.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao sm:col-span-2">
          Speciale wensen of bericht
          <textarea
            name="message"
            rows={4}
            placeholder="Vertel me over het thema, kleuren, of iets waar ik rekening mee moet houden…"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>
      </div>

      <p className="mt-6 text-sm text-cacao-soft">
        Geef je bestelling liefst een 3-tal dagen op voorhand door — dat geeft mij de tijd om
        verse ingrediënten in huis te halen. Ik stuur snel een bevestiging naar jouw e-mailadres
        en we spreken een afhaalmoment af.
      </p>

      {submitError && <p className="mt-4 text-sm text-cherry">{submitError}</p>}

      <div className="mt-6">
        <Button type="submit" className={isSubmitting ? "pointer-events-none opacity-60" : undefined}>
          {isSubmitting ? "Bezig met verzenden…" : "Verstuur mijn bestelling"}
        </Button>
      </div>
    </form>
  );
}
