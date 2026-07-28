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
