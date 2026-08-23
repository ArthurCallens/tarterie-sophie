import { useCallback, useEffect, useState } from "react";
import {
  deleteProduct,
  getAllProductsAdmin,
  reorderProducts,
  setProductActive,
  setProductFeatured,
} from "../../lib/supabase/products";
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

  /**
   * Reordering only makes sense within a category — the storefront always
   * queries products scoped to one category (or, for featured, grouped by
   * category then sort_order), so cross-category sort_order values never
   * interact. `products` here is already sorted category-then-sort_order
   * (getAllProductsAdmin), so filtering by category preserves order.
   */
  async function moveProduct(product: Product, direction: -1 | 1) {
    const group = products.filter((p) => p.category === product.category);
    const index = group.findIndex((p) => p.id === product.id);
    const target = index + direction;
    if (target < 0 || target >= group.length) return;
    const reordered = [...group];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderProducts(reordered);
    await refresh();
  }

  return { products, loading, error, refresh, toggleActive, toggleFeatured, featuredError, remove, moveProduct };
}
