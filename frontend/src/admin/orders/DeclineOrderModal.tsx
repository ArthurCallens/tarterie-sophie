import { useEffect, useState } from "react";
import type { DeclineEmailContent, OrderDeclineFields } from "../../lib/supabase/types";
import { getPageContent } from "../../lib/supabase/pageContent";
import { renderEmailTemplate } from "../../lib/emailTemplate";

type DeclineOrderModalProps = {
  customerName: string;
  onCancel: () => void;
  onConfirm: (fields: OrderDeclineFields) => void;
};

const BUSINESS_NAME = "Tarterie Sophie";
const OWNER_NAME = "Sophie Cardon";

// Same default shown in sendDeclineEmail.ts until Sophie saves her own
// template on /admin/site/decline-email.
const DEFAULT_TEMPLATE: DeclineEmailContent = {
  subject: "Je bestelling bij {{bedrijfsnaam}}",
  body: [
    "Beste {{naam}},",
    "",
    "Helaas kunnen we je bestelling bij {{bedrijfsnaam}} niet uitvoeren.",
    "",
    "{{reden}}",
    "",
    "Excuses voor het ongemak. Heb je vragen, antwoord gerust op deze e-mail.",
    "",
    "{{eigenaar}}",
  ].join("\n"),
};

const REASON_MARKER = "REASON_MARKER_TOKEN";

/**
 * Shared "reject with reason" prompt - used both when Weigeren-ing a pending
 * order and when Verwijderen-ing (soft-declining) an accepted one. Shows the
 * *entire* email as it will actually be sent - live-fetched from Sophie's
 * own editable template (/admin/site/decline-email) - with only the reason
 * sentence editable in place, so she can see her sentence fits the
 * surrounding context rather than writing it blind in an empty box. A
 * reason is required and gets mailed to the client, unless the checkbox
 * opts out of emailing entirely (e.g. a duplicate/spam/test order).
 */
export function DeclineOrderModal({ customerName, onCancel, onConfirm }: DeclineOrderModalProps) {
  const [reason, setReason] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);
  const [template, setTemplate] = useState<DeclineEmailContent>(DEFAULT_TEMPLATE);

  useEffect(() => {
    let cancelled = false;
    getPageContent<DeclineEmailContent>("decline_email").then((data) => {
      if (!cancelled && data) setTemplate(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canConfirm = skipEmail || reason.trim() !== "";

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({ reason: skipEmail ? null : reason.trim(), notify: !skipEmail });
  }

  const renderedSubject = renderEmailTemplate(template.subject, {
    naam: customerName,
    bedrijfsnaam: BUSINESS_NAME,
    eigenaar: OWNER_NAME,
    reden: "",
  });
  const [bodyBefore, bodyAfter = ""] = renderEmailTemplate(template.body, {
    naam: customerName,
    bedrijfsnaam: BUSINESS_NAME,
    eigenaar: OWNER_NAME,
    reden: REASON_MARKER,
  }).split(REASON_MARKER);

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
          Dit is de volledige e-mail die naar {customerName} gestuurd wordt (op basis van jouw eigen sjabloon onder
          Weigeringsmail). Schrijf enkel de gemarkeerde zin.
        </p>

        <div
          className={`mt-3 rounded-lg border border-cacao/15 bg-cream-dark px-3 py-3 text-sm leading-relaxed text-cacao ${skipEmail ? "opacity-40" : ""}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-cacao-soft">Onderwerp</p>
          <p className="mt-0.5 font-medium">{renderedSubject}</p>
          <p className="mt-3 whitespace-pre-wrap">{bodyBefore}</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={skipEmail}
            rows={2}
            placeholder="Bv. we hebben op deze datum helaas geen plaats meer in onze planning."
            className="my-1 w-full resize-none rounded-md border border-cherry/40 bg-cream px-2 py-1.5 text-cacao focus:border-cherry disabled:cursor-not-allowed"
          />
          <p className="whitespace-pre-wrap">{bodyAfter}</p>
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-cacao-soft">
          <input type="checkbox" checked={skipEmail} onChange={(e) => setSkipEmail(e.target.checked)} />
          Geen reden nodig - verstuur geen e-mail naar de klant
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
