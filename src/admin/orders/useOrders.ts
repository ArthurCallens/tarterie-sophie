import { useCallback, useEffect, useMemo, useState } from "react";
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, invoicesData] = await Promise.all([getAllOrders(), getAllInvoices()]);
      setOrders(ordersData);
      setInvoices(invoicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon bestellingen niet laden.");
    } finally {
      setLoading(false);
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

  /** Permanently deletes a declined order. */
  async function remove(order: Order) {
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
