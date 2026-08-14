import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ALLERGENS } from "../../lib/data";
import {
  addProductImage,
  createProduct,
  deleteProductImage,
  getAllProductsAdmin,
  getProductById,
  reorderProductImages,
  updateProduct,
  uploadProductImageFile,
} from "../../lib/supabase/products";
import type { Product, ProductCategory, ProductImage, ProductInput } from "../../lib/supabase/types";
import { ImageManager, type ManagedImage } from "../components/ImageManager";
import { MAX_FEATURED_PRODUCTS } from "./useProducts";

const EMPTY_INPUT: ProductInput = {
  name: "",
  description: "",
  price: 0,
  category: "klassieker",
  allergens: [],
  in_stock: true,
  active: true,
  featured: false,
  sort_order: 0,
};

export function ProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [input, setInput] = useState<ProductInput>(EMPTY_INPUT);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherFeaturedCount, setOtherFeaturedCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    getProductById(id).then((p) => {
      if (p) {
        setProduct(p);
        setInput({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          allergens: p.allergens,
          in_stock: p.in_stock,
          active: p.active,
          featured: p.featured,
          sort_order: p.sort_order,
        });
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    getAllProductsAdmin().then((all) => {
      setOtherFeaturedCount(all.filter((p) => p.featured && p.id !== id).length);
    });
  }, [id]);

  const featuredLimitReached = !input.featured && otherFeaturedCount >= MAX_FEATURED_PRODUCTS;

  function toggleAllergen(allergenId: string) {
    setInput((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter((a) => a !== allergenId)
        : [...prev.allergens, allergenId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await updateProduct(id, input);
        navigate("/admin/site/bestellen");
      } else {
        const created = await createProduct(input);
        navigate(`/admin/products/${created.id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon product niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    if (!product) return;
    const { url } = await uploadProductImageFile(product.id, file);
    const nextSortOrder = product.images.length;
    const image = await addProductImage(product.id, url, product.name, nextSortOrder);
    setProduct({ ...product, images: [...product.images, image] });
  }

  async function handleDeleteImage(image: ManagedImage) {
    if (!product) return;
    await deleteProductImage(image as ProductImage);
    setProduct({ ...product, images: product.images.filter((img) => img.id !== image.id) });
  }

  async function handleReorderImages(images: ManagedImage[]) {
    if (!product) return;
    await reorderProductImages(images as ProductImage[]);
    setProduct({ ...product, images: images.map((img, index) => ({ ...(img as ProductImage), sort_order: index })) });
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cacao">
        {isEditing ? "Product bewerken" : "Nieuw product"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Naam
          <input
            required
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Beschrijving (optioneel)
          <textarea
            rows={2}
            value={input.description ?? ""}
            onChange={(e) => setInput({ ...input, description: e.target.value || null })}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        <div className="grid grid-cols-2 gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Prijs (EUR)
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={input.price}
              onChange={(e) => setInput({ ...input, price: Number(e.target.value) })}
              className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
            />
            <span className="text-xs font-normal text-cacao-soft">
              {input.category === "klassieker"
                ? "Prijs voor de volledige taart (telkens voor 8 personen)."
                : "Prijs per stuk."}
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Categorie
            <select
              value={input.category}
              onChange={(e) => setInput({ ...input, category: e.target.value as ProductCategory })}
              className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
            >
              <option value="klassieker">Klassieker</option>
              <option value="klein-gebak">Klein gebak</option>
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-cacao">Allergenen</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => {
              const active = input.allergens.includes(allergen.id);
              return (
                <button
                  key={allergen.id}
                  type="button"
                  onClick={() => toggleAllergen(allergen.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                    active ? "border-cherry bg-cherry text-cream" : "border-cacao/20 bg-cream text-cacao-soft"
                  }`}
                >
                  {allergen.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-cacao">
            <input
              type="checkbox"
              checked={input.in_stock}
              onChange={(e) => setInput({ ...input, in_stock: e.target.checked })}
            />
            Op voorraad
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-cacao">
            <input
              type="checkbox"
              checked={input.active}
              onChange={(e) => setInput({ ...input, active: e.target.checked })}
            />
            Actief (zichtbaar op de website)
          </label>
          <label
            className={`flex items-center gap-2 text-sm font-medium text-cacao ${featuredLimitReached ? "opacity-40" : ""}`}
            title={featuredLimitReached ? `Maximaal ${MAX_FEATURED_PRODUCTS} producten kunnen uitgelicht zijn.` : undefined}
          >
            <input
              type="checkbox"
              disabled={featuredLimitReached}
              checked={input.featured}
              onChange={(e) => setInput({ ...input, featured: e.target.checked })}
            />
            Uitgelicht op homepage
          </label>
        </div>
        {featuredLimitReached && (
          <p className="text-xs text-cherry">
            Er zijn al {MAX_FEATURED_PRODUCTS} producten uitgelicht — haal er eerst één weg op de productenlijst.
          </p>
        )}

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

      <div className="mt-8 border-t border-cacao/10 pt-6">
        <h2 className="font-display text-lg font-semibold text-cacao">Foto's</h2>
        {!product ? (
          <p className="mt-2 text-sm text-cacao-soft">Sla het product eerst op om foto's toe te voegen.</p>
        ) : (
          <>
            {product.images.length === 0 && (
              <p className="mt-2 text-sm text-cherry">Nog geen foto — voeg er minstens één toe.</p>
            )}
            <div className="mt-3">
              <ImageManager
                images={product.images}
                onUpload={handleUpload}
                onDelete={handleDeleteImage}
                onReorder={handleReorderImages}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
