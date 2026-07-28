import { OrderCard } from "../orders/OrderCard";
import { useOrders } from "../orders/useOrders";

export function ArchivePage() {
  const { archived, invoicesByOrderId, loading, error } = useOrders();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cacao">Archief</h1>
      <p className="mt-1 text-sm text-cacao-soft">Afgeronde bestellingen, ter referentie.</p>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {archived.length === 0 && <p className="text-sm text-cacao-soft">Nog geen gearchiveerde bestellingen.</p>}
          {archived.map((order) => (
            <OrderCard key={order.id} order={order} invoice={invoicesByOrderId.get(order.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
