import { useMemo, useState } from "react";
import { downloadCsv } from "../../lib/csv";
import { getBookkeepingProofUrl, getInvoiceProofUrl } from "../../lib/supabase/bookkeeping";
import { formatPriceEUR } from "../../lib/supabase/format";
import type { LedgerEntry } from "../../lib/supabase/types";
import { BookkeepingEntryModal } from "./BookkeepingEntryModal";
import { useBookkeeping } from "./useBookkeeping";

type KindFilter = "all" | "income" | "expense";

function toDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

const EXPORT_LINK_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 1 week — long enough to still work once the CSV is opened later

async function getProofUrl(entry: LedgerEntry, expiresInSeconds?: number): Promise<string | null> {
  if (!entry.proofBucket || !entry.proofPath) return null;
  return entry.proofBucket === "invoices"
    ? getInvoiceProofUrl(entry.proofPath, expiresInSeconds)
    : getBookkeepingProofUrl(entry.proofPath, expiresInSeconds);
}

async function openProof(entry: LedgerEntry) {
  const url = await getProofUrl(entry);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export function BookkeepingPage() {
  const { entries, years, loading, error, addIncome, addExpense, removeIncome, removeExpense, removeOrderIncome } =
    useBookkeeping();

  const [year, setYear] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [modal, setModal] = useState<"income" | "expense" | null>(null);
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (year !== "all" && !entry.entryDate.startsWith(year)) return false;
      if (from && entry.entryDate < from) return false;
      if (to && entry.entryDate > to) return false;
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      return true;
    });
  }, [entries, year, from, to, kindFilter]);

  const totals = useMemo(() => {
    const income = filtered.filter((e) => e.kind === "income").reduce((sum, e) => sum + e.amount, 0);
    const expense = filtered.filter((e) => e.kind === "expense").reduce((sum, e) => sum + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  async function handleViewProof(entry: LedgerEntry) {
    setProofBusyId(entry.id);
    try {
      await openProof(entry);
    } finally {
      setProofBusyId(null);
    }
  }

  function handleDelete(entry: LedgerEntry) {
    const rawId = entry.id.slice(entry.id.indexOf(":") + 1);

    if (entry.source === "order") {
      if (
        !window.confirm(
          "Deze inkomst uit de boekhouding verwijderen? De bestelling zelf blijft gewoon in het Archief staan.",
        )
      )
        return;
      void removeOrderIncome(rawId);
      return;
    }

    if (!window.confirm("Deze boeking definitief verwijderen? Dit kan niet ongedaan gemaakt worden.")) return;
    if (entry.kind === "income") void removeIncome(rawId);
    else void removeExpense(rawId);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const headers = ["Datum", "Type", "Categorie", "Omschrijving", "Bedrag (EUR)", "Betaald", "Bewijslink"];
      const rows = await Promise.all(
        filtered.map(async (entry) => {
          let proofUrl = "";
          try {
            proofUrl = (await getProofUrl(entry, EXPORT_LINK_EXPIRY_SECONDS)) ?? "";
          } catch {
            proofUrl = "";
          }
          return [
            toDisplayDate(entry.entryDate),
            entry.kind === "income" ? "Inkomst" : "Uitgave",
            entry.categoryLabel,
            entry.description,
            formatPriceEUR(entry.amount),
            entry.paid === null ? "" : entry.paid ? "Ja" : "Nee",
            proofUrl,
          ];
        }),
      );
      const label = year === "all" ? "alle-jaren" : year;
      downloadCsv(`boekhouding-${label}.csv`, headers, rows);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cacao">Boekhouding</h1>
          <p className="mt-1 text-sm text-cacao-soft">Inkomsten en uitgaven, met bewijsstukken en export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModal("income")}
            className="rounded-full bg-cherry px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cherry-dark"
          >
            Inkomst toevoegen
          </button>
          <button
            type="button"
            onClick={() => setModal("expense")}
            className="rounded-full bg-cacao/10 px-5 py-2.5 text-sm font-semibold text-cacao hover:bg-cacao/20"
          >
            Uitgave toevoegen
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-cacao/10 bg-cream-dark p-4">
              <p className="text-xs uppercase tracking-wide text-cacao-soft">Inkomsten</p>
              <p className="mt-1 font-display text-xl font-semibold text-cacao">{formatPriceEUR(totals.income)} EUR</p>
            </div>
            <div className="rounded-2xl border border-cacao/10 bg-cream-dark p-4">
              <p className="text-xs uppercase tracking-wide text-cacao-soft">Uitgaven</p>
              <p className="mt-1 font-display text-xl font-semibold text-cacao">{formatPriceEUR(totals.expense)} EUR</p>
            </div>
            <div className="rounded-2xl border border-cacao/10 bg-cream-dark p-4">
              <p className="text-xs uppercase tracking-wide text-cacao-soft">Resultaat</p>
              <p className={`mt-1 font-display text-xl font-semibold ${totals.net < 0 ? "text-cherry" : "text-cacao"}`}>
                {formatPriceEUR(totals.net)} EUR
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-cacao/10 bg-cream-dark p-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
              Jaar
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry"
              >
                <option value="all">Alle jaren</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
              Van
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
              Tot
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-cacao">
              Type
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as KindFilter)}
                className="rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry"
              >
                <option value="all">Alles</option>
                <option value="income">Inkomsten</option>
                <option value="expense">Uitgaven</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={filtered.length === 0 || exporting}
              className="ml-auto rounded-full bg-cacao/10 px-5 py-2.5 text-sm font-semibold text-cacao hover:bg-cacao/20 disabled:opacity-40"
            >
              {exporting ? "Bezig met exporteren…" : "Exporteren (CSV)"}
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-cacao-soft">Geen boekingen voor deze filters.</p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-cacao/10 bg-cream-dark">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-cacao/10 text-xs uppercase tracking-wide text-cacao-soft">
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium">Categorie</th>
                    <th className="px-4 py-3 font-medium">Omschrijving</th>
                    <th className="px-4 py-3 font-medium">Bedrag</th>
                    <th className="px-4 py-3 font-medium">Bewijs</th>
                    <th className="px-4 py-3 font-medium">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="border-b border-cacao/5 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-cacao-soft">{toDisplayDate(entry.entryDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            entry.kind === "income" ? "bg-cherry/15 text-cherry" : "bg-cacao/10 text-cacao-soft"
                          }`}
                        >
                          {entry.categoryLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cacao">
                        {entry.description}
                        {entry.paid !== null && (
                          <span className={`ml-2 text-xs ${entry.paid ? "text-cacao-soft" : "text-cherry"}`}>
                            ({entry.paid ? "betaald" : "nog niet betaald"})
                          </span>
                        )}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-medium ${
                          entry.kind === "income" ? "text-cacao" : "text-cherry"
                        }`}
                      >
                        {entry.kind === "income" ? "+" : "-"}
                        {formatPriceEUR(entry.amount)} EUR
                      </td>
                      <td className="px-4 py-3">
                        {entry.proofPath ? (
                          <button
                            type="button"
                            disabled={proofBusyId === entry.id}
                            onClick={() => void handleViewProof(entry)}
                            className="font-medium text-cacao hover:underline disabled:opacity-50"
                          >
                            {proofBusyId === entry.id ? "Bezig…" : "Bekijken"}
                          </button>
                        ) : (
                          <span className="text-cacao-soft/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          className="font-medium text-cherry hover:underline"
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal === "income" && (
        <BookkeepingEntryModal kind="income" onClose={() => setModal(null)} onSave={addIncome} />
      )}
      {modal === "expense" && (
        <BookkeepingEntryModal kind="expense" onClose={() => setModal(null)} onSave={addExpense} />
      )}
    </div>
  );
}
