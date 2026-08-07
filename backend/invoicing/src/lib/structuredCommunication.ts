/**
 * Belgian structured payment communication ("gestructureerde mededeling" /
 * OGM-VCS), format +++abc/defg/hijkl+++ — a 10-digit base plus a 2-digit
 * check (base mod 97, using 97 instead of 0), commonly recognized by
 * Belgian banking apps.
 */

/** Derives the 10-digit numeric base from an "INV-YYYY-NNNNNN" invoice number. */
export function invoiceNumberToBase10(invoiceNumber: string): string {
  const match = /INV-(\d{4})-(\d{6})/.exec(invoiceNumber);
  if (!match) throw new Error(`Kan geen structuurbasis afleiden uit factuurnummer "${invoiceNumber}"`);
  return `${match[1]}${match[2]}`;
}

export function buildStructuredCommunication(base10Digits: string): string {
  if (!/^\d{10}$/.test(base10Digits)) {
    throw new Error(`Structuurbasis moet exact 10 cijfers zijn, kreeg "${base10Digits}"`);
  }
  const num = Number(base10Digits);
  let check = num % 97;
  if (check === 0) check = 97;
  const full = base10Digits + String(check).padStart(2, "0");
  return `+++${full.slice(0, 3)}/${full.slice(3, 7)}/${full.slice(7, 12)}+++`;
}
