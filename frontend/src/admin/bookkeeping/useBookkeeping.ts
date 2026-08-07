import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createExpenseEntry,
  createIncomeEntry,
  deleteExpenseEntry,
  deleteIncomeEntry,
  getAllExpenseEntries,
  getAllIncomeEntries,
} from "../../lib/supabase/bookkeeping";
import { getAllInvoices } from "../../lib/supabase/invoices";
import { getAllOrders, setOrderExcludedFromBookkeeping } from "../../lib/supabase/orders";
import type {
  ExpenseEntry,
  ExpenseEntryInput,
  Invoice,
  IncomeEntry,
  IncomeEntryInput,
  LedgerEntry,
  Order,
} from "../../lib/supabase/types";

const EXPENSE_TYPE_LABEL: Record<ExpenseEntry["expense_type"], string> = {
  variable: "Variabele kost",
  fixed: "Vaste kost",
};

/**
 * Only archived orders count as income — merely "accepted" isn't final yet
 * (price/details can still change, the invoice can still be superseded), and
 * the whole point of the archive gate (useOrders.ts's `archive()`) is that
 * archiving is the moment Sophie has confirmed the invoice is correct and
 * paid. Counting it earlier could show income in the ledger that doesn't
 * match what's actually been invoiced.
 */
function orderIncomeEntries(orders: Order[], invoicesByOrderId: Map<string, Invoice>): LedgerEntry[] {
  return orders
    .filter((order) => order.status === "archived" && order.price !== null && !order.excluded_from_bookkeeping)
    .map((order) => {
      const invoice = invoicesByOrderId.get(order.id);
      return {
        id: `order:${order.id}`,
        kind: "income",
        source: "order",
        categoryLabel: "Bestelling",
        amount: order.price as number,
        description: `${order.customer_name} — ${order.occasion}`,
        entryDate: order.pickup_date,
        proofBucket: invoice?.pdf_storage_path ? "invoices" : null,
        proofPath: invoice?.pdf_storage_path ?? null,
        orderId: order.id,
        paid: invoice?.paid ?? false,
      } satisfies LedgerEntry;
    });
}

function manualIncomeEntries(entries: IncomeEntry[]): LedgerEntry[] {
  return entries.map((entry) => ({
    id: `income:${entry.id}`,
    kind: "income",
    source: "manual",
    categoryLabel: entry.origin === "order_snapshot" ? "Bestelling (verwijderd)" : "Handmatig",
    amount: entry.amount,
    description: entry.description,
    entryDate: entry.entry_date,
    proofBucket: entry.proof_storage_path ? entry.proof_bucket : null,
    proofPath: entry.proof_storage_path,
    orderId: null,
    paid: null,
  }));
}

function expenseLedgerEntries(entries: ExpenseEntry[]): LedgerEntry[] {
  return entries.map((entry) => ({
    id: `expense:${entry.id}`,
    kind: "expense",
    source: "manual",
    categoryLabel: EXPENSE_TYPE_LABEL[entry.expense_type],
    amount: entry.amount,
    description: entry.description,
    entryDate: entry.entry_date,
    proofBucket: entry.proof_storage_path ? "bookkeeping-proofs" : null,
    proofPath: entry.proof_storage_path,
    orderId: null,
    paid: null,
  }));
}

export function useBookkeeping() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, invoicesData, incomeData, expenseData] = await Promise.all([
        getAllOrders(),
        getAllInvoices(),
        getAllIncomeEntries(),
        getAllExpenseEntries(),
      ]);
      setOrders(ordersData);
      setInvoices(invoicesData);
      setIncomeEntries(incomeData);
      setExpenseEntries(expenseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon boekhouding niet laden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Only the active (non-superseded) invoice per order — a voided invoice
  // must never be what the ledger's proof/paid status points at.
  const invoicesByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const invoice of invoices) {
      if (invoice.status !== "superseded") map.set(invoice.order_id, invoice);
    }
    return map;
  }, [invoices]);

  const entries = useMemo<LedgerEntry[]>(() => {
    return [
      ...orderIncomeEntries(orders, invoicesByOrderId),
      ...manualIncomeEntries(incomeEntries),
      ...expenseLedgerEntries(expenseEntries),
    ].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [orders, invoicesByOrderId, incomeEntries, expenseEntries]);

  const years = useMemo(() => {
    const set = new Set(entries.map((e) => e.entryDate.slice(0, 4)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  async function addIncome(input: IncomeEntryInput, proofStoragePath: string | null) {
    await createIncomeEntry(input, proofStoragePath);
    await refresh();
  }

  async function addExpense(input: ExpenseEntryInput, proofStoragePath: string | null) {
    await createExpenseEntry(input, proofStoragePath);
    await refresh();
  }

  async function removeIncome(id: string) {
    const entry = incomeEntries.find((e) => e.id === id);
    if (!entry) return;
    await deleteIncomeEntry(entry);
    await refresh();
  }

  async function removeExpense(id: string) {
    const entry = expenseEntries.find((e) => e.id === id);
    if (!entry) return;
    await deleteExpenseEntry(entry);
    await refresh();
  }

  /** Hides an order's income row from the ledger — the order itself (in Archief) is untouched. */
  async function removeOrderIncome(orderId: string) {
    await setOrderExcludedFromBookkeeping(orderId, true);
    await refresh();
  }

  return {
    entries,
    years,
    loading,
    error,
    refresh,
    addIncome,
    addExpense,
    removeIncome,
    removeExpense,
    removeOrderIncome,
  };
}
