import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { snapshotOrderIncomeEntry } from "../../lib/supabase/bookkeeping";
import { getAllInvoices, isInvoiceStale, resendInvoice, setInvoicePaid, supersedeInvoice } from "../../lib/supabase/invoices";
import {
  acceptOrder,
  declineOrder,
  deleteOrder,
  getAllOrders,
  sendDeclineEmail,
  setOrderStatus,
  updateOrderDetails,
  updateOrderFields,
} from "../../lib/supabase/orders";
import type { Invoice, Order, OrderDeclineFields, OrderEditableFields } from "../../lib/supabase/types";

/** A superseded invoice, plus the number of whichever invoice actually replaced it. */
export type SupersededInvoice = Invoice & { replacedByNumber: string | null };

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
      return { orders: ordersData, invoices: invoicesData };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon bestellingen niet laden.");
      return { orders: [] as Order[], invoices: [] as Invoice[] };
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Invoice generation/sending happens asynchronously (trigger.dev, a few
   * seconds), so the very first `refresh()` right after accept/restore/resend
   * usually still shows the *previous* invoice state. Poll until the order's
   * active invoice has actually changed since *before* the action started
   * (its `updated_at` differs from `baselineUpdatedAt`) and is no longer
   * "pending" — this is what makes the "gegevens gewijzigd" banner and
   * Factuurgeschiedenis update promptly instead of only on a manual reload.
   *
   * Comparing against a pre-action baseline (rather than just "is it not
   * pending") matters specifically for a resend/supersede: right as the
   * action starts, the *old* invoice is still sitting there with
   * status "sent" — checking only "not pending" would immediately (and
   * wrongly) conclude nothing needs to be waited for, before the new/updated
   * invoice has actually landed.
   */
  async function waitForInvoiceSettled(orderId: string, baselineUpdatedAt: string | null) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const { orders: freshOrders, invoices: freshInvoices } = await refresh();
      const order = freshOrders.find((o) => o.id === orderId);
      if (!order) return;
      const active = freshInvoices.find((inv) => inv.order_id === orderId && inv.status !== "superseded");
      if (active && active.updated_at !== baselineUpdatedAt && active.status !== "pending") return;
      await sleep(2000);
    }
  }

  /** Pending → accepted. Requires a price. */
  async function accept(order: Order, price: number) {
    const baselineUpdatedAt = invoicesByOrderId.get(order.id)?.updated_at ?? null;
    await acceptOrder(order.id, price);
    await waitForInvoiceSettled(order.id, baselineUpdatedAt);
  }

  /** Declined → accepted (fixing a mistaken decline). Same underlying transition as accept. */
  async function restore(order: Order, price: number) {
    const baselineUpdatedAt = invoicesByOrderId.get(order.id)?.updated_at ?? null;
    await acceptOrder(order.id, price);
    await waitForInvoiceSettled(order.id, baselineUpdatedAt);
  }

  /**
   * Pending → declined, or accepted → declined (soft delete). Always goes
   * through DeclineOrderModal, which supplies either a reason (mailed to the
   * client) or an explicit "no email needed" skip — declining never happens
   * silently by accident.
   *
   * Also voids whatever invoice was active for this order (if any) — a
   * declined order shouldn't leave a "sent" invoice looking current, and it
   * guarantees `restore()` always issues a brand-new invoice, even if the
   * price ends up unchanged when the order is later re-accepted.
   */
  async function declineWithReason(order: Order, fields: OrderDeclineFields) {
    const activeInvoice = invoicesByOrderId.get(order.id);
    await declineOrder(order.id, fields);
    if (activeInvoice) {
      await supersedeInvoice(activeInvoice.id);
    }
    if (fields.notify) {
      try {
        await sendDeclineEmail(order.id);
      } catch (err) {
        // The order is already declined at this point; a failed send just
        // means the retried trigger.dev task will mark decline_email_status
        // "failed" and Sophie can see that on the card. Don't block the UI.
        console.error("Kon weigeringsmail niet versturen", err);
      }
    }
    await refresh();
  }

  /**
   * Accepted → archived (finished/fulfilled). Re-checks against freshly
   * fetched data (not whatever the card happened to be showing) right before
   * writing the status, so archiving is only ever possible when the order is
   * genuinely paid and its sent invoice genuinely matches the order's
   * current data — never because the UI hadn't caught up yet.
   */
  async function archive(order: Order) {
    const { orders: freshOrders, invoices: freshInvoices } = await refresh();
    const freshOrder = freshOrders.find((o) => o.id === order.id);
    if (!freshOrder) throw new Error("Bestelling niet meer gevonden.");
    const activeInvoice = freshInvoices.find((inv) => inv.order_id === order.id && inv.status !== "superseded");
    if (!activeInvoice || activeInvoice.status !== "sent") {
      throw new Error("Er is nog geen verzonden factuur voor deze bestelling.");
    }
    if (isInvoiceStale(freshOrder, activeInvoice)) {
      throw new Error("De gegevens zijn gewijzigd sinds de laatste factuur — verstuur eerst een nieuwe factuur.");
    }
    if (!activeInvoice.paid) {
      throw new Error("Vink eerst 'Al betaald' aan.");
    }
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
   * income (archived, priced, not already excluded from the ledger), that
   * income is snapshotted into Boekhouding first — deleting the order must
   * never silently erase money already recorded as earned. A merely
   * "accepted" (not yet archived) order was never counted as income in the
   * first place — see `orderIncomeEntries` in useBookkeeping.ts — so nothing
   * needs preserving for it here either.
   */
  async function remove(order: Order) {
    const countedAsIncome = order.status === "archived" && order.price !== null && !order.excluded_from_bookkeeping;
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
    const baselineUpdatedAt = invoicesByOrderId.get(order.id)?.updated_at ?? null;
    await resendInvoice(order.id);
    await waitForInvoiceSettled(order.id, baselineUpdatedAt);
  }

  /** The one active (non-superseded) invoice per order — what the dashboard normally means by "the" invoice. */
  const invoicesByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const invoice of invoices) {
      if (invoice.status !== "superseded") map.set(invoice.order_id, invoice);
    }
    return map;
  }, [invoices]);

  /**
   * Voided invoices, newest first, per order — the audit trail shown as
   * "Factuurgeschiedenis". Each entry also carries the number of whichever
   * invoice actually replaced it — not necessarily the order's current
   * active invoice, if the order's data changed more than once (a chain of
   * supersessions), so a 2nd/3rd correction still shows the right lineage.
   */
  const invoiceHistoryByOrderId = useMemo(() => {
    const replacedByNumber = new Map<string, string | null>();
    for (const invoice of invoices) {
      if (invoice.replaces_invoice_id) {
        replacedByNumber.set(invoice.replaces_invoice_id, invoice.invoice_number);
      }
    }
    const map = new Map<string, SupersededInvoice[]>();
    for (const invoice of invoices) {
      if (invoice.status !== "superseded") continue;
      const list = map.get(invoice.order_id) ?? [];
      list.push({ ...invoice, replacedByNumber: replacedByNumber.get(invoice.id) ?? null });
      map.set(invoice.order_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return map;
  }, [invoices]);

  /** True once an order's live data has drifted from what its active, already-sent invoice says. */
  const staleOrderIds = useMemo(() => {
    const set = new Set<string>();
    for (const order of orders) {
      if (isInvoiceStale(order, invoicesByOrderId.get(order.id))) set.add(order.id);
    }
    return set;
  }, [orders, invoicesByOrderId]);

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
    invoiceHistoryByOrderId,
    staleOrderIds,
    loading,
    error,
    refresh,
    accept,
    restore,
    declineWithReason,
    archive,
    saveDetails,
    saveFields,
    remove,
    togglePaid,
    resendOrderInvoice,
  };
}
