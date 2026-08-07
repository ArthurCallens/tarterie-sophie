import { Link } from "react-router-dom";
import { formatPriceEUR } from "../../lib/supabase/format";
import { MAX_FEATURED_PRODUCTS, useProducts } from "./useProducts";

const CATEGORY_LABEL: Record<string, string> = {
  klassieker: "Klassieker",
  "klein-gebak": "Klein gebak",
};

export function ProductsPage() {
  const { products, loading, error, toggleActive, toggleFeatured, featuredError, remove } = useProducts();
  const featuredCount = products.filter((p) => p.featured).length;

  async function handleDelete(product: (typeof products)[number]) {
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
        {MAX_FEATURED_PRODUCTS} ({featuredCount}/{MAX_FEATURED_PRODUCTS} gekozen).
      </p>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {featuredError && <p className="mt-4 text-sm text-cherry">{featuredError}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && products.length === 0 && (
        <p className="mt-6 text-sm text-cacao-soft">Nog geen producten. Voeg er hierboven eentje toe.</p>
      )}

      {!loading && products.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-cacao/10 bg-cream-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cacao/10 text-xs uppercase tracking-wide text-cacao-soft">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Categorie</th>
                <th className="px-4 py-3 font-medium">Prijs</th>
                <th className="px-4 py-3 font-medium">Voorraad</th>
                <th className="px-4 py-3 font-medium">Actief</th>
                <th className="px-4 py-3 font-medium">Uitgelicht</th>
                <th className="px-4 py-3 font-medium">Acties</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-cacao/5 last:border-0">
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
                  <td className="px-4 py-3 text-cacao-soft">{CATEGORY_LABEL[product.category] ?? product.category}</td>
                  <td className="px-4 py-3 text-cacao-soft">{formatPriceEUR(product.price)} EUR</td>
                  <td className="px-4 py-3">
                    <span className={product.in_stock ? "text-cacao-soft" : "text-cherry"}>
                      {product.in_stock ? "Op voorraad" : "Niet op voorraad"}
                    </span>
                  </td>
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
                      <Link to={`/admin/products/${product.id}/edit`} className="font-medium text-cacao hover:underline">
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
      )}
    </div>
  );
}
