/** Matches the site's existing price style: "5" for whole euros, "3,5" for fractional. */
export function formatPriceEUR(price: number): string {
  const rounded = Math.round(price * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  return isWhole ? String(rounded) : String(rounded).replace(".", ",");
}

/** Extracts the storage object path from a public product-images URL. */
export function storagePathFromUrl(url: string): string | null {
  const marker = "/object/public/product-images/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}
