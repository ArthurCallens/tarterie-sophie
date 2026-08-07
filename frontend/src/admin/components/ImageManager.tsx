import { useRef, useState } from "react";

export type ManagedImage = {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

type ImageManagerProps = {
  images: ManagedImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (image: ManagedImage) => Promise<void>;
  onReorder: (images: ManagedImage[]) => Promise<void>;
};

/** Upload/reorder/delete UI shared by the Products form and the Custom Cake gallery. First image = cover. */
export function ImageManager({ images, onUpload, onDelete, onReorder }: ImageManagerProps) {
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    try {
      await onReorder(reordered);
    } finally {
      setBusy(false);
    }
  }

  async function remove(image: ManagedImage) {
    setBusy(true);
    try {
      await onDelete(image);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <div key={image.id} className="relative overflow-hidden rounded-xl border border-cacao/15">
            <img src={image.image_url} alt={image.alt_text} className="aspect-square w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-cherry px-2 py-0.5 text-[10px] font-semibold text-cream">
                Cover
              </span>
            )}
            <div className="flex items-center justify-between gap-1 bg-cream-dark px-1.5 py-1">
              <button
                type="button"
                disabled={busy || index === 0}
                onClick={() => move(index, -1)}
                className="rounded px-1.5 py-0.5 text-xs text-cacao-soft hover:bg-cream disabled:opacity-30"
                aria-label="Naar voren"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={busy || index === images.length - 1}
                onClick={() => move(index, 1)}
                className="rounded px-1.5 py-0.5 text-xs text-cacao-soft hover:bg-cream disabled:opacity-30"
                aria-label="Naar achteren"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(image)}
                className="rounded px-1.5 py-0.5 text-xs text-cherry hover:bg-cream"
                aria-label="Verwijderen"
              >
                Verwijder
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-cacao/25 px-4 py-2 text-sm font-medium text-cacao-soft hover:border-cherry">
        {busy ? "Bezig…" : "Foto's toevoegen"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
      </label>
    </div>
  );
}
