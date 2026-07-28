import PDFDocument from "pdfkit";
import { BUSINESS } from "../config/business.js";
import type { OrderRow } from "./types.js";

type RenderInvoicePdfInput = {
  order: OrderRow;
  invoiceNumber: string;
  paymentReference: string;
  invoiceDate: Date;
  qrPngBuffer: Buffer;
};

const EUR = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });
const DATE_FMT = new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Renders a single-page invoice PDF and resolves with its bytes. */
export function renderInvoicePdf({
  order,
  invoiceNumber,
  paymentReference,
  invoiceDate,
  qrPngBuffer,
}: RenderInvoicePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const total = order.price ?? 0;

    // Header — business info
    doc.fontSize(20).font("Helvetica-Bold").text(BUSINESS.name, 50, 50);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text(BUSINESS.ownerName)
      .text(`${BUSINESS.address.street}`)
      .text(`${BUSINESS.address.postalCode} ${BUSINESS.address.city}, ${BUSINESS.address.country}`)
      .text(BUSINESS.email)
      .text(BUSINESS.phone);
    if (BUSINESS.vatNumber) doc.text(`BTW: ${BUSINESS.vatNumber}`);

    // Invoice meta, top-right
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("FACTUUR", 350, 50, { width: 195, align: "right" });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text(`Factuurnummer: ${invoiceNumber}`, 350, 75, { width: 195, align: "right" })
      .text(`Factuurdatum: ${DATE_FMT.format(invoiceDate)}`, { width: 195, align: "right" })
      .text(`Afhaaldatum: ${DATE_FMT.format(new Date(order.pickup_date))}`, { width: 195, align: "right" });

    // Client details
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Klant", 50, 160);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(order.customer_name, 50, 178)
      .text(order.customer_email);
    if (order.customer_phone) doc.text(order.customer_phone);

    // Line items table
    const tableTop = 240;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");
    doc.text("Omschrijving", 50, tableTop);
    doc.text("Aantal personen", 320, tableTop, { width: 130, align: "right" });
    doc.text("Bedrag", 460, tableTop, { width: 85, align: "right" });
    doc
      .moveTo(50, tableTop + 16)
      .lineTo(545, tableTop + 16)
      .strokeColor("#dddddd")
      .stroke();

    const rowY = tableTop + 26;
    const description = `${order.flavor} — ${order.occasion}`;
    doc.font("Helvetica").fillColor("#333333").fontSize(10);
    doc.text(description, 50, rowY, { width: 260 });
    doc.text(String(order.servings), 320, rowY, { width: 130, align: "right" });
    doc.text(EUR.format(total), 460, rowY, { width: 85, align: "right" });

    if (order.allergens.length > 0) {
      doc.fontSize(8).fillColor("#888888").text(`Allergenen: ${order.allergens.join(", ")}`, 50, rowY + 16, { width: 260 });
    }

    // Total
    const totalsY = rowY + 60;
    doc
      .moveTo(320, totalsY)
      .lineTo(545, totalsY)
      .strokeColor("#dddddd")
      .stroke();
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Totaal", 320, totalsY + 10, { width: 140, align: "right" })
      .text(EUR.format(total), 460, totalsY + 10, { width: 85, align: "right" });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#888888")
      .text(BUSINESS.vatExemptionNotice, 50, totalsY + 10, { width: 250 });

    // Payment section
    const payY = totalsY + 70;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Betaling", 50, payY);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Bankoverschrijving naar IBAN ${BUSINESS.iban} (BIC ${BUSINESS.bic}),`, 50, payY + 20, { width: 320 })
      .text(`met gestructureerde mededeling ${paymentReference}, of contant bij afhaling.`, { width: 320 })
      .text("Scan de QR-code hiernaast om de overschrijving in je bankapp klaar te zetten.", { width: 320 });

    doc.image(qrPngBuffer, 400, payY + 15, { width: 130 });

    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(BUSINESS.invoiceFooterNote, 50, 760, { width: 495, align: "center" });

    doc.end();
  });
}
