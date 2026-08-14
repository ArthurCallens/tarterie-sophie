import { supabase } from "./client";
import type { Invoice, InvoiceSnapshot, Order } from "./types";

/**
 * Admin: every invoice (active and superseded). Callers typically split this
 * into "the one active invoice per order" and "that order's superseded
 * history" — see useOrders.ts.
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from("invoices").select("*");
  if (error) throw error;
  return data as Invoice[];
}

/** The order fields an invoice is actually rendered from — same shape as InvoiceSnapshot. */
export function invoiceRelevantFields(order: Order): InvoiceSnapshot {
  return {
    price: order.price,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    occasion: order.occasion,
    servings: order.servings,
    flavor: order.flavor,
    pickup_date: order.pickup_date,
    items: order.items,
  };
}

/** True once an order's live data has drifted from what its currently-active sent invoice says. */
export function isInvoiceStale(order: Order, activeInvoice: Invoice | null | undefined): boolean {
  if (!activeInvoice || activeInvoice.status !== "sent") return false;
  const current = invoiceRelevantFields(order);
  const snapshot = activeInvoice.snapshot;
  return (
    current.price !== snapshot.price ||
    current.customer_name !== snapshot.customer_name ||
    current.customer_email !== snapshot.customer_email ||
    current.occasion !== snapshot.occasion ||
    current.servings !== snapshot.servings ||
    current.flavor !== snapshot.flavor ||
    current.pickup_date !== snapshot.pickup_date ||
    JSON.stringify(current.items) !== JSON.stringify(snapshot.items)
  );
}

export async function setInvoicePaid(id: string, paid: boolean): Promise<Invoice> {
  const { data, error } = await supabase.from("invoices").update({ paid }).eq("id", id).select().single();
  if (error) throw error;
  return data as Invoice;
}

/**
 * Voids an order's active invoice without replacing it yet — used when
 * declining an order that already had one sent. This guarantees a restored
 * order always gets a brand-new invoice number (no active invoice left to
 * compare against, so `generateInvoicePdf` takes its "no active invoice"
 * path), even if the price ends up identical to before — a declined-then-
 * restored order is a different business event and deserves its own
 * invoice, not a silently reused one.
 */
export async function supersedeInvoice(id: string): Promise<void> {
  const { error } = await supabase
    .from("invoices")
    .update({ status: "superseded", superseded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Manually (re)sends an accepted order's invoice, always using the order's
 * current data. If nothing invoice-relevant changed since the last send,
 * this resends the same PDF under the same invoice number (e.g. the email
 * bounced). If the price or other invoice-relevant details changed since the
 * last send, the backend automatically supersedes the old invoice and issues
 * a brand-new invoice number instead of silently rewriting the old one.
 */
export async function resendInvoice(orderId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("resend-invoice", { body: { orderId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
