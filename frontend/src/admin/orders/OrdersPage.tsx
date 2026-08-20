import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrderCard } from "./OrderCard";
import { useOrders } from "./useOrders";

export function OrdersPage() {
  const {
    pending,
    accepted,
    declined,
    invoicesByOrderId,
    invoiceHistoryByOrderId,
    staleOrderIds,
    loading,
    error,
    accept,
    reopen,
    declineWithReason,
    archive,
    saveDetails,
    saveFields,
    remove,
    togglePaid,
    resendOrderInvoice,
  } = useOrders();

  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Jump straight to a specific order — e.g. from the Kalender "wachtend"
  // list — scroll it into view and briefly highlight it, then clear the
  // param so a page refresh doesn't keep re-triggering it.
  useEffect(() => {
    if (!focusId || loading) return;
    const el = document.getElementById(`order-${focusId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(focusId);
      const timer = setTimeout(() => setHighlightedId(null), 2500);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("focus");
        return next;
      });
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, loading]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cacao">Bestellingen</h1>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && (
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <section>
            <h2 className="font-display text-lg text-cacao">Wachtend ({pending.length})</h2>
            <div className="mt-3 space-y-3">
              {pending.length === 0 && <p className="text-sm text-cacao-soft">Geen wachtende bestellingen.</p>}
              {pending.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={accept}
                  onDecline={declineWithReason}
                  onSaveFields={saveFields}
                  highlighted={highlightedId === order.id}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-cacao">Geaccepteerd ({accepted.length})</h2>
            <div className="mt-3 space-y-3">
              {accepted.length === 0 && <p className="text-sm text-cacao-soft">Nog geen geaccepteerde bestellingen.</p>}
              {accepted.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  invoice={invoicesByOrderId.get(order.id)}
                  invoiceHistory={invoiceHistoryByOrderId.get(order.id)}
                  isInvoiceStale={staleOrderIds.has(order.id)}
                  onSaveDetails={saveDetails}
                  onSaveFields={saveFields}
                  onArchive={archive}
                  onDecline={declineWithReason}
                  onTogglePaid={togglePaid}
                  onResendInvoice={resendOrderInvoice}
                  highlighted={highlightedId === order.id}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-cacao">Geweigerd ({declined.length})</h2>
            <div className="mt-3 space-y-3">
              {declined.length === 0 && <p className="text-sm text-cacao-soft">Geen geweigerde bestellingen.</p>}
              {declined.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  invoice={invoicesByOrderId.get(order.id)}
                  onReopen={reopen}
                  onDelete={remove}
                  highlighted={highlightedId === order.id}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
