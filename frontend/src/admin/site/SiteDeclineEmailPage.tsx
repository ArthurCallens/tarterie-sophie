import { useState, type FormEvent } from "react";
import type { DeclineEmailContent } from "../../lib/supabase/types";
import { renderEmailTemplate } from "../../lib/emailTemplate";
import { usePageContent } from "./usePageContent";

const FALLBACK: DeclineEmailContent = {
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

const PLACEHOLDERS = [
  { token: "{{naam}}", meaning: "naam van de klant" },
  { token: "{{reden}}", meaning: "de reden die je typt bij het weigeren" },
  { token: "{{bedrijfsnaam}}", meaning: "Tarterie Sophie" },
  { token: "{{eigenaar}}", meaning: "jouw naam (ondertekening)" },
];

const PREVIEW_VARS = {
  naam: "Marie Janssens",
  reden: "we hebben op deze datum helaas geen plaats meer in onze planning.",
  bedrijfsnaam: "Tarterie Sophie",
  eigenaar: "Sophie Cardon",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function SiteDeclineEmailPage() {
  const { content, setContent, loading, error, save } = usePageContent<DeclineEmailContent>(
    "decline_email",
    FALLBACK,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await save(content);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kon gegevens niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cacao">Weigeringsmail</h1>
      <p className="mt-1 text-sm text-cacao-soft">
        De e-mail die een klant krijgt wanneer je een bestelling weigert. Volledig aanpasbaar — gebruik de
        plaatshouders hieronder, die worden automatisch ingevuld bij het versturen.
      </p>

      <div className="mt-4 max-w-2xl rounded-xl border border-cacao/10 bg-cream-dark px-4 py-3 text-xs text-cacao-soft">
        <p className="font-medium text-cacao">Beschikbare plaatshouders:</p>
        <ul className="mt-1.5 space-y-0.5">
          {PLACEHOLDERS.map((p) => (
            <li key={p.token}>
              <code className="rounded bg-cacao/10 px-1.5 py-0.5 font-mono text-cherry">{p.token}</code> —{" "}
              {p.meaning}
            </li>
          ))}
        </ul>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Onderwerp
            <input
              required
              value={content.subject}
              onChange={(e) => setContent({ ...content, subject: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Inhoud
            <textarea
              required
              rows={10}
              value={content.body}
              onChange={(e) => setContent({ ...content, body: e.target.value })}
              className={inputClass}
            />
          </label>

          {(error || saveError) && <p className="text-sm text-cherry">{saveError ?? error}</p>}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-cherry px-6 py-3 font-semibold text-cream hover:bg-cherry-dark disabled:opacity-60"
            >
              {saving ? "Bezig met opslaan…" : "Opslaan"}
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div className="mt-8 max-w-2xl">
          <h2 className="font-display text-lg font-semibold text-cacao">Voorbeeld</h2>
          <p className="mt-1 text-xs text-cacao-soft">Met voorbeeldgegevens, zo zal de e-mail er ongeveer uitzien.</p>
          <div className="mt-3 rounded-2xl border border-cacao/15 bg-cream-dark p-5 text-sm text-cacao">
            <p className="text-xs font-medium uppercase tracking-wide text-cacao-soft">Onderwerp</p>
            <p className="mt-1 font-medium">{renderEmailTemplate(content.subject, PREVIEW_VARS)}</p>
            <p className="mt-4 whitespace-pre-wrap text-xs font-medium uppercase tracking-wide text-cacao-soft">
              Inhoud
            </p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{renderEmailTemplate(content.body, PREVIEW_VARS)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
