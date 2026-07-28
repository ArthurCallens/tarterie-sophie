import { useEffect, useState } from "react";
import {
  createTrustBadge,
  deleteTrustBadge,
  getAllTrustBadges,
  updateTrustBadge,
} from "../../lib/supabase/trustBadges";
import type { TrustBadge } from "../../lib/supabase/types";

const inputClass = "rounded-lg border border-cacao/15 bg-cream px-3 py-1.5 text-sm text-cacao focus:border-cherry";

function Row({ badge, onSaved, onDeleted }: { badge: TrustBadge; onSaved: (b: TrustBadge) => void; onDeleted: () => void }) {
  const [label, setLabel] = useState(badge.label);
  const [detail, setDetail] = useState(badge.detail);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      onSaved(await updateTrustBadge(badge.id, { label, detail, sort_order: badge.sort_order }));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Badge "${badge.label}" verwijderen?`)) return;
    setBusy(true);
    try {
      await deleteTrustBadge(badge.id);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cream px-3 py-2">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className={inputClass} />
      <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Detail" className={inputClass} />
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
  );
}

/** Shared "Vertrouwd door" badges — shown on both Home and Over mij, edited once here. */
export function TrustBadgesEditor() {
  const [badges, setBadges] = useState<TrustBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getAllTrustBadges()
      .then(setBadges)
      .finally(() => setLoading(false));
  }, []);

  async function addBadge() {
    if (!newLabel.trim() || !newDetail.trim()) return;
    setAdding(true);
    try {
      const created = await createTrustBadge({ label: newLabel.trim(), detail: newDetail.trim(), sort_order: badges.length });
      setBadges([...badges, created]);
      setNewLabel("");
      setNewDetail("");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="text-sm text-cacao-soft">Bezig met laden…</p>;

  return (
    <div>
      <p className="text-sm text-cacao-soft">Verschijnt op zowel Home als Over mij.</p>
      <div className="mt-3 flex flex-col gap-2">
        {badges.map((badge) => (
          <Row
            key={badge.id}
            badge={badge}
            onSaved={(updated) => setBadges(badges.map((b) => (b.id === updated.id ? updated : b)))}
            onDeleted={() => setBadges(badges.filter((b) => b.id !== badge.id))}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label, bv. Bake Off Vlaanderen"
          className={inputClass}
        />
        <input
          value={newDetail}
          onChange={(e) => setNewDetail(e.target.value)}
          placeholder="Detail, bv. Kandidate 2022"
          className={inputClass}
        />
        <button
          type="button"
          disabled={adding}
          onClick={() => void addBadge()}
          className="rounded-full border-2 border-cacao px-4 py-1.5 text-xs font-medium text-cacao disabled:opacity-50"
        >
          Toevoegen
        </button>
      </div>
    </div>
  );
}
