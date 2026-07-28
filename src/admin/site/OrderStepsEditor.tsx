import { useEffect, useState } from "react";
import {
  createOrderStep,
  deleteOrderStep,
  getAllOrderSteps,
  reorderOrderSteps,
  updateOrderStep,
} from "../../lib/supabase/orderSteps";
import type { OrderStep } from "../../lib/supabase/types";

const inputClass = "rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry";

function Row({
  step,
  canMoveUp,
  canMoveDown,
  onSaved,
  onDeleted,
  onMove,
}: {
  step: OrderStep;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSaved: (s: OrderStep) => void;
  onDeleted: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [title, setTitle] = useState(step.title);
  const [body, setBody] = useState(step.body);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      onSaved(await updateOrderStep(step.id, { title, body, sort_order: step.sort_order }));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Stap "${step.title}" verwijderen?`)) return;
    setBusy(true);
    try {
      await deleteOrderStep(step.id);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-xl bg-cream px-3 py-2">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={!canMoveUp || busy}
          onClick={() => onMove(-1)}
          className="rounded px-1 text-xs text-cacao-soft hover:bg-cream-dark disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!canMoveDown || busy}
          onClick={() => onMove(1)}
          className="rounded px-1 text-xs text-cacao-soft hover:bg-cream-dark disabled:opacity-30"
        >
          ↓
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" className={inputClass} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Tekst"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-full bg-cherry/15 px-3 py-1.5 text-xs font-semibold text-cherry hover:bg-cherry/25 disabled:opacity-50"
        >
          Opslaan
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="text-xs font-medium text-cherry hover:underline disabled:opacity-50"
        >
          Verwijderen
        </button>
      </div>
    </div>
  );
}

/** The "Zo werkt het" 4-step list on the Bestellen page. */
export function OrderStepsEditor() {
  const [steps, setSteps] = useState<OrderStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getAllOrderSteps()
      .then(setSteps)
      .finally(() => setLoading(false));
  }, []);

  async function addStep() {
    if (!newTitle.trim() || !newBody.trim()) return;
    setAdding(true);
    try {
      const created = await createOrderStep({ title: newTitle.trim(), body: newBody.trim(), sort_order: steps.length });
      setSteps([...steps, created]);
      setNewTitle("");
      setNewBody("");
    } finally {
      setAdding(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const reordered = [...steps];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSteps(reordered);
    await reorderOrderSteps(reordered);
    setSteps(reordered.map((s, i) => ({ ...s, sort_order: i })));
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <Row
            key={step.id}
            step={step}
            canMoveUp={index > 0}
            canMoveDown={index < steps.length - 1}
            onSaved={(updated) => setSteps(steps.map((s) => (s.id === updated.id ? updated : s)))}
            onDeleted={() => setSteps(steps.filter((s) => s.id !== step.id))}
            onMove={(direction) => void move(index, direction)}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 rounded-xl border-2 border-dashed border-cacao/20 p-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titel, bv. Kies je taart"
          className={inputClass}
        />
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={2}
          placeholder="Tekst"
          className={inputClass}
        />
        <button
          type="button"
          disabled={adding}
          onClick={() => void addStep()}
          className="w-fit rounded-full border-2 border-cacao px-4 py-1.5 text-xs font-medium text-cacao disabled:opacity-50"
        >
          Stap toevoegen
        </button>
      </div>
    </div>
  );
}
