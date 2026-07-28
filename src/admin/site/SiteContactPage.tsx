import { useState, type FormEvent } from "react";
import type { ContactContent } from "../../lib/supabase/types";
import { usePageContent } from "./usePageContent";

const FALLBACK: ContactContent = {
  bannerEyebrow: "Kom langs of stuur een berichtje",
  bannerTitle: "Contact",
  addressStreet: "",
  addressCity: "",
  phone: "",
  phoneHref: "",
  email: "",
  instagramUrl: "",
  facebookUrl: "",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function SiteContactPage() {
  const { content, setContent, loading, error, save } = usePageContent<ContactContent>("contact", FALLBACK);
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

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">Contact</h1>
      <p className="mt-1 text-sm text-cacao-soft">
        Deze gegevens verschijnen op de Contactpagina en onderaan elke pagina (footer).
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Straat + nummer
            <input
              required
              value={content.addressStreet}
              onChange={(e) => setContent({ ...content, addressStreet: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Postcode + stad
            <input
              required
              value={content.addressCity}
              onChange={(e) => setContent({ ...content, addressCity: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Telefoon (weergave)
            <input
              required
              value={content.phone}
              onChange={(e) => setContent({ ...content, phone: e.target.value })}
              placeholder="0474 57 73 27"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Telefoon (voor tel:-link)
            <input
              required
              value={content.phoneHref}
              onChange={(e) => setContent({ ...content, phoneHref: e.target.value })}
              placeholder="+32474577327"
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          E-mail
          <input
            required
            type="email"
            value={content.email}
            onChange={(e) => setContent({ ...content, email: e.target.value })}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Instagram-link
            <input
              required
              value={content.instagramUrl}
              onChange={(e) => setContent({ ...content, instagramUrl: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Facebook-link
            <input
              required
              value={content.facebookUrl}
              onChange={(e) => setContent({ ...content, facebookUrl: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

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
