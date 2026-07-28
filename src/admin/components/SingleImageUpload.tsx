import { useRef, useState } from "react";

type SingleImageUploadProps = {
  label: string;
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
};

/** A single-photo slot (hero image, portrait, workshop photo) — upload replaces, no gallery/reorder needed. */
export function SingleImageUpload({ label, imageUrl, onUpload, onRemove }: SingleImageUploadProps) {
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await onRemove();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-cacao">{label}</p>
      <div className="mt-2 flex items-center gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-24 w-24 rounded-xl object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-cream text-xs text-cacao-soft/60">
            Geen foto
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-cacao/25 px-4 py-2 text-sm font-medium text-cacao-soft hover:border-cherry">
            {busy ? "Bezig…" : imageUrl ? "Foto vervangen" : "Foto toevoegen"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          {imageUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
              className="w-fit text-xs font-medium text-cherry hover:underline disabled:opacity-50"
            >
              Foto verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
