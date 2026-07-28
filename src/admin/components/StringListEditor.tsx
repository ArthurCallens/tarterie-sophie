import { useState } from "react";

type StringListEditorProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
};

/** Simple add/remove editor for a flat text list (training/planning items, etc.). */
export function StringListEditor({ label, items, onChange, placeholder }: StringListEditorProps) {
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-cacao">{label}</legend>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-2 rounded-xl bg-cream px-4 py-2 text-sm text-cacao"
          >
            {item}
            <button type="button" onClick={() => remove(index)} className="shrink-0 text-cherry">
              Verwijder
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-cacao/15 bg-cream px-4 py-2 text-sm text-cacao focus:border-cherry"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-full border-2 border-cacao px-4 py-2 text-sm font-medium text-cacao"
        >
          Toevoegen
        </button>
      </div>
    </fieldset>
  );
}
