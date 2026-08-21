import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ALLERGENS, hasAllergen } from "../../lib/data";
import { getInvoiceProofUrl } from "../../lib/supabase/bookkeeping";
import { formatPriceEUR } from "../../lib/supabase/format";
import { itemPhotos, legacyOrderPhotos } from "../../lib/supabase/orders";
import type { Invoice, Order, OrderDeclineFields, OrderEditableFields, OrderItem } from "../../lib/supabase/types";
import { DeclineOrderModal } from "./DeclineOrderModal";
import type { SupersededInvoice } from "./useOrders";

/**
 * Opens a signed URL to an invoice PDF in a new tab. Opens the tab
 * synchronously (before the async signed-URL fetch) and points it at the
 * result afterwards — browsers block `window.open` calls that happen after
 * an `await`, since by then it no longer looks like a direct response to the
 * click that triggered it.
 */
async function openInvoicePdf(pdfStoragePath: string) {
  const tab = window.open("", "_blank");
  try {
    const url = await getInvoiceProofUrl(pdfStoragePath, 300);
    if (tab) tab.location.href = url;
  } catch (err) {
    tab?.close();
    window.alert(err instanceof Error ? err.message : "Kon factuur niet openen.");
  }
}

type OrderCardProps = {
  order: Order;
  /** The order's currently active (non-superseded) invoice, if any. */
  invoice?: Invoice | null;
  /** Superseded (voided) invoices for this order, newest first — shown as an audit trail. */
  invoiceHistory?: SupersededInvoice[];
  /** True once the order's live data no longer matches what the active, already-sent invoice says. */
  isInvoiceStale?: boolean;
  /** Pure display, no action controls at all (e.g. the Kalender day view). */
  readOnly?: boolean;
  onAccept?: (order: Order, price: number) => void;
  onDecline?: (order: Order, fields: OrderDeclineFields) => void;
  onSaveDetails?: (order: Order, fields: { price: number | null; notes: string | null }) => void;
  onSaveFields?: (order: Order, fields: OrderEditableFields) => void;
  onArchive?: (order: Order) => void;
  /** Geweigerd → wachtend, zodat de bestelling eerst nog aangepast kan worden voor ze geaccepteerd wordt. */
  onReopen?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onTogglePaid?: (invoice: Invoice, paid: boolean) => void;
  onResendInvoice?: (order: Order) => void;
  /** Briefly highlighted — e.g. just jumped here from the Kalender "Bekijk in kalender" link. */
  highlighted?: boolean;
};

type FieldKey =
  | "name"
  | "email"
  | "phone"
  | "occasion"
  | "servings"
  | "flavor"
  | "allergens"
  | "pickupDate"
  | "message"
  | "price";

