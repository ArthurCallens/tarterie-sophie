import { useState } from "react";
import { ALLERGENS } from "../../lib/data";
import { formatPriceEUR } from "../../lib/supabase/format";
import type { Invoice, Order, OrderEditableFields } from "../../lib/supabase/types";

type OrderCardProps = {
  order: Order;
  /** The invoice generated for this order (once accepted), if any. */
  invoice?: Invoice | null;
  /** Pure display, no action controls at all (e.g. the Kalender day view). */
  readOnly?: boolean;
  onAccept?: (order: Order, price: number) => void;
  onDecline?: (order: Order) => void;
  onSaveDetails?: (order: Order, fields: { price: number | null; notes: string | null }) => void;
  onSaveFields?: (order: Order, fields: OrderEditableFields) => void;
  onArchive?: (order: Order) => void;
  onRestore?: (order: Order, price: number) => void;
  onDelete?: (order: Order) => void;
  onTogglePaid?: (invoice: Invoice, paid: boolean) => void;
  onResendInvoice?: (order: Order) => void;
};

type FieldKey = "name" | "email" | "phone" | "occasion" | "servings" | "flavor" | "allergens" | "pickupDate" | "message";

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-cacao-soft transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function parsePrice(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

const inputClass =
  "rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry";

const wijzigButtonClass =
  "shrink-0 rounded-full bg-cacao/10 px-2.5 py-0.5 text-[11px] font-semibold text-cacao-soft hover:bg-cacao/20";

/**
 * A single client-supplied field: read-only by default (guarded against
 * accidental changes), unlocked into an editable input only after an
 * explicit "Wijzig" click. Always shows what the client originally typed
 * underneath once the current value diverges from it — a permanent memory,
 * not just a during-edit hint, since `original` comes from a DB snapshot
 * that's never overwritten by later saves.
 */
function EditableField({
  label,
  value,
  original,
  onChange,
  unlocked,
  onUnlock,
  type = "text",
  min,
  multiline,
}: {
  label: string;
  value: string;
  original: string;
  onChange: (value: string) => void;
  unlocked: boolean;
  onUnlock: () => void;
  type?: "text" | "email" | "tel" | "number" | "date";
  min?: number;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-cacao">{label}</span>
        {!unlocked && (
          <button type="button" onClick={onUnlock} className={wijzigButtonClass}>
            Wijzig
          </button>
        )}
      </div>
      {unlocked ? (
        multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={inputClass} />
        ) : (
          <input
            type={type}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        )
      ) : (
        <p className="rounded-lg bg-cream px-3 py-1.5 text-cacao">{value || "—"}</p>
      )}
      {original !== value && (
        <p className="text-[11px] text-cacao-soft/70">Klant vulde in: {original || "(leeg)"}</p>
      )}
    </div>
  );
}

