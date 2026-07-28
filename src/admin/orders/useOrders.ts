import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { snapshotOrderIncomeEntry } from "../../lib/supabase/bookkeeping";
import { getAllInvoices, resendInvoice, setInvoicePaid } from "../../lib/supabase/invoices";
import {
  acceptOrder,
  deleteOrder,
  getAllOrders,
  setOrderStatus,
  updateOrderDetails,
  updateOrderFields,
} from "../../lib/supabase/orders";
import type { Invoice, Order, OrderEditableFields } from "../../lib/supabase/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only the very first fetch should show the page-level "Bezig met laden…"
  // state. Every later refresh (triggered by an action like saving a field)
  // must NOT flip `loading` back to true — doing so unmounts every OrderCard
  // on the page (they're rendered inside `{!loading && ...}`), which wipes
  // any unsaved local edits on *every* card, not just the one being saved.
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    setError(null);
    try {
      const [ordersData, invoicesData] = await Promise.all([getAllOrders(), getAllInvoices()]);
      setOrders(ordersData);
      setInvoices(invoicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon bestellingen niet laden.");
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Pending → accepted. Requires a price. */
  async function accept(order: Order, price: number) {
    await acceptOrder(order.id, price);
    await refresh();
  }

  /** Declined → accepted (fixing a mistaken decline). Same underlying transition as accept. */
  async function restore(order: Order, price: number) {
    await acceptOrder(order.id, price);
    await refresh();
  }

  /** Pending → declined, or accepted → declined (soft delete). */
  async function decline(order: Order) {
    await setOrderStatus(order.id, "declined");
    await refresh();
  }

  /** Accepted → archived (finished/fulfilled). */
  async function archive(order: Order) {
    await setOrderStatus(order.id, "archived");
    await refresh();
  }

  async function saveDetails(order: Order, fields: { price: number | null; notes: string | null }) {
    await updateOrderDetails(order.id, fields);
    await refresh();
  }

  /** Sophie edits a pending order's own details (contact info, occasion, etc.) before accepting. */
  async function saveFields(order: Order, fields: OrderEditableFields) {
    await updateOrderFields(order.id, fields);
    await refresh();
  }

  /**
   * Permanently deletes a declined or archived order. If it had counted as
   * income (accepted/archived, priced, not already excluded from the ledger),
   * that income is snapshotted into Boekhouding first — deleting the order
   * must never silently erase money already recorded as earned.
   */
  async function remove(order: Order) {
    const countedAsIncome =
      (order.status === "accepted" || order.status === "archived") &&
      order.price !== null &&
      !order.excluded_from_bookkeeping;
    if (countedAsIncome) {
      await snapshotOrderIncomeEntry(order, invoicesByOrderId.get(order.id) ?? null);
    }
    await deleteOrder(order.id, order.reference_photo_url);
    await refresh();
  }

  async function togglePaid(invoice: Invoice, paid: boolean) {
    await setInvoicePaid(invoice.id, paid);
    await refresh();
  }

  /** Manually (re)sends an accepted order's invoice — e.g. after correcting a wrong email. */
  async function resendOrderInvoice(order: Order) {
    await resendInvoice(order.id);
    await refresh();
  }

  const invoicesByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const invoice of invoices) map.set(invoice.order_id, invoice);
    return map;
  }, [invoices]);

  const pending = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const accepted = useMemo(
    () => orders.filter((o) => o.status === "accepted").sort((a, b) => a.pickup_date.localeCompare(b.pickup_date)),
    [orders],
  );
  const declined = useMemo(() => orders.filter((o) => o.status === "declined"), [orders]);
  const archived = useMemo(() => orders.filter((o) => o.status === "archived"), [orders]);

  return {
    orders,
    pending,
    accepted,
    declined,
    archived,
    invoicesByOrderId,
    loading,
    error,
    refresh,
    accept,
    restore,
    decline,
    archive,
    saveDetails,
    saveFields,
    remove,
    togglePaid,
    resendOrderInvoice,
  };
}
