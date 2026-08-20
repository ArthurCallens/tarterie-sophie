import { useState, type FocusEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ALLERGENS } from "../../lib/data";
import type { CustomCakeOffer, OrderItem, OrderItemCategory, Product } from "../../lib/supabase/types";
import { formatPriceEUR } from "../../lib/supabase/format";
import { Button } from "./Button";
import { SuccessBurst } from "../motion/SuccessBurst";
import { submitOrder, uploadOrderReferencePhoto } from "../../lib/supabase/orders";

type OrderTicketFormProps = {
  products: Product[];
  customCake?: CustomCakeOffer | null;
};

const CUSTOM_CAKE_ID = "custom";
const CUSTOM_CAKE_LABEL = "Gepersonaliseerde themataart (op maat)";

type Selection = {
  category: OrderItemCategory;
  label: string;
  qty: number;
  unitPrice: number;
  /** Alleen voor de gepersonaliseerde taart: de vulling die de klant koos. */
  filling?: string;
};

/**
 * Wat er uiteindelijk als omschrijving van deze lijn doorgaat — naar het
 * dashboard, de bevestigingsmail en de factuur. Voor de gepersonaliseerde
 * taart hangt de gekozen vulling er hier aan vast, zodat ze nergens onderweg
 * verloren gaat.
 */
function selectionLabel(selection: Selection): string {
  if (selection.category === "custom" && selection.filling) {
    return `${selection.label} — vulling: ${selection.filling}`;
  }
  return selection.label;
}

function describeSelection(selection: Selection): string {
  if (selection.category === "klassieker") return `${selection.qty}x ${selection.label} (taart voor 8 pers.)`;
  if (selection.category === "klein-gebak") return `${selection.label} (${selection.qty} stuks)`;
  return `${selectionLabel(selection)} (voor ${selection.qty} personen)`;
}

function toOrderItem(id: string, selection: Selection): OrderItem {
  // Last-resort safety net only — deselectIfEmpty (on blur) already removes
  // any selection left at qty 0, so this should never actually see a 0.
  const quantity = selection.qty || 1;
  return {
    id,
    category: selection.category,
    label: selectionLabel(selection),
    quantity,
    unitPrice: selection.unitPrice,
    lineTotal: quantity * selection.unitPrice,
  };
}

/**
 * "Aantal gasten" isn't asked anymore — the person/cake/piece counts on
 * each chosen item already say what's needed. This derives a rough
 * headcount purely for internal record-keeping (admin summary line,
 * legacy invoice fallback): custom cake counts by person, a klassieker by
 * its fixed 8-person size; klein gebak pieces aren't really "people" so
 * they don't contribute.
 */
function estimateServings(items: OrderItem[]): number {
  const total = items.reduce((sum, item) => {
    if (item.category === "custom") return sum + item.quantity;
    if (item.category === "klassieker") return sum + item.quantity * 8;
    return sum;
  }, 0);
  return Math.max(1, total);
}

/** Auto-select an input's current value on focus, so typing a new number doesn't require deleting the old one first. */
function selectOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select();
}