/** Same guarded-edit pattern as EditableField, but for the allergens multi-select. */
function AllergensField({
  allergens,
  original,
  onToggle,
  unlocked,
  onUnlock,
}: {
  allergens: string[];
  original: string[];
  onToggle: (label: string) => void;
  unlocked: boolean;
  onUnlock: () => void;
}) {
  const joined = allergens.join(", ");
  const joinedOriginal = original.join(", ");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-cacao">Allergenen</span>
        {!unlocked && (
          <button type="button" onClick={onUnlock} className={wijzigButtonClass}>
            Wijzig
          </button>
        )}
      </div>
      {unlocked ? (
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map((allergen) => {
            const active = allergens.includes(allergen.label);
            return (
              <button
                key={allergen.id}
                type="button"
                onClick={() => onToggle(allergen.label)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-cherry bg-cherry text-cream"
                    : "border-cacao/20 bg-cream text-cacao-soft hover:border-cherry"
                }`}
              >
                {allergen.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-cream px-3 py-1.5 text-cacao">{allergens.length > 0 ? joined : "geen opgegeven"}</p>
      )}
      {joined !== joinedOriginal && (
        <p className="text-[11px] text-cacao-soft/70">Klant gaf op: {original.length > 0 ? joinedOriginal : "geen"}</p>
      )}
    </div>
  );
}

export function OrderCard({
  order,
  invoice,
  readOnly = false,
  onAccept,
  onDecline,
  onSaveDetails,
  onSaveFields,
  onArchive,
  onRestore,
  onDelete,
  onTogglePaid,
  onResendInvoice,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [price, setPrice] = useState(order.price === null ? "" : String(order.price));
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [paid, setPaid] = useState(invoice?.paid ?? false);
  const [resending, setResending] = useState(false);
  const parsedPrice = parsePrice(price);

  async function handleTogglePaid(checked: boolean) {
    setPaid(checked);
    if (invoice) await onTogglePaid?.(invoice, checked);
  }

  // Editable copy of the order's own client-supplied fields.
  const [name, setName] = useState(order.customer_name);
  const [email, setEmail] = useState(order.customer_email);
  const [phone, setPhone] = useState(order.customer_phone ?? "");
  const [occasion, setOccasion] = useState(order.occasion);
  const [servings, setServings] = useState(String(order.servings));
  const [flavor, setFlavor] = useState(order.flavor);
  const [allergens, setAllergens] = useState<string[]>(order.allergens);
  const [pickupDate, setPickupDate] = useState(order.pickup_date);
  const [message, setMessage] = useState(order.message ?? "");
  const [unlocked, setUnlocked] = useState<Set<FieldKey>>(new Set());
  const isEditableStatus = !readOnly && (order.status === "pending" || order.status === "accepted");

  function unlock(key: FieldKey) {
    setUnlocked((prev) => new Set(prev).add(key));
  }

  function toggleAllergen(label: string) {
    setAllergens((prev) => (prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]));
  }

  function currentFieldEdits(): OrderEditableFields {
    return {
      customer_name: name,
      customer_email: email,
      customer_phone: phone.trim() === "" ? null : phone,
      occasion,
      servings: Number(servings) || 0,
      flavor,
      allergens,
      pickup_date: pickupDate,
      message: message.trim() === "" ? null : message,
    };
  }

  async function handleAccept() {
    if (parsedPrice === null) return;
    if (onSaveFields) await onSaveFields(order, currentFieldEdits());
    setUnlocked(new Set());
    onAccept?.(order, parsedPrice);
  }

  async function handleDecline() {
    if (onSaveFields) await onSaveFields(order, currentFieldEdits());
    setUnlocked(new Set());
    onDecline?.(order);
  }

  /**
   * The single save action for an accepted order — persists both the
   * client-field edits (above) and price/notes together. Having separate
   * "save" buttons on the same card was a real bug in an earlier version:
   * clicking one without the other looked fine (the input kept showing the
   * typed value) but silently never wrote part of it to the database, so it
   * reverted on the next real page load.
   */
  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (onSaveFields) await onSaveFields(order, currentFieldEdits());
      if (onSaveDetails) await onSaveDetails(order, { price: parsedPrice, notes: notes.trim() === "" ? null : notes });
      setUnlocked(new Set());
    } finally {
      setSaving(false);
    }
  }

  async function handleResend() {
    if (!onResendInvoice || resending) return;
    if (!window.confirm(`Factuur opnieuw versturen naar ${email}?`)) return;
    setResending(true);
    try {
      // Persist any corrected contact info first, so the resend uses it.
      if (onSaveFields) await onSaveFields(order, currentFieldEdits());
      setUnlocked(new Set());
      await onResendInvoice(order);
    } finally {
      setResending(false);
    }
  }

  function handleSoftDelete() {
    if (!onDecline) return;
    if (!window.confirm(`Bestelling van "${order.customer_name}" verwijderen? Ze verhuist naar Geweigerd.`)) return;
    onDecline(order);
  }

  function handleHardDelete() {
    if (!onDelete) return;
    if (
      !window.confirm(
        `Bestelling van "${order.customer_name}" definitief verwijderen? Dit kan niet ongedaan gemaakt worden.`,
      )
    )
      return;
    onDelete(order);
  }

  const summaryParts = [order.occasion, `${order.servings} pers.`];
  if (order.price !== null) summaryParts.push(`${formatPriceEUR(order.price)} EUR`);

  return (
    <div className="rounded-2xl border border-cacao/10 bg-cream-dark p-4 text-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex cursor-pointer items-start justify-between gap-2"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-cacao">{order.customer_name}</p>
          {!expanded && <p className="truncate text-xs text-cacao-soft">{summaryParts.join(" · ")}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="whitespace-nowrap text-xs text-cacao-soft">{order.pickup_date}</p>
          {!readOnly && order.status === "declined" && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleHardDelete();
              }}
              aria-label="Bestelling definitief verwijderen"
              title="Definitief verwijderen"
              className="rounded-full p-1.5 text-cacao-soft hover:bg-cherry/10 hover:text-cherry"
            >
              <TrashIcon />
            </button>
          )}
          <ChevronIcon expanded={expanded} />
        </div>
      </div>

      {expanded && (
        <>
          {isEditableStatus ? (
            <div className="mt-3 space-y-3 border-t border-cacao/10 pt-3">
              <p className="text-[11px] text-cacao-soft/70">
                Klik "Wijzig" om een veld aan te passen — handig als de klant nog iets anders wil.
              </p>
              <EditableField
                label="Naam"
                value={name}
                original={order.original_customer_name}
                onChange={setName}
                unlocked={unlocked.has("name")}
                onUnlock={() => unlock("name")}
              />
              <EditableField
                label="E-mail"
                value={email}
                original={order.original_customer_email}
                onChange={setEmail}
                unlocked={unlocked.has("email")}
                onUnlock={() => unlock("email")}
                type="email"
              />
              <EditableField
                label="Telefoon"
                value={phone}
                original={order.original_customer_phone ?? ""}
                onChange={setPhone}
                unlocked={unlocked.has("phone")}
                onUnlock={() => unlock("phone")}
                type="tel"
              />
              <EditableField
                label="Gelegenheid"
                value={occasion}
                original={order.original_occasion}
                onChange={setOccasion}
                unlocked={unlocked.has("occasion")}
                onUnlock={() => unlock("occasion")}
              />
              <EditableField
                label="Aantal personen"
                value={servings}
                original={String(order.original_servings)}
                onChange={setServings}
                unlocked={unlocked.has("servings")}
                onUnlock={() => unlock("servings")}
                type="number"
                min={1}
              />
              <EditableField
                label="Taart"
                value={flavor}
                original={order.original_flavor}
                onChange={setFlavor}
                unlocked={unlocked.has("flavor")}
                onUnlock={() => unlock("flavor")}
              />
              <AllergensField
                allergens={allergens}
                original={order.original_allergens}
                onToggle={toggleAllergen}
                unlocked={unlocked.has("allergens")}
                onUnlock={() => unlock("allergens")}
              />
              <EditableField
                label="Afhaaldatum"
                value={pickupDate}
                original={order.original_pickup_date}
                onChange={setPickupDate}
                unlocked={unlocked.has("pickupDate")}
                onUnlock={() => unlock("pickupDate")}
                type="date"
              />
              <EditableField
                label="Bericht"
                value={message}
                original={order.original_message ?? ""}
                onChange={setMessage}
                unlocked={unlocked.has("message")}
                onUnlock={() => unlock("message")}
                multiline
              />
            </div>
          ) : (
            <>
              <p className="text-cacao-soft">{order.customer_email}</p>

              <dl className="mt-3 space-y-1 text-cacao-soft">
                {order.customer_phone && (
                  <div>
                    <dt className="inline font-medium text-cacao">Telefoon: </dt>
                    <dd className="inline">{order.customer_phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium text-cacao">Gelegenheid: </dt>
                  <dd className="inline">{order.occasion}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-cacao">Aantal personen: </dt>
                  <dd className="inline">{order.servings}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-cacao">Taart: </dt>
                  <dd className="inline">{order.flavor}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-cacao">Allergenen: </dt>
                  <dd className="inline">
                    {order.allergens.length > 0 ? order.allergens.join(", ") : "geen opgegeven"}
                  </dd>
                </div>
                {order.message && (
                  <div>
                    <dt className="inline font-medium text-cacao">Bericht: </dt>
                    <dd className="inline">{order.message}</dd>
                  </div>
                )}
              </dl>
            </>
          )}

          {order.reference_photo_url && (
            <a href={order.reference_photo_url} target="_blank" rel="noreferrer" className="mt-3 block w-fit">
              <img
                src={order.reference_photo_url}
                alt="Inspiratiefoto van de klant"
                className="h-20 w-20 rounded-lg object-cover"
              />
            </a>
          )}

          {!readOnly && order.status === "pending" && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
                Prijs (EUR) — vereist om te accepteren
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Bv. 45"
                  className={inputClass}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={parsedPrice === null}
                  onClick={() => void handleAccept()}
                  className="rounded-full bg-cherry px-4 py-1.5 text-xs font-semibold text-cream hover:bg-cherry-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Accepteren
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecline()}
                  className="rounded-full bg-cacao/10 px-4 py-1.5 text-xs font-semibold text-cacao-soft hover:bg-cacao/20"
                >
                  Weigeren
                </button>
              </div>
            </div>
          )}

          {!readOnly && order.status === "accepted" && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
                Prijs (EUR)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Bv. 45"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
                Notities
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Interne notities…"
                  className={inputClass}
                />
              </label>
              {invoice ? (
                <div className="rounded-lg bg-cacao/5 px-3 py-2 text-xs text-cacao-soft">
                  <p>
                    <span className="font-medium text-cacao">Betaalmededeling: </span>
                    {invoice.payment_reference ?? invoice.invoice_number ?? "nog niet beschikbaar"}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-cacao">Factuurstatus: </span>
                    {invoice.status === "sent"
                      ? "verzonden"
                      : invoice.status === "failed"
                        ? "mislukt"
                        : "bezig met versturen"}
                  </p>
                  <label className="mt-1.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paid}
                      onChange={(e) => void handleTogglePaid(e.target.checked)}
                    />
                    Al betaald
                  </label>
                </div>
              ) : (
                <p className="rounded-lg bg-cacao/5 px-3 py-2 text-xs text-cacao-soft">Factuur wordt gegenereerd…</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className={`rounded-full bg-cherry/15 px-4 py-1.5 text-xs font-semibold text-cherry hover:bg-cherry/25 ${saving ? "pointer-events-none opacity-60" : ""}`}
                >
                  {saving ? "Bezig met opslaan…" : "Opslaan"}
                </button>
                {onResendInvoice && (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      invoice?.status === "failed"
                        ? "bg-cherry text-cream hover:bg-cherry-dark"
                        : "bg-cacao/10 text-cacao-soft hover:bg-cacao/20"
                    } ${resending ? "pointer-events-none opacity-60" : ""}`}
                  >
                    {resending ? "Bezig met versturen…" : invoice ? "Factuur opnieuw versturen" : "Factuur versturen"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onArchive?.(order)}
                  className="rounded-full bg-cacao/10 px-4 py-1.5 text-xs font-semibold text-cacao-soft hover:bg-cacao/20"
                >
                  Archiveren
                </button>
                <button
                  type="button"
                  onClick={handleSoftDelete}
                  className="rounded-full bg-cherry/10 px-4 py-1.5 text-xs font-semibold text-cherry hover:bg-cherry/20"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          )}

          {!readOnly && order.status === "declined" && onRestore && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <p className="text-xs text-cacao-soft">
                {invoice?.status === "sent"
                  ? "Er is al een factuur verzonden voor deze bestelling — die wordt niet automatisch opnieuw gestuurd."
                  : "Er is nog geen factuur succesvol verzonden — bij herstellen wordt er automatisch één verstuurd."}
              </p>
              <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
                Prijs (EUR) — vereist om te herstellen
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Bv. 45"
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                disabled={parsedPrice === null}
                onClick={() => parsedPrice !== null && onRestore(order, parsedPrice)}
                className="rounded-full bg-cherry px-4 py-1.5 text-xs font-semibold text-cream hover:bg-cherry-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Terug naar geaccepteerd
              </button>
            </div>
          )}

          {(readOnly || order.status === "archived") && order.price !== null && (
            <p className="mt-3 border-t border-cacao/10 pt-3 text-xs text-cacao-soft">
              Prijs: {formatPriceEUR(order.price)} EUR
              {order.notes && <> — {order.notes}</>}
              {invoice && (
                <>
                  {" "}
                  — Betaalmededeling: {invoice.payment_reference ?? invoice.invoice_number ?? "-"} (
                  {invoice.paid ? "betaald" : "nog niet betaald"})
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
