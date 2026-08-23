import { Link } from "react-router-dom";
import { formatPriceEUR } from "../../lib/supabase/format";
import type { Product, ProductCategory } from "../../lib/supabase/types";
import { MAX_FEATURED_PRODUCTS, useProducts } from "./useProducts";

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  klassieker: "Klassiekers",
  "klein-gebak": "Klein gebak",
};

const CATEGORIES: ProductCategory[] = ["klassieker", "klein-gebak"];

export function ProductsPage() {
  const { products, loading, error, toggleActive, toggleFeatured, featuredError, remove, moveProduct } =
    useProducts();
  const featuredCount = products.filter((p) => p.featured).length;

  async function handleDelete(product: Product) {
    if (!window.confirm(`"${product.name}" definitief verwijderen? Dit kan niet ongedaan gemaakt worden.`)) return;
    await remove(product);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-cacao">Producten</h1>
        <Link
          to="/admin/products/new"
          className="rounded-full bg-cherry px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cherry-dark"
        >
          Product toevoegen
        </Link>
      </div>

      <p className="mt-2 text-sm text-cacao-soft">
        "Uitgelicht" bepaalt welke producten in "Enkele favorieten" op de homepage staan — maximaal{" "}
        {MAX_FEATURED_PRODUCTS} ({featuredCount}/{MAX_FEATURED_PRODUCTS} gekozen). De pijltjes bepalen de volgorde
        waarin producten getoond worden op de bestelpagina en (binnen elke categorie) bij "Enkele favorieten".
      </p>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {featuredError && <p className="mt-4 text-sm text-cherry">{featuredError}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && products.length === 0 && (
        <p className="mt-6 text-sm text-cacao-soft">Nog geen producten. Voeg er hierboven eentje toe.</p>
      )}

      {!loading &&
        products.length > 0 &&
        CATEGORIES.map((category) => {
          const group = products.filter((p) => p.category === category);
          if (group.length === 0) return null;
          return (
            <div key={category} className="mt-6">
              <h2 className="font-display text-lg font-semibold text-cacao">{CATEGORY_LABEL[category]}</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-cacao/10 bg-cream-dark">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-cacao/10 text-xs uppercase tracking-wide text-cacao-soft">
                      <th className="px-4 py-3 font-medium">Volgorde</th>
                      <th className="px-4 py-3 font-medium">Foto</th>
                      <th className="px-4 py-3 font-medium">Naam</th>
                      <th className="px-4 py-3 font-medium">Prijs</th>
                      <th className="px-4 py-3 font-medium">Actief</th>
                      <th className="px-4 py-3 font-medium">Uitgelicht</th>
                      <th className="px-4 py-3 font-medium">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((product, index) => (
                      <tr key={product.id} className="border-b border-cacao/5 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => void moveProduct(product, -1)}
                              className="rounded px-1.5 py-0.5 text-xs text-cacao-soft hover:bg-cream disabled:opacity-30"
                              aria-label={`"${product.name}" naar voren`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === group.length - 1}
                              onClick={() => void moveProduct(product, 1)}
                              className="rounded px-1.5 py-0.5 text-xs text-cacao-soft hover:bg-cream disabled:opacity-30"
                              aria-label={`"${product.name}" naar achteren`}
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.images[0].alt_text}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-cream" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-cacao">{product.name}</td>
                        <td className="px-4 py-3 text-cacao-soft">{formatPriceEUR(product.price)} EUR</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleActive(product)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              product.active ? "bg-cherry/15 text-cherry" : "bg-cacao/10 text-cacao-soft"
                            }`}
                          >
                            {product.active ? "Actief" : "Inactief"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleFeatured(product)}
                            title={
                              !product.featured && featuredCount >= MAX_FEATURED_PRODUCTS
                                ? `Er zijn al ${MAX_FEATURED_PRODUCTS} producten uitgelicht — klik om te proberen wisselen`
                                : undefined
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              product.featured
                                ? "bg-cherry/15 text-cherry"
                                : !product.featured && featuredCount >= MAX_FEATURED_PRODUCTS
                                  ? "bg-cacao/10 text-cacao-soft/50"
                                  : "bg-cacao/10 text-cacao-soft"
                            }`}
                          >
                            {product.featured ? "Uitgelicht" : "—"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="font-medium text-cacao hover:underline"
                            >
                              Bewerken
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleDelete(product)}
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
            </div>
          );
        })}
    </div>
  );
}