export function OrderTicketForm({ products, customCake }: OrderTicketFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allergenChoices, setAllergenChoices] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [pickupDate, setPickupDate] = useState("");

  function toggleAllergen(id: string) {
    setAllergenChoices((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function toggleSelection(id: string, label: string, category: OrderItemCategory, unitPrice: number) {
    setSelections((prev) => {
      if (prev[id]) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { label, category, unitPrice, qty: 1 } };
    });
  }

  /**
   * Accepts the raw input string, not a pre-parsed number — an empty field
   * (mid-edit, e.g. after backspacing a single digit to type a new number)
   * has to be representable as 0 here, not silently snapped to some default
   * on every keystroke, or the field becomes impossible to clear.
   */
  function setFilling(id: string, filling: string) {
    setSelections((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], filling } } : prev));
  }

  function setQty(id: string, raw: string) {
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    const parsed = digitsOnly === "" ? 0 : Number(digitsOnly);
    setSelections((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], qty: parsed } } : prev));
  }

  /** Left empty (or 0) and clicked away — treat that as "never mind, I don't want this one" rather than guessing a quantity for them. */
  function deselectIfEmpty(id: string) {
    setSelections((prev) => {
      if (!prev[id] || prev[id].qty > 0) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }

  const selectedIds = Object.keys(selections);
  const fillingOptions = (customCake?.fillings ?? []).filter((f) => f.trim() !== "");
  const classics = products.filter((p) => p.category === "klassieker");
  const smallPastries = products.filter((p) => p.category === "klein-gebak");
  const items = selectedIds.map((id) => toOrderItem(id, selections[id]));
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const daysUntilPickup = pickupDate
    ? Math.ceil((new Date(`${pickupDate}T00:00:00`).getTime() - Date.now()) / 86_400_000)
    : null;
  // Sophie vraagt om bestellingen drie weken op voorhand door te geven — alles
  // korter dan dat krijgt een waarschuwing, maar wordt niet geblokkeerd.
  const MIN_LEAD_DAYS = 21;
  const pickupSoonWarning = daysUntilPickup !== null && daysUntilPickup >= 0 && daysUntilPickup < MIN_LEAD_DAYS;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (selectedIds.length === 0) {
      setSubmitError("Kies minstens één taart.");
      return;
    }
    const customSelection = selections[CUSTOM_CAKE_ID];
    if (customSelection && fillingOptions.length > 0 && !customSelection.filling) {
      setSubmitError("Kies een vulling voor je gepersonaliseerde taart.");
      return;
    }
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
        servings: estimateServings(items),
        flavor: selectedIds.map((id) => describeSelection(selections[id])).join(", "),
        allergens: allergenChoices,
        pickup_date: String(form.get("pickupDate") || ""),
        message: String(form.get("message") || "") || null,
        reference_photo_url: referencePhotoUrl,
        items,
        price: total,
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

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
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

        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="text-sm font-medium text-cacao">
            Gewenste taart <span className="font-normal text-cacao-soft">(kies één of meerdere)</span>
          </legend>

          {/* Custom cake — the star of the show, always shown first and bigger. */}
          <div
            className={`mt-3 overflow-hidden rounded-2xl border-2 transition-colors ${
              selections[CUSTOM_CAKE_ID] ? "border-cherry bg-cherry/5" : "border-cherry/40 bg-cream"
            }`}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => toggleSelection(CUSTOM_CAKE_ID, CUSTOM_CAKE_LABEL, "custom", customCake?.price ?? 0)}
              aria-pressed={Boolean(selections[CUSTOM_CAKE_ID])}
              className="flex w-full items-stretch gap-4 text-left"
            >
              {customCake?.gallery?.[0] && (
                <img
                  src={customCake.gallery[0].image_url}
                  alt={customCake.gallery[0].alt_text}
                  loading="lazy"
                  className="h-28 w-28 shrink-0 object-cover sm:h-32 sm:w-32"
                />
              )}
              <span className="flex flex-1 flex-col justify-center py-3 pr-4">
                <span className="flex items-center gap-2">
                  <span className="font-script text-2xl text-cherry">✦</span>
                  <span className="font-display text-lg text-cacao">Gepersonaliseerde themataart</span>
                </span>
                <span className="mt-1 text-sm text-cacao-soft">
                  Op maat gemaakt voor jouw feestje — thema, kleuren, alles bespreekbaar.
                </span>
                {customCake && (
                  <span className="mt-1 font-display text-sm text-cherry">
                    vanaf {formatPriceEUR(customCake.price)} {customCake.price_unit}
                  </span>
                )}
              </span>
            </motion.button>
            {selections[CUSTOM_CAKE_ID] && (
              <div className="border-t border-cherry/20 bg-cream">
                <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-cacao">
                  Voor hoeveel personen?
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={selections[CUSTOM_CAKE_ID].qty === 0 ? "" : selections[CUSTOM_CAKE_ID].qty}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={selectOnFocus}
                    onChange={(e) => setQty(CUSTOM_CAKE_ID, e.target.value)}
                    onBlur={() => deselectIfEmpty(CUSTOM_CAKE_ID)}
                    placeholder="0"
                    className="w-20 rounded-lg border border-cacao/15 bg-cream px-2 py-1 text-cacao focus:border-cherry"
                  />
                </label>
                {fillingOptions.length > 0 && (
                  <label className="flex flex-col gap-1.5 border-t border-cherry/20 px-4 py-2.5 text-sm font-medium text-cacao">
                    Welke vulling wil je?
                    <select
                      required
                      value={selections[CUSTOM_CAKE_ID].filling ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setFilling(CUSTOM_CAKE_ID, e.target.value)}
                      className="rounded-lg border border-cacao/15 bg-cream px-3 py-2 text-base font-normal text-cacao focus:border-cherry"
                    >
                      <option value="" disabled>
                        Kies een vulling…
                      </option>
                      {fillingOptions.map((filling) => (
                        <option key={filling} value={filling}>
                          {filling}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-normal text-cacao-soft/70">
                      Nog niet zeker? Kies wat het dichtst aanleunt en vertel het onderaan bij "speciale wensen".
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {classics.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-cacao-soft">Of kies een klassieker</p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {classics.map((product) => (
                  <CakeChoiceCard
                    key={product.id}
                    product={product}
                    priceSuffix="/ taart (8 pers.)"
                    unitLabel="Aantal taarten? (telkens voor 8 personen)"
                    selection={selections[product.id]}
                    onToggle={() => toggleSelection(product.id, product.name, "klassieker", product.price)}
                    onQtyChange={(value) => setQty(product.id, value)}
                    onQtyBlur={() => deselectIfEmpty(product.id)}
                  />
                ))}
              </div>
            </>
          )}

          {smallPastries.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-cacao-soft">
                Of kies iets voor bij de koffie
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {smallPastries.map((product) => (
                  <CakeChoiceCard
                    key={product.id}
                    product={product}
                    priceSuffix="/ stuk"
                    unitLabel="Aantal stuks?"
                    selection={selections[product.id]}
                    onToggle={() => toggleSelection(product.id, product.name, "klein-gebak", product.price)}
                    onQtyChange={(value) => setQty(product.id, value)}
                    onQtyBlur={() => deselectIfEmpty(product.id)}
                  />
                ))}
              </div>
            </>
          )}

          {items.length > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-cream-dark px-4 py-3">
              <span className="text-sm font-medium text-cacao">Geschatte totaalprijs</span>
              <span className="font-display text-lg text-cherry">{formatPriceEUR(total)} EUR</span>
            </div>
          )}
        </fieldset>

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
            value={pickupDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setPickupDate(e.target.value)}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
          {pickupSoonWarning && (
            <span className="text-xs font-medium text-cherry">
              Dat is minder dan drie weken vanaf nu — dat lukt niet altijd. Sophie laat je zeker weten of het past.
            </span>
          )}
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
        Geef je bestelling liefst minstens drie weken op voorhand door — dat geeft mij de tijd om
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

function CakeChoiceCard({
  product,
  priceSuffix,
  unitLabel,
  selection,
  onToggle,
  onQtyChange,
  onQtyBlur,
}: {
  product: Product;
  priceSuffix: string;
  unitLabel: string;
  selection?: Selection;
  onToggle: () => void;
  onQtyChange: (value: string) => void;
  onQtyBlur: () => void;
}) {
  const image = product.images[0];
  const active = Boolean(selection);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border-2 transition-colors ${
        active ? "border-cherry bg-cherry/5" : "border-cacao/10 bg-cream hover:border-cherry/50"
      }`}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        aria-pressed={active}
        className="block w-full text-left"
      >
        {image ? (
          <img
            src={image.image_url}
            alt={image.alt_text}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-cream-dark" aria-hidden="true" />
        )}
        <div className="px-2.5 py-2">
          <p className="font-display text-sm leading-tight text-cacao">{product.name}</p>
          <p className="mt-0.5 font-display text-xs text-cherry">
            {formatPriceEUR(product.price)} EUR {priceSuffix}
          </p>
        </div>
      </motion.button>
      {active && selection && (
        <label className="flex flex-col gap-1 border-t border-cherry/20 px-2.5 py-2 text-xs font-medium text-cacao">
          {unitLabel}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={selection.qty === 0 ? "" : selection.qty}
            onClick={(e) => e.stopPropagation()}
            onFocus={selectOnFocus}
            onChange={(e) => onQtyChange(e.target.value)}
            onBlur={onQtyBlur}
            placeholder="0"
            className="w-full rounded-lg border border-cacao/15 bg-cream px-2 py-1 text-cacao focus:border-cherry"
          />
        </label>
      )}
    </div>
  );
}
