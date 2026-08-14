/**
 * Resizes and re-encodes an image client-side before it's ever uploaded, so
 * the site stays fast (smaller files download quicker) and Supabase Storage
 * doesn't fill up with full-resolution phone photos nobody needs at web
 * size. Used for anything shown as a photo on the site (products, custom
 * cake gallery, site hero/portrait images, customer inspiration photos) —
 * deliberately NOT used for bookkeeping proof uploads, where the original
 * quality/legibility matters more than file size.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.8 }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  // Nothing to gain re-encoding an already-vector or already-tiny format —
  // and SVGs have no pixel dimensions to draw onto a canvas in the first place.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // re-encode didn't actually help — keep the original

    const compressedName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], compressedName, { type: "image/jpeg" });
  } catch {
    // Any failure here (unsupported format, decode error, …) — fall back to
    // uploading the original rather than blocking the upload entirely.
    return file;
  }
}
