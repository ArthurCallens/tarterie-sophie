import { useEffect, useState, type FormEvent } from "react";
import {
  addCustomCakeGalleryImage,
  deleteCustomCakeGalleryImage,
  reorderCustomCakeGalleryImages,
  updateCustomCakeOffer,
  uploadCustomCakeGalleryFile,
} from "../../lib/supabase/customCake";
import type { CustomCakeGalleryImage, CustomCakeOfferInput } from "../../lib/supabase/types";
import { ImageManager, type ManagedImage } from "../components/ImageManager";
import { useCustomCakeOffer } from "./useCustomCakeOffer";

export function CustomCakePage() {
  const { offer, setOffer, loading, error, refresh } = useCustomCakeOffer();
  const [input, setInput] = useState<CustomCakeOfferInput | null>(null);
  const [fillingDraft, setFillingDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (offer) {
      setInput({ intro: offer.intro, price: offer.price, price_unit: offer.price_unit, detail: offer.detail, fillings: offer.fillings });
    }
  }, [offer]);

  function addFilling() {
    if (!input || !fillingDraft.trim()) return;
    setInput({ ...input, fillings: [...input.fillings, fillingDraft.trim()] });
    setFillingDraft("");
  }

  function removeFilling(index: number) {
    if (!input) return;
    setInput({ ...input, fillings: input.fillings.filter((_, i) => i !== index) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateCustomCakeOffer(input);
      setOffer(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kon gegevens niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    if (!offer) return;
    const { url } = await uploadCustomCakeGalleryFile(file);
    const image = await addCustomCakeGalleryImage(url, "Voorbeeld van een gepersonaliseerde themataart", offer.gallery.length);
    setOffer({ ...offer, gallery: [...offer.gallery, image] });
  }

  async function handleDeleteImage(image: ManagedImage) {
    if (!offer) return;
    await deleteCustomCakeGalleryImage(image as CustomCakeGalleryImage);
    setOffer({ ...offer, gallery: offer.gallery.filter((img) => img.id !== image.id) });
  }

  async function handleReorderImages(images: ManagedImage[]) {
    if (!offer) return;
    await reorderCustomCakeGalleryImages(images as CustomCakeGalleryImage[]);
    setOffer({
      ...offer,
      gallery: images.map((img, index) => ({ ...(img as CustomCakeGalleryImage), sort_order: index })),
    });
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;
  if (error) return <p className="text-sm text-cherry">{error}</p>;
  if (!offer || !input) {
    return (
      <p className="text-sm text-cherry">
        Geen gegevens gevonden — de migratie-/seed-script moet eerst de "custom_cake_offer" rij aanmaken.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">Gepersonaliseerde taart</h1>
      <p className="mt-1 text-sm text-cacao-soft">
        Deze tekst, prijs en foto's verschijnen in de "Gepersonaliseerde taarten" sectie op de bestelpagina.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Introductietekst
          <textarea
            rows={3}
            required
            value={input.intro}
            onChange={(e) => setInput({ ...input, intro: e.target.value })}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Prijs
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={input.price}
              onChange={(e) => setInput({ ...input, price: Number(e.target.value) })}
              className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Eenheid
            <input
              required
              value={input.price_unit}
              onChange={(e) => setInput({ ...input, price_unit: e.target.value })}
              className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Detailtekst
          <textarea
            rows={2}
            required
            value={input.detail}
            onChange={(e) => setInput({ ...input, detail: e.target.value })}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-cacao">Mogelijke vullingen</legend>
          <ul className="mt-2 flex flex-col gap-2">
            {input.fillings.map((filling, index) => (
              <li key={index} className="flex items-center justify-between rounded-xl bg-cream px-4 py-2 text-sm text-cacao">
                {filling}
                <button type="button" onClick={() => removeFilling(index)} className="text-cherry">
                  Verwijder
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              value={fillingDraft}
              onChange={(e) => setFillingDraft(e.target.value)}
              placeholder="Bv. Mascarponeroom met lemoncurd"
              className="flex-1 rounded-xl border border-cacao/15 bg-cream px-4 py-2 text-sm text-cacao focus:border-cherry"
            />
            <button
              type="button"
              onClick={addFilling}
              className="rounded-full border-2 border-cacao px-4 py-2 text-sm font-medium text-cacao"
            >
              Toevoegen
            </button>
          </div>
        </fieldset>

        {saveError && <p className="text-sm text-cherry">{saveError}</p>}

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
        <h2 className="font-display text-lg font-semibold text-cacao">Voorbeeldfoto's</h2>
        <div className="mt-3">
          <ImageManager
            images={offer.gallery}
            onUpload={handleUpload}
            onDelete={handleDeleteImage}
            onReorder={handleReorderImages}
          />
        </div>
      </div>

      <button type="button" onClick={() => void refresh()} className="mt-6 text-sm text-cacao-soft underline">
        Herladen
      </button>
    </div>
  );
}