const AUTOSAVE_DELAY_MS = 800;

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
  step,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  original: string;
  onChange: (value: string) => void;
  unlocked: boolean;
  onUnlock: () => void;
  type?: "text" | "email" | "tel" | "number" | "date";
  min?: number;
  step?: number | string;
  multiline?: boolean;
  /** Replaces the "Klant vulde in: ..." line below — for fields with no client-submitted original (e.g. price). */
  hint?: string;
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
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        )
      ) : (
        <p className="rounded-lg bg-cream px-3 py-1.5 text-cacao">{value || "—"}</p>
      )}
      {hint ? (
        <p className="text-[11px] text-cacao-soft/70">{hint}</p>
      ) : (
        original !== value && <p className="text-[11px] text-cacao-soft/70">Klant vulde in: {original || "(leeg)"}</p>
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
            const active = hasAllergen(allergens, allergen.label);
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

function itemUnitLabel(category: OrderItem["category"]): string {
  if (category === "klassieker") return "taart(en)";
  if (category === "klein-gebak") return "stuk(s)";
  return "pers.";
}

/** Een lege lijn die Sophie zelf invult — bv. een taart die niet op de site staat. */
function blankItem(): OrderItem {
  return { id: `manual-${crypto.randomUUID()}`, category: "custom", label: "", quantity: 1, unitPrice: 0, lineTotal: 0 };
}

/**
 * Editable breakdown of what was actually ordered — the total price is
 * calculated from these (quantity × unit price per line), not typed in as
 * one flat number. Every line stays editable here, including the
 * personalised cake's, so Sophie can correct a quantity or bump a price
 * per item without losing the automatic calculation for everything else.
 *
 * Sophie can also add lines the customer never picked. That's the escape
 * hatch for a special request agreed over mail or phone — a cake that isn't
 * in the catalogue, an extra tier, a delivery fee. An added line is an
 * ordinary item, so it lands in the total, the invoice PDF and the
 * bookkeeping like any other, with no separate code path.
 */
function OrderItemsEditor({ items, onChange }: { items: OrderItem[]; onChange: (items: OrderItem[]) => void }) {
  // Accepts the raw typed string, not a pre-parsed/clamped number — clamping
  // on every keystroke means an empty field (e.g. after backspacing a
  // single digit to type a new one) instantly snaps back to the minimum,
  // making the field impossible to actually clear. Only `commitItem` (on
  // blur) enforces the real minimum.
  function updateItem(id: string, field: "quantity" | "unitPrice", raw: string) {
    const parsed = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: parsed } : item)));
  }

  function commitItem(id: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity || 1, unitPrice: item.unitPrice || 0 } : item,
      ),
    );
  }

  function setLabel(id: string, label: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, label } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  // Een handmatig toegevoegde lijn heeft nog geen omschrijving van de klant,
  // dus die moet Sophie zelf kunnen intypen. Lijnen die de klant zelf koos
  // blijven leesbare tekst — die omschrijving is wat de klant besteld heeft
  // en hoort niet per ongeluk overschreven te worden.
  const isManual = (item: OrderItem) => item.id.startsWith("manual-");

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-cacao">Bestelde items</span>
      <div className="flex flex-col gap-2 rounded-lg bg-cream px-3 py-2">
        {items.length === 0 && (
          <p className="text-[11px] text-cacao-soft/70">
            Nog geen items — voeg er zelf een toe om een prijs te kunnen berekenen.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-cacao/10 pb-2 last:border-0 last:pb-0"
          >
            {isManual(item) ? (
              <input
                type="text"
                value={item.label}
                onChange={(e) => setLabel(item.id, e.target.value)}
                placeholder="Omschrijving, bv. Bruidstaart 3 verdiepingen"
                className="min-w-0 flex-1 basis-full rounded-md border border-cacao/15 bg-cream px-1.5 py-1 text-cacao focus:border-cherry"
              />
            ) : (
              <span className="min-w-0 flex-1 basis-full text-cacao sm:basis-auto">{item.label}</span>
            )}
            <input
              type="number"
              min={1}
              value={item.quantity === 0 ? "" : item.quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
              onBlur={() => commitItem(item.id)}
              className="w-14 rounded-md border border-cacao/15 bg-cream px-1.5 py-1 text-center text-cacao focus:border-cherry"
            />
            <span className="text-[11px] text-cacao-soft/70">{itemUnitLabel(item.category)} à</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.unitPrice === 0 ? "" : item.unitPrice}
              onFocus={(e) => e.target.select()}
              onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
              onBlur={() => commitItem(item.id)}
              className="w-20 rounded-md border border-cacao/15 bg-cream px-1.5 py-1 text-cacao focus:border-cherry"
            />
            <span className="text-[11px] text-cacao-soft/70">EUR</span>
            <span className="ml-auto shrink-0 font-medium text-cacao">
              {formatPriceEUR(item.quantity * item.unitPrice)} EUR
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Lijn "${item.label || "zonder omschrijving"}" verwijderen`}
              title="Lijn verwijderen"
              className="shrink-0 rounded-full p-1 text-cacao-soft hover:bg-cherry/10 hover:text-cherry"
            >
              <TrashIcon />
            </button>
            {(item.imageUrls?.length ?? 0) > 0 && (
              <div className="flex basis-full flex-wrap gap-2">
                {item.imageUrls!.map((url, index) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={url}
                      alt={`Inspiratiefoto ${index + 1} voor "${item.label}"`}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, blankItem()])}
          className="w-fit rounded-full border border-dashed border-cacao/30 px-3 py-1 text-[11px] font-semibold text-cacao-soft hover:border-cherry hover:text-cherry"
        >
          + Eigen taart of extra toevoegen
        </button>
      </div>
    </div>
  );
}

function declineEmailStatusLabel(status: Order["decline_email_status"]): string {
  switch (status) {
    case "sent":
      return "e-mail verzonden";
    case "failed":
      return "e-mail versturen mislukt";
    case "pending":
      return "e-mail wordt verzonden…";
    default:
      return "";
  }
}

export function OrderCard({
  order,
  invoice,
  invoiceHistory,
  isInvoiceStale = false,
  readOnly = false,
  onAccept,
  onDecline,
  onSaveDetails,
  onSaveFields,
  onArchive,
  onReopen,
  onDelete,
  onTogglePaid,
  onResendInvoice,
  highlighted = false,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [price, setPrice] = useState(order.price === null ? "" : String(order.price));
  const [notes, setNotes] = useState(order.notes ?? "");
  const [paid, setPaid] = useState(invoice?.paid ?? false);
  const [resending, setResending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
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
  const [items, setItems] = useState<OrderItem[]>(order.items ?? []);
  const [unlocked, setUnlocked] = useState<Set<FieldKey>>(new Set());
  const isEditableStatus = !readOnly && (order.status === "pending" || order.status === "accepted");

  // Foto's die aan een taart hangen worden bij die taart getoond, in de
  // items-editor. Dit blok toont enkel wat daar niet thuishoort: de losse
  // foto's van oudere bestellingen, en — als er geen editor is (gearchiveerd,
  // geweigerd, kalenderweergave) — alles, want anders is er nergens een plek.
  const photos = isEditableStatus
    ? legacyOrderPhotos(order)
    : [...legacyOrderPhotos(order), ...itemPhotos(order)];

  const hasItems = items.length > 0;
  const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  // The order's real price whenever it has structured items — the manual
  // "Prijs (EUR)" input only remains the source of truth for orders placed
  // before this shipped (empty items array).
  const effectivePrice = hasItems ? itemsTotal : parsedPrice;

  function unlock(key: FieldKey) {
    setUnlocked((prev) => new Set(prev).add(key));
  }

  function toggleAllergen(label: string) {
    setAllergens((prev) =>
      hasAllergen(prev, label) ? prev.filter((a) => a.toLowerCase() !== label.toLowerCase()) : [...prev, label],
    );
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
      items,
    };
  }

  // Always call these two together — a save that persists field edits but
  // not price/notes (or vice versa) looks fine in the UI but silently loses
  // half the change on the next real page load.
  async function flushEdits() {
    if (onSaveFields) await onSaveFields(order, currentFieldEdits());
    if (onSaveDetails) await onSaveDetails(order, { price: effectivePrice, notes: notes.trim() === "" ? null : notes });
  }

  /**
   * Compares what's currently typed on screen — even if autosave hasn't
   * committed it yet — against the active invoice's snapshot. `isInvoiceStale`
   * (a prop, computed server-side from the last-fetched `order`) can't see an
   * edit made in the last ~800ms; this can, so Archiveren can't be clicked
   * during that window either.
   */
  function liveMismatchesInvoice(): boolean {
    if (!invoice || invoice.status !== "sent") return false;
    const snap = invoice.snapshot;
    return (
      effectivePrice !== snap.price ||
      name !== snap.customer_name ||
      email !== snap.customer_email ||
      occasion !== snap.occasion ||
      (Number(servings) || 0) !== snap.servings ||
      flavor !== snap.flavor ||
      pickupDate !== snap.pickup_date ||
      JSON.stringify(items) !== JSON.stringify(snap.items)
    );
  }

  /**
   * Autosave for an accepted order's editable fields — no "Opslaan" button.
   * `latestRef` always holds the most recent `order`/save-callback
   * references without being a dependency of the debounce effect itself:
   * including them there would re-trigger a save on every parent refresh
   * (both callbacks are recreated every render), causing an infinite
   * save → refresh → save loop instead of only saving on real edits.
   */
  const latestRef = useRef({ order, onSaveFields, onSaveDetails });
  useEffect(() => {
    latestRef.current = { order, onSaveFields, onSaveDetails };
  });

  const skipNextAutosave = useRef(true);
  useEffect(() => {
    if (order.status !== "accepted") return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      void (async () => {
        const { order: latestOrder, onSaveFields: saveFieldsFn, onSaveDetails: saveDetailsFn } = latestRef.current;
        if (saveFieldsFn) await saveFieldsFn(latestOrder, currentFieldEdits());
        if (saveDetailsFn)
          await saveDetailsFn(latestOrder, { price: effectivePrice, notes: notes.trim() === "" ? null : notes });
        setSaveStatus("saved");
      })();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order.status,
    name,
    email,
    phone,
    occasion,
    servings,
    flavor,
    allergens,
    pickupDate,
    message,
    price,
    notes,
    items,
  ]);

  async function handleAccept() {
    if (effectivePrice === null || accepting) return;
    setAccepting(true);
    try {
      if (onSaveFields) await onSaveFields(order, currentFieldEdits());
      setUnlocked(new Set());
      await onAccept?.(order, effectivePrice);
    } finally {
      setAccepting(false);
    }
  }

  function handleDeclineClick() {
    setDeclineModalOpen(true);
  }

  async function handleDeclineConfirm(fields: OrderDeclineFields) {
    setDeclineModalOpen(false);
    if (order.status === "pending" && onSaveFields) await onSaveFields(order, currentFieldEdits());
    setUnlocked(new Set());
    onDecline?.(order, fields);
  }

  async function handleResend() {
    if (!onResendInvoice || resending) return;
    const question = isInvoiceStale
      ? `Gegevens zijn gewijzigd sinds de laatste factuur. Nieuwe factuur (${email}) versturen? De vorige wordt ongeldig.`
      : `Factuur opnieuw versturen naar ${email}?`;
    if (!window.confirm(question)) return;
    setResending(true);
    try {
      // Persist any corrected contact info/price first, so the invoice uses it.
      await flushEdits();
      setUnlocked(new Set());
      await onResendInvoice(order);
    } finally {
      setResending(false);
    }
  }

  async function handleArchive() {
    if (!onArchive || archiving) return;
    setArchiving(true);
    try {
      await onArchive(order);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Archiveren is niet gelukt.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleReopen() {
    if (!onReopen || reopening) return;
    setReopening(true);
    try {
      await onReopen(order);
    } finally {
      setReopening(false);
    }
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
    <div
      id={`order-${order.id}`}
      className={`rounded-2xl border p-4 text-sm transition-colors ${
        highlighted ? "border-cherry bg-cherry/10" : "border-cacao/10 bg-cream-dark"
      }`}
    >
      {declineModalOpen && (
        <DeclineOrderModal
          customerName={order.customer_name}
          onCancel={() => setDeclineModalOpen(false)}
          onConfirm={(fields) => void handleDeclineConfirm(fields)}
        />
      )}

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
          {!expanded && (
            <p className="truncate text-xs text-cacao-soft">
              {summaryParts.join(" · ")}
              {isInvoiceStale && (
                <span className="ml-1.5 rounded-full bg-cherry/15 px-1.5 py-0.5 font-medium text-cherry">
                  ⚠ Gegevens gewijzigd
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="whitespace-nowrap text-xs text-cacao-soft">{order.pickup_date}</p>
          {!readOnly && (order.status === "declined" || order.status === "archived") && onDelete && (
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-cacao-soft/70">
                  Klik "Wijzig" om een veld aan te passen — handig als de klant nog iets anders wil.
                </p>
                {order.status === "accepted" && saveStatus !== "idle" && (
                  <p className="shrink-0 text-[11px] font-medium text-cacao-soft">
                    {saveStatus === "saving" ? "Bezig met opslaan…" : "Opgeslagen ✓"}
                  </p>
                )}
              </div>
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

          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={url}
                    alt={`Inspiratiefoto ${index + 1} van ${photos.length} van de klant`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {!readOnly && order.status === "pending" && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <Link
                to={`/admin/calendar?date=${order.pickup_date}`}
                className="inline-block text-xs font-medium text-cacao-soft underline decoration-dotted hover:text-cherry"
              >
                Bekijk in kalender — past dit op {order.pickup_date}?
              </Link>
              <OrderItemsEditor items={items} onChange={setItems} />
              {hasItems ? (
                <p className="text-sm font-semibold text-cacao">
                  Totaalprijs: <span className="text-cherry">{formatPriceEUR(itemsTotal)} EUR</span>{" "}
                  <span className="text-[11px] font-normal text-cacao-soft">
                    (automatisch berekend — pas aan indien nodig)
                  </span>
                </p>
              ) : (
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
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={effectivePrice === null || accepting}
                  onClick={() => void handleAccept()}
                  className="rounded-full bg-cherry px-4 py-1.5 text-xs font-semibold text-cream hover:bg-cherry-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {accepting ? "Bezig met accepteren…" : "Accepteren"}
                </button>
                <button
                  type="button"
                  disabled={accepting}
                  onClick={handleDeclineClick}
                  className="rounded-full bg-cacao/10 px-4 py-1.5 text-xs font-semibold text-cacao-soft hover:bg-cacao/20"
                >
                  Weigeren
                </button>
              </div>
            </div>
          )}

          {!readOnly && order.status === "accepted" && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <OrderItemsEditor items={items} onChange={setItems} />
              {hasItems ? (
                <p className="text-sm font-semibold text-cacao">
                  Totaalprijs: <span className="text-cherry">{formatPriceEUR(itemsTotal)} EUR</span>
                </p>
              ) : (
                <EditableField
                  label="Prijs (EUR)"
                  value={price}
                  original={price}
                  onChange={setPrice}
                  unlocked={unlocked.has("price")}
                  onUnlock={() => unlock("price")}
                  type="number"
                  min={0}
                  step="0.01"
                />
              )}
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
                  {isInvoiceStale && (
                    <div className="mt-1.5 rounded-md bg-cherry/10 px-2 py-1.5 font-medium text-cherry">
                      <p>Gegevens gewijzigd sinds de laatste factuur — verstuur een nieuwe factuur.</p>
                      {invoice.pdf_storage_path && (
                        <button
                          type="button"
                          onClick={() => void openInvoicePdf(invoice.pdf_storage_path!)}
                          className="mt-1 text-[11px] underline decoration-dotted"
                        >
                          Vorige factuur bekijken (om te vergelijken met de huidige gegevens)
                        </button>
                      )}
                    </div>
                  )}
                  {invoiceHistory && invoiceHistory.length > 0 && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setHistoryOpen((v) => !v)}
                        className="text-[11px] font-medium text-cacao-soft underline decoration-dotted"
                      >
                        Factuurgeschiedenis ({invoiceHistory.length})
                      </button>
                      {historyOpen && (
                        <ul className="mt-1 space-y-0.5">
                          {invoiceHistory.map((old) => (
                            <li key={old.id} className="text-[11px] text-cacao-soft/70">
                              {old.invoice_number} —{" "}
                              {old.replacedByNumber ? `ongeldig, vervangen door ${old.replacedByNumber}` : "ongeldig (bestelling werd geweigerd)"}
                              {old.pdf_storage_path && (
                                <>
                                  {" · "}
                                  <button
                                    type="button"
                                    onClick={() => void openInvoicePdf(old.pdf_storage_path!)}
                                    className="underline decoration-dotted"
                                  >
                                    bekijk
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
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
                {onResendInvoice && (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      invoice?.status === "failed" || isInvoiceStale
                        ? "bg-cherry text-cream hover:bg-cherry-dark"
                        : "bg-cacao/10 text-cacao-soft hover:bg-cacao/20"
                    } ${resending ? "pointer-events-none opacity-60" : ""}`}
                  >
                    {resending
                      ? "Bezig met versturen…"
                      : !invoice
                        ? "Factuur versturen"
                        : isInvoiceStale
                          ? "Nieuwe factuur versturen"
                          : "Factuur opnieuw versturen"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={
                    !paid ||
                    !invoice ||
                    invoice.status !== "sent" ||
                    isInvoiceStale ||
                    liveMismatchesInvoice() ||
                    saveStatus === "saving" ||
                    archiving
                  }
                  title={
                    saveStatus === "saving"
                      ? "Wacht tot de wijzigingen opgeslagen zijn"
                      : !paid
                        ? "Vink eerst 'Al betaald' aan om te kunnen archiveren"
                        : !invoice || invoice.status !== "sent"
                          ? "Wacht tot de factuur verzonden is voor je kan archiveren"
                          : isInvoiceStale || liveMismatchesInvoice()
                            ? "Verstuur eerst een nieuwe factuur — de gegevens zijn gewijzigd sinds de laatste factuur"
                            : undefined
                  }
                  onClick={() => void handleArchive()}
                  className="rounded-full bg-cacao/10 px-4 py-1.5 text-xs font-semibold text-cacao-soft hover:bg-cacao/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {archiving ? "Bezig met archiveren…" : "Archiveren"}
                </button>
                <button
                  type="button"
                  onClick={handleDeclineClick}
                  className="rounded-full bg-cherry/10 px-4 py-1.5 text-xs font-semibold text-cherry hover:bg-cherry/20"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          )}

          {!readOnly && order.status === "declined" && (
            <div className="mt-4 space-y-2 border-t border-cacao/10 pt-3">
              <p className="text-xs text-cacao-soft">
                {order.decline_notify
                  ? `Reden: "${order.decline_reason}"${
                      order.decline_email_status ? ` — ${declineEmailStatusLabel(order.decline_email_status)}` : ""
                    }`
                  : "Geen reden opgegeven — er is geen e-mail verstuurd."}
              </p>
              {onReopen && (
                <>
                  <p className="text-xs text-cacao-soft">
                    Toch aannemen? De bestelling gaat eerst terug naar <strong>Wachtend</strong>. Daar kan je alle
                    gegevens en de prijs nog aanpassen; pas als je daar op "Accepteren" klikt, wordt de factuur
                    aangemaakt en verstuurd. Ze krijgt dan altijd een nieuw factuurnummer.
                  </p>
                  <button
                    type="button"
                    disabled={reopening}
                    onClick={() => void handleReopen()}
                    className="rounded-full bg-cherry px-4 py-1.5 text-xs font-semibold text-cream hover:bg-cherry-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {reopening ? "Bezig…" : "Terug naar wachtend"}
                  </button>
                </>
              )}
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
