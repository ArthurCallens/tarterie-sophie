import { useCallback, useEffect, useState } from "react";
import { getPageContent, updatePageContent } from "../../lib/supabase/pageContent";
import type { PageKey } from "../../lib/supabase/types";

/** Loads/saves one page's JSON content blob, seeded with `fallback` until (or unless) a row exists. */
export function usePageContent<T extends object>(pageKey: PageKey, fallback: T) {
  const [content, setContent] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPageContent<T>(pageKey);
      if (data) setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon gegevens niet laden.");
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save(next: T): Promise<T> {
    const saved = await updatePageContent(pageKey, next);
    setContent(saved);
    return saved;
  }

  return { content, setContent, loading, error, save, refresh };
}
