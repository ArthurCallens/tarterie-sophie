import QRCode from "qrcode";

type EpcQrInput = {
  name: string;
  iban: string;
  bic?: string;
  amount: number;
  remittanceInfo: string;
};

/**
 * Builds the payload string for an EPC069-12 ("SEPA QR") code — the standard
 * most Belgian/Dutch banking apps can scan to prefill a bank transfer.
 */
export function buildEpcQrPayload({ name, iban, bic, amount, remittanceInfo }: EpcQrInput): string {
  const lines = [
    "BCD",
    "002",
    "1",
    "SCT",
    bic ?? "",
    name.slice(0, 70),
    iban.replace(/\s+/g, ""),
    `EUR${amount.toFixed(2)}`,
    "",
    "",
    remittanceInfo.slice(0, 140),
  ];
  return lines.join("\n");
}

/** Renders the EPC payload as a PNG buffer, ready to embed in the PDF. */
export async function renderQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { type: "png", margin: 1, width: 300, errorCorrectionLevel: "M" });
}
