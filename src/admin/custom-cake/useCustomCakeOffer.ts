import { useCallback, useEffect, useState } from "react";
import { getCustomCakeOffer } from "../../lib/supabase/customCake";
import type { CustomCakeOffer } from "../../lib/supabase/types";

export function useCustomCakeOffer() {
  const [offer, setOffer] = useState<CustomCakeOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOffer(await getCustomCakeOffer());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon gegevens niet laden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { offer, setOffer, loading, error, refresh };
}
