import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadSiteImage } from "../../lib/supabase/pageContent";
import { createWorkshop, getWorkshopById, updateWorkshop } from "../../lib/supabase/workshops";
import type { WorkshopInput } from "../../lib/supabase/types";

const EMPTY_INPUT: WorkshopInput = {
  name: "",
  event_date: null,
  time_range: "",
  location: "",
  price: null,
  description: "",
  cta_text: "Je kan je plekje reserveren door me een berichtje te sturen",
  spots_note: "",
  image_url: null,
  sort_order: 0,
};

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

export function WorkshopForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [input, setInput] = useState<WorkshopInput>(EMPTY_INPUT);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getWorkshopById(id).then((workshop) => {
      if (workshop) {
        setInput({
          name: workshop.name,
          event_date: workshop.event_date,
          time_range: workshop.time_range,
          location: workshop.location,
          price: workshop.price,
          description: workshop.description,
          cta_text: workshop.cta_text,
          spots_note: workshop.spots_note,
          image_url: workshop.image_url,
          sort_order: workshop.sort_order,
        });
        setImagePreview(workshop.image_url);
      }
      setLoading(false);
    });
  }, [id]);

  function handleFileChange(file: File | null) {
    setPendingFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : input.image_url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let imageUrl = input.image_url;
      if (pendingFile) imageUrl = await uploadSiteImage(pendingFile, "workshops");
      const payload = { ...input, image_url: imageUrl };

      if (isEditing && id) await updateWorkshop(id, payload);
      else await createWorkshop(payload);
      navigate("/admin/site/workshops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon workshop niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">{isEditing ? "Workshop bewerken" : "Nieuwe workshop"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Naam
          <input
            required
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Datum
            <input
              type="date"
              value={input.event_date ?? ""}
              onChange={(e) => setInput({ ...input, event_date: e.target.value || null })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Tijd
            <input
              required
              value={input.time_range}
              onChange={(e) => setInput({ ...input, time_range: e.target.value })}
              placeholder="Bv. van 14u tot 18u"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Locatie
            <input
              required
              value={input.location}
              onChange={(e) => setInput({ ...input, location: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Prijs (EUR)
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={input.price ?? ""}
              onChange={(e) => setInput({ ...input, price: e.target.value === "" ? null : Number(e.target.value) })}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Beschrijving
          <textarea
            required
            rows={3}
            value={input.description}
            onChange={(e) => setInput({ ...input, description: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Plaatsen-tekst
          <input
            required
            value={input.spots_note}
            onChange={(e) => setInput({ ...input, spots_note: e.target.value })}
            placeholder="Bv. Nog 6 plaatsen beschikbaar"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Oproeptekst voor inschrijven
          <input
            required
            value={input.cta_text}
            onChange={(e) => setInput({ ...input, cta_text: e.target.value })}
            className={inputClass}
          />
        </label>

        <div>
          <p className="text-sm font-medium text-cacao">Foto</p>
          <div className="mt-2 flex items-center gap-4">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-24 w-24 rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-cream text-xs text-cacao-soft/60">
                Geen foto
              </div>
            )}
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-cacao/25 px-4 py-2 text-sm font-medium text-cacao-soft hover:border-cherry">
              Foto kiezen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-cherry">{error}</p>}

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
