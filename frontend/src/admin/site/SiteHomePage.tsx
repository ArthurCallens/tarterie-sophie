import { useState, type FormEvent } from "react";
import { uploadSiteImage } from "../../lib/supabase/pageContent";
import type { HomeContent } from "../../lib/supabase/types";
import { SingleImageUpload } from "../components/SingleImageUpload";
import { TrustBadgesEditor } from "./TrustBadgesEditor";
import { usePageContent } from "./usePageContent";

const FALLBACK: HomeContent = {
  heroImageUrl: null,
  heroEyebrow: "Taarten & tartelettes op bestelling — Gent",
  heroSubtext: "Handgemaakte taarten en gebakjes, gebakken op bestelling met verse ingrediënten en heel veel plezier.",
  introText: "",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function SiteHomePage() {
  const { content, setContent, loading, error, save } = usePageContent<HomeContent>("home", FALLBACK);
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

  async function handleHeroUpload(file: File) {
    const url = await uploadSiteImage(file, "site/home");
    await save({ ...content, heroImageUrl: url });
  }

  async function handleHeroRemove() {
    await save({ ...content, heroImageUrl: null });
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">Home</h1>
      <p className="mt-1 text-sm text-cacao-soft">De inhoud van de startpagina.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <SingleImageUpload label="Hero-foto" imageUrl={content.heroImageUrl} onUpload={handleHeroUpload} onRemove={handleHeroRemove} />

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Kleine tekst boven de titel
          <input
            required
            value={content.heroEyebrow}
            onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Tekst onder de titel
          <textarea
            required
            rows={2}
            value={content.heroSubtext}
            onChange={(e) => setContent({ ...content, heroSubtext: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          "Een woordje van Sophie"
          <textarea
            required
            rows={8}
            value={content.introText}
            onChange={(e) => setContent({ ...content, introText: e.target.value })}
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

      <div className="mt-8 border-t border-cacao/10 pt-6">
        <h2 className="font-display text-lg font-semibold text-cacao">Badges (Home &amp; Over mij)</h2>
        <div className="mt-3">
          <TrustBadgesEditor />
        </div>
      </div>
    </div>
  );
}
