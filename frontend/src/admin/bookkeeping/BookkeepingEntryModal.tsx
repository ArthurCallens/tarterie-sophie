import { useState, type FocusEvent, type FormEvent } from "react";
import { uploadBookkeepingProof } from "../../lib/supabase/bookkeeping";
import type { ExpenseEntryInput, ExpenseType, IncomeEntryInput } from "../../lib/supabase/types";

const inputClass = "rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry";

/** Auto-select an input's current value on focus, so typing a new number doesn't require deleting the old one first. */
function selectOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type BookkeepingEntryModalProps =
  | {
      kind: "income";
      onClose: () => void;
      onSave: (input: IncomeEntryInput, proofStoragePath: string | null) => Promise<void>;
    }
  | {
      kind: "expense";
      onClose: () => void;
      onSave: (input: ExpenseEntryInput, proofStoragePath: string | null) => Promise<void>;
    };

/** Shared "add income" / "add expense" form — the only two manual-entry paths in the bookkeeping ledger. */
export function BookkeepingEntryModal(props: BookkeepingEntryModalProps) {
  const { kind, onClose } = props;
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(today());
  const [expenseType, setExpenseType] = useState<ExpenseType>("variable");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Vul een geldig bedrag in.");
      return;
    }
    if (description.trim() === "") {
      setError("Vul een omschrijving in.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const proofStoragePath = proofFile ? await uploadBookkeepingProof(proofFile, kind) : null;
      if (kind === "income") {
        await props.onSave({ amount: parsedAmount, description, entry_date: entryDate }, proofStoragePath);
      } else {
        await props.onSave(
          { expense_type: expenseType, amount: parsedAmount, description, entry_date: entryDate },
          proofStoragePath,
        );
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cacao/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-cream-dark p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-cacao">
          {kind === "income" ? "Inkomst toevoegen" : "Uitgave toevoegen"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {kind === "expense" && (
            <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
              Soort kost
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                className={inputClass}
              >
                <option value="variable">Variabel (bv. bloem, boter)</option>
                <option value="fixed">Vast (bv. mixer, huur)</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Bedrag (EUR)
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onFocus={selectOnFocus}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Bv. 24,50"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Omschrijving
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={kind === "income" ? "Bv. verkoop op markt" : "Bv. bloem bij groothandel"}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Datum
            <input
              required
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
            Bewijs (foto of PDF, optioneel)
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              className="text-sm text-cacao-soft"
            />
          </label>

          {error && <p className="text-sm text-cherry">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-cacao/10 px-5 py-2.5 text-sm font-semibold text-cacao-soft hover:bg-cacao/20"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-cherry px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cherry-dark disabled:opacity-60"
            >
              {saving ? "Bezig met opslaan…" : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
