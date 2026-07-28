import { useMemo, useState } from "react";
import type { Order } from "../../lib/supabase/types";
import { OrderCard } from "../orders/OrderCard";
import { useOrders } from "../orders/useOrders";

/** Every field worth matching against a free-text search — name, date, cake, general words, email, phone. */
function searchableText(order: Order): string {
  return [
    order.customer_name,
    order.customer_email,
    order.customer_phone,
    order.occasion,
    order.flavor,
    order.pickup_date,
    order.message,
    order.notes,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();
}

export function ArchivePage() {
  const { archived, invoicesByOrderId, loading, error, remove } = useOrders();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return archived;
    return archived.filter((order) => {
      const haystack = searchableText(order);
      return words.every((word) => haystack.includes(word));
    });
  }, [archived, query]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cacao">Archief</h1>
      <p className="mt-1 text-sm text-cacao-soft">Afgeronde bestellingen, ter referentie.</p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek op naam, datum, taart, e-mail, gsm…"
        className="mt-4 w-full max-w-sm rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry"
      />

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && (
        <div className="mt-6 grid items-start gap-4 sm:grid-cols-3">
          {archived.length === 0 && <p className="text-sm text-cacao-soft">Nog geen gearchiveerde bestellingen.</p>}
          {archived.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-cacao-soft">Geen bestellingen gevonden voor "{query}".</p>
          )}
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} invoice={invoicesByOrderId.get(order.id)} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
