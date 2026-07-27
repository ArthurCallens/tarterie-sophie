import { useCallback, useEffect, useState } from "react";
import { deleteProduct, getAllProductsAdmin, setProductActive } from "../../lib/supabase/products";
import type { Product } from "../../lib/supabase/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { products, loading, error, refresh, toggleActive, remove };
}
