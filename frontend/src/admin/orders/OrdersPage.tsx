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
    restore,
    declineWithReason,
    archive,
    saveDetails,
    saveFields,
    remove,
    togglePaid,
    resendOrderInvoice,
  } = useOrders();

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
                  onRestore={restore}
                  onDelete={remove}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
