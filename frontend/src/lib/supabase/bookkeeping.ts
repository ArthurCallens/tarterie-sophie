import { supabase } from "./client";
import type { ExpenseEntry, ExpenseEntryInput, IncomeEntry, IncomeEntryInput, Invoice, Order } from "./types";

function normalizeIncome(row: IncomeEntry): IncomeEntry {
  return { ...row, amount: Number(row.amount) };
}

function normalizeExpense(row: ExpenseEntry): ExpenseEntry {
  return { ...row, amount: Number(row.amount) };
}

export async function getAllIncomeEntries(): Promise<IncomeEntry[]> {
  const { data, error } = await supabase.from("income_entries").select("*").order("entry_date", { ascending: false });
  if (error) throw error;
  return (data as IncomeEntry[]).map(normalizeIncome);
}

export async function getAllExpenseEntries(): Promise<ExpenseEntry[]> {
  const { data, error } = await supabase
    .from("expense_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data as ExpenseEntry[]).map(normalizeExpense);
}

export async function createIncomeEntry(input: IncomeEntryInput, proofStoragePath: string | null): Promise<IncomeEntry> {
  const { data, error } = await supabase
    .from("income_entries")
    .insert({ ...input, proof_storage_path: proofStoragePath })
    .select()
    .single();
  if (error) throw error;
  return normalizeIncome(data as IncomeEntry);
}

export async function createExpenseEntry(
  input: ExpenseEntryInput,
  proofStoragePath: string | null,
): Promise<ExpenseEntry> {
  const { data, error } = await supabase
    .from("expense_entries")
    .insert({ ...input, proof_storage_path: proofStoragePath })
    .select()
    .single();
  if (error) throw error;
  return normalizeExpense(data as ExpenseEntry);
}

export async function deleteIncomeEntry(entry: IncomeEntry): Promise<void> {
  // Only clean up storage for proofs this feature actually owns (bookkeeping-proofs
  // uploads). An order-income snapshot's proof_bucket is 'invoices' — that PDF is
  // owned by the invoicing system, not something bookkeeping deletes.
  if (entry.proof_storage_path && entry.proof_bucket === "bookkeeping-proofs") {
    const { error: storageError } = await supabase.storage
      .from("bookkeeping-proofs")
      .remove([entry.proof_storage_path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("income_entries").delete().eq("id", entry.id);
  if (error) throw error;
}

export async function deleteExpenseEntry(entry: ExpenseEntry): Promise<void> {
  if (entry.proof_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("bookkeeping-proofs")
      .remove([entry.proof_storage_path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("expense_entries").delete().eq("id", entry.id);
  if (error) throw error;
}

/**
 * Preserves a deleted order's income in the Boekhouding ledger — called right
 * before the order itself is permanently removed, so the money it represents
 * doesn't just vanish from the books. Points at the order's own invoice PDF
 * (still sitting in the invoices bucket even after the order/invoice rows are
 * gone) as this entry's proof, instead of requiring a fresh upload.
 */
export async function snapshotOrderIncomeEntry(order: Order, invoice: Invoice | null): Promise<void> {
  if (order.price === null) return;
  const { error } = await supabase.from("income_entries").insert({
    amount: order.price,
    description: `${order.customer_name} — ${order.occasion} (verwijderde bestelling)`,
    entry_date: order.pickup_date,
    proof_storage_path: invoice?.pdf_storage_path ?? null,
    proof_bucket: invoice?.pdf_storage_path ? "invoices" : "bookkeeping-proofs",
    origin: "order_snapshot",
  });
  if (error) throw error;
}

/** Uploads a proof photo/PDF to the private bookkeeping-proofs bucket, returns its storage path. */
export async function uploadBookkeepingProof(file: File, kind: "income" | "expense"): Promise<string> {
  const path = `${kind}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("bookkeeping-proofs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Signed URL to view/download a manual entry's proof (private bucket). Defaults to a short-lived link. */
export async function getBookkeepingProofUrl(path: string, expiresInSeconds = 120): Promise<string> {
  const { data, error } = await supabase.storage.from("bookkeeping-proofs").createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Signed URL to view an order's invoice PDF — doubles as that order income's "proof". */
export async function getInvoiceProofUrl(path: string, expiresInSeconds = 120): Promise<string> {
  const { data, error } = await supabase.storage.from("invoices").createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
