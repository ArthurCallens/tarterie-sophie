import { useState } from "react";
import type { OrderDeclineFields } from "../../lib/supabase/types";

type DeclineOrderModalProps = {
  customerName: string;
  onCancel: () => void;
  onConfirm: (fields: OrderDeclineFields) => void;
};

// Must stay in sync with the actual email template in
// invoicing/src/trigger/sendDeclineEmail.ts (BUSINESS.name / BUSINESS.ownerName)
// — this preview only means something if it matches what's actually sent.
const BUSINESS_NAME = "Tarterie Sophie";
const OWNER_NAME = "Sophie Cardon";

/**
 * Shared "reject with reason" prompt — used both when Weigeren-ing a pending
 * order and when Verwijderen-ing (soft-declining) an accepted one. Shows the
 * *entire* email as it will actually be sent, with only the reason sentence
 * editable in place — so Sophie can see her sentence fits the surrounding
 * context, rather than writing it blind in an empty box. A reason is
 * required and gets mailed to the client, unless the checkbox opts out of
 * emailing entirely (e.g. a duplicate/spam/test order).
 */
export function DeclineOrderModal({ customerName, onCancel, onConfirm }: DeclineOrderModalProps) {
  const [reason, setReason] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);

  const canConfirm = skipEmail || reason.trim() !== "";

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({ reason: skipEmail ? null : reason.trim(), notify: !skipEmail });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cacao/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="w-full max-w-lg rounded-2xl bg-cream p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg text-cacao">Bestelling weigeren</h3>
        <p className="mt-1 text-xs text-cacao-soft">
          Dit is de volledige e-mail die naar {customerName} gestuurd wordt. Schrijf enkel de gemarkeerde zin — de
          rest staat vast, zo weet je zeker dat je zin er goed in past.
        </p>

        <div
          className={`mt-3 rounded-lg border border-cacao/15 bg-cream-dark px-3 py-3 text-sm leading-relaxed text-cacao ${skipEmail ? "opacity-40" : ""}`}
        >
          <p>Beste {customerName},</p>
          <p className="mt-2">Helaas kunnen we je bestelling bij {BUSINESS_NAME} niet uitvoeren.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={skipEmail}
            rows={2}
            placeholder="Bv. we hebben op deze datum helaas geen plaats meer in onze planning."
            className="mt-2 w-full resize-none rounded-md border border-cherry/40 bg-cream px-2 py-1.5 text-cacao focus:border-cherry disabled:cursor-not-allowed"
          />
          <p className="mt-2">Excuses voor het ongemak. Heb je vragen, antwoord gerust op deze e-mail.</p>
          <p className="mt-2">{OWNER_NAME}</p>
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-cacao-soft">
          <input type="checkbox" checked={skipEmail} onChange={(e) => setSkipEmail(e.target.checked)} />
          Geen reden nodig — verstuur geen e-mail naar de klant
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-cacao/10 px-4 py-1.5 text-xs font-semibold text-cacao-soft hover:bg-cacao/20"
          >
            Annuleren
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="rounded-full bg-cherry px-4 py-1.5 text-xs font-semibold text-cream hover:bg-cherry-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weigeren
          </button>
        </div>
      </div>
    </div>
  );
}
