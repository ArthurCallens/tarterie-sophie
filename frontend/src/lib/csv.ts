/** Escapes a value for a CSV cell (RFC 4180: quote if it contains a comma, quote, or newline). */
function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Builds a CSV string (with UTF-8 BOM so Excel opens accented characters correctly) and triggers a download. */
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  const csv = "﻿" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
