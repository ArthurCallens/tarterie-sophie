import { useCallback, useEffect, useState } from "react";
import { deleteProduct, getAllProductsAdmin, setProductActive, setProductFeatured } from "../../lib/supabase/products";
import type { Product } from "../../lib/supabase/types";

export const MAX_FEATURED_PRODUCTS = 4;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await getAllProductsAdmin());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon producten niet laden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function toggleActive(product: Product) {
    await setProductActive(product.id, !product.active);
    await refresh();
  }

  async function remove(product: Product) {
    await deleteProduct(product.id, product.images);
    await refresh();
  }

  /** "Enkele favorieten" on Home only has room for 4 — block turning a 5th one on. */
  async function toggleFeatured(product: Product) {
    setFeaturedError(null);
    if (!product.featured) {
      const featuredCount = products.filter((p) => p.featured).length;
      if (featuredCount >= MAX_FEATURED_PRODUCTS) {
        setFeaturedError(
          `Er kunnen maar ${MAX_FEATURED_PRODUCTS} producten uitgelicht zijn. Haal er eerst één weg voordat je een nieuwe toevoegt.`,
        );
        return;
      }
    }
    await setProductFeatured(product.id, !product.featured);
    await refresh();
  }

  return { products, loading, error, refresh, toggleActive, toggleFeatured, featuredError, remove };
}
