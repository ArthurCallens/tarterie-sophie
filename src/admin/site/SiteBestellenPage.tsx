import { useState, type FormEvent } from "react";
import { CustomCakePage } from "../custom-cake/CustomCakePage";
import { ProductsPage } from "../products/ProductsPage";
import type { BestellenContent } from "../../lib/supabase/types";
import { OrderStepsEditor } from "./OrderStepsEditor";
import { usePageContent } from "./usePageContent";

const FALLBACK: BestellenContent = {
  bannerEyebrow: "Zo werkt het",
  bannerTitle: "Een taart bestellen?",
  bannerIntro: "Van eerste berichtje tot afhaalmoment — hier lees je hoe een bestelling bij Tarterie Sophie verloopt.",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function SiteBestellenPage() {
  const { content, setContent, loading, error, save } = usePageContent<BestellenContent>("bestellen", FALLBACK);
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
      <h1 className="font-display text-2xl font-semibold text-cacao">Bestellen</h1>
      <p className="mt-1 text-sm text-cacao-soft">
        Alles wat op de bestelpagina staat: introtekst, stappenplan, klassiekers/klein gebak en de
        gepersonaliseerde taart.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Kleine tekst boven de titel
            <input
              required
              value={content.bannerEyebrow}
              onChange={(e) => setContent({ ...content, bannerEyebrow: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Titel
            <input
              required
              value={content.bannerTitle}
              onChange={(e) => setContent({ ...content, bannerTitle: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Introtekst
            <textarea
              required
              rows={2}
              value={content.bannerIntro}
              onChange={(e) => setContent({ ...content, bannerIntro: e.target.value })}
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

      <div className="mt-10 max-w-2xl border-t border-cacao/10 pt-6">
        <h2 className="font-display text-lg font-semibold text-cacao">Stappenplan ("Zo werkt het")</h2>
        <div className="mt-3">
          <OrderStepsEditor />
        </div>
      </div>

      <div className="mt-10 border-t border-cacao/10 pt-6">
        <ProductsPage />
      </div>

      <div className="mt-10 border-t border-cacao/10 pt-6">
        <CustomCakePage />
      </div>
    </div>
  );
}
