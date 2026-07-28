import { supabase } from "./client";
import type { Invoice } from "./types";

/** Admin: every invoice, keyed by order_id for easy lookup from an order. */
export async function getAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from("invoices").select("*");
  if (error) throw error;
  return data as Invoice[];
}

export async function setInvoicePaid(id: string, paid: boolean): Promise<Invoice> {
  const { data, error } = await supabase.from("invoices").update({ paid }).eq("id", id).select().single();
  if (error) throw error;
  return data as Invoice;
}

/**
 * Manually (re)sends an accepted order's invoice — regenerates the PDF with
 * the order's current data (e.g. a corrected email) and always sends,
 * regardless of whether one was already sent before.
 */
export async function resendInvoice(orderId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("resend-invoice", { body: { orderId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
