import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatPriceEUR } from "../../lib/supabase/format";
import { deleteWorkshop, getAllWorkshopsAdmin } from "../../lib/supabase/workshops";
import type { Workshop, WorkshopsBannerContent } from "../../lib/supabase/types";
import { usePageContent } from "./usePageContent";

const FALLBACK: WorkshopsBannerContent = {
  bannerEyebrow: "Zelf de handen uit de mouwen steken",
  bannerTitle: "Workshops",
  bannerIntro: "Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops die ik geef!",
  groupNote:
    "Heb je een groepje van minimum 4 en maximum 6 personen? Neem dan gerust contact met me op voor een workshop speciaal voor jullie.",
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

function toDisplayDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export function WorkshopsAdminPage() {
  const { content, setContent, loading: bannerLoading, error: bannerError, save } = usePageContent<WorkshopsBannerContent>(
    "workshops_banner",
    FALLBACK,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      setWorkshops(await getAllWorkshopsAdmin());
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Kon workshops niet laden.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  async function handleDelete(workshop: Workshop) {
    if (!window.confirm(`Workshop "${workshop.name}" definitief verwijderen?`)) return;
    await deleteWorkshop(workshop.id, workshop.image_url);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-cacao">Workshops</h1>
        <Link
          to="/admin/site/workshops/new"
          className="rounded-full bg-cherry px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cherry-dark"
        >
          Workshop toevoegen
        </Link>
      </div>

      {bannerLoading ? (
        <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-4 rounded-2xl border border-cacao/10 bg-cream-dark p-4">
          <p className="text-sm font-medium text-cacao">Tekst bovenaan de Workshops-pagina</p>
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
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Tekst over groepsworkshops (boven de lijst)
            <textarea
              required
              rows={2}
              value={content.groupNote}
              onChange={(e) => setContent({ ...content, groupNote: e.target.value })}
              className={inputClass}
            />
          </label>
          {(bannerError || saveError) && <p className="text-sm text-cherry">{saveError ?? bannerError}</p>}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-cherry/15 px-5 py-2.5 text-sm font-semibold text-cherry hover:bg-cherry/25 disabled:opacity-60"
            >
              {saving ? "Bezig met opslaan…" : "Opslaan"}
            </button>
          </div>
        </form>
      )}

      {listError && <p className="mt-4 text-sm text-cherry">{listError}</p>}
      {listLoading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!listLoading && workshops.length === 0 && (
        <p className="mt-6 text-sm text-cacao-soft">Nog geen workshops. Voeg er hierboven eentje toe.</p>
      )}

      {!listLoading && workshops.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-cacao/10 bg-cream-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cacao/10 text-xs uppercase tracking-wide text-cacao-soft">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Prijs</th>
                <th className="px-4 py-3 font-medium">Acties</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((workshop) => (
                <tr key={workshop.id} className="border-b border-cacao/5 last:border-0">
                  <td className="px-4 py-3">
                    {workshop.image_url ? (
                      <img src={workshop.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-cream" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-cacao">{workshop.name}</td>
                  <td className="px-4 py-3 text-cacao-soft">{toDisplayDate(workshop.event_date)}</td>
                  <td className="px-4 py-3 text-cacao-soft">
                    {workshop.price === null ? "—" : `${formatPriceEUR(workshop.price)} EUR`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link to={`/admin/site/workshops/${workshop.id}/edit`} className="font-medium text-cacao hover:underline">
                        Bewerken
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(workshop)}
                        className="font-medium text-cherry hover:underline"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
