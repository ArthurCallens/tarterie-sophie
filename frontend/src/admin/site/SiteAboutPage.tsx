import { useState, type FormEvent } from "react";
import { uploadSiteImage } from "../../lib/supabase/pageContent";
import type { AboutContent } from "../../lib/supabase/types";
import { SingleImageUpload } from "../components/SingleImageUpload";
import { StringListEditor } from "../components/StringListEditor";
import { usePageContent } from "./usePageContent";

const FALLBACK: AboutContent = {
  bannerEyebrow: "Het verhaal achter de oven",
  portraitImageUrl: null,
  introText: "",
  trainingIntro: "",
  trainingList: [],
  planningIntro: "",
  planningList: [],
  bakeOffText: "",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function SiteAboutPage() {
  const { content, setContent, loading, error, save } = usePageContent<AboutContent>("about", FALLBACK);
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

  async function handlePortraitUpload(file: File) {
    const url = await uploadSiteImage(file, "site/about");
    await save({ ...content, portraitImageUrl: url });
  }

  async function handlePortraitRemove() {
    await save({ ...content, portraitImageUrl: null });
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">Over mij</h1>
      <p className="mt-1 text-sm text-cacao-soft">De inhoud van de "Over mij" pagina.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <SingleImageUpload
          label="Portretfoto"
          imageUrl={content.portraitImageUrl}
          onUpload={handlePortraitUpload}
          onRemove={handlePortraitRemove}
        />

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
          Introtekst
          <textarea
            required
            rows={3}
            value={content.introText}
            onChange={(e) => setContent({ ...content, introText: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Zin voor de opleidingenlijst
          <input
            required
            value={content.trainingIntro}
            onChange={(e) => setContent({ ...content, trainingIntro: e.target.value })}
            className={inputClass}
          />
        </label>
        <StringListEditor
          label="Opleidingen"
          items={content.trainingList}
          onChange={(trainingList) => setContent({ ...content, trainingList })}
          placeholder="Bv. Taarten maken, Centrum voor avondonderwijs"
        />

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Zin voor de planninglijst
          <input
            required
            value={content.planningIntro}
            onChange={(e) => setContent({ ...content, planningIntro: e.target.value })}
            className={inputClass}
          />
        </label>
        <StringListEditor
          label="Planning"
          items={content.planningList}
          onChange={(planningList) => setContent({ ...content, planningList })}
          placeholder="Bv. Taarten op basis van gistdeeg, CVO Gent"
        />

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Bake Off-paragraaf
          <textarea
            required
            rows={4}
            value={content.bakeOffText}
            onChange={(e) => setContent({ ...content, bakeOffText: e.target.value })}
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
    </div>
  );
}
