import PDFDocument from "pdfkit";
import { BUSINESS } from "../config/business.js";
import type { OrderItem, OrderRow } from "./types.js";

type RenderInvoicePdfInput = {
  order: OrderRow;
  invoiceNumber: string;
  paymentReference: string;
  invoiceDate: Date;
  qrPngBuffer: Buffer;
};

const EUR = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });
const DATE_FMT = new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });

const COL = {
  desc: 50,
  descW: 250,
  qty: 305,
  qtyW: 100,
  unit: 405,
  unitW: 65,
  total: 470,
  totalW: 75,
};
const ROW_GAP = 10;
const MIN_ROW_HEIGHT = 14;

function qtyLabel(item: OrderItem): string {
  if (item.category === "klassieker") return `${item.quantity} taart(en)`;
  if (item.category === "klein-gebak") return `${item.quantity} stuks`;
  return `${item.quantity} pers.`;
}

/**
 * Orders placed before structured line items shipped have an empty `items`
 * array — fall back to a single row built from the legacy flat fields so
 * old orders still render a sensible invoice.
 */
function resolveItems(order: OrderRow): OrderItem[] {
  if (order.items.length > 0) return order.items;
  const total = order.price ?? 0;
  return [
    {
      id: "legacy",
      category: "custom",
      label: order.flavor,
      quantity: order.servings,
      unitPrice: order.servings > 0 ? total / order.servings : total,
      lineTotal: total,
    },
  ];
}

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

    const items = resolveItems(order);
    const total = order.price ?? items.reduce((sum, item) => sum + item.lineTotal, 0);

    // Header — business info
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#000000").text(BUSINESS.name, 50, 50);
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

    // Invoice meta, top-right — fixed region, always exactly 3 short lines.
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

    // Client details — fixed start (header block above is a stable, known
    // length), but flows downward via doc.y from here on so nothing after
    // it can ever overlap regardless of how much client/item text there is.
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text("Klant", 50, 160);
    doc.fontSize(10).font("Helvetica").fillColor("#333333").text(order.customer_name, 50, 178).text(order.customer_email);
    if (order.customer_phone) doc.text(order.customer_phone);
    doc.text(`Gelegenheid: ${order.occasion}`);

    // Line items table — header
    const tableTop = doc.y + 20;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");
    doc.text("Omschrijving", COL.desc, tableTop, { width: COL.descW });
    doc.text("Aantal", COL.qty, tableTop, { width: COL.qtyW, align: "right" });
    doc.text("Stuksprijs", COL.unit, tableTop, { width: COL.unitW, align: "right" });
    doc.text("Bedrag", COL.total, tableTop, { width: COL.totalW, align: "right" });
    doc
      .moveTo(50, tableTop + 16)
      .lineTo(545, tableTop + 16)
      .strokeColor("#dddddd")
      .stroke();

    // Line items table — one row per item, each row's height measured from
    // its (possibly wrapping) description so the next row never overlaps it.
    doc.font("Helvetica").fillColor("#333333").fontSize(10);
    let y = tableTop + 24;
    for (const item of items) {
      const rowHeight = Math.max(doc.heightOfString(item.label, { width: COL.descW }), MIN_ROW_HEIGHT);
      doc.text(item.label, COL.desc, y, { width: COL.descW });
      doc.text(qtyLabel(item), COL.qty, y, { width: COL.qtyW, align: "right" });
      doc.text(EUR.format(item.unitPrice), COL.unit, y, { width: COL.unitW, align: "right" });
      doc.text(EUR.format(item.lineTotal), COL.total, y, { width: COL.totalW, align: "right" });
      y += rowHeight + ROW_GAP;
    }

    doc.moveTo(50, y).lineTo(545, y).strokeColor("#dddddd").stroke();
    y += 10;

    if (order.allergens.length > 0) {
      doc.fontSize(8).fillColor("#888888").text(`Allergenen: ${order.allergens.join(", ")}`, 50, y, { width: 495 });
      y = doc.y + 10;
    }

    // Total
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Totaal", COL.qty, y, { width: COL.unit + COL.unitW - COL.qty, align: "right" })
      .text(EUR.format(total), COL.total, y, { width: COL.totalW, align: "right" });
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#888888")
      .text(BUSINESS.vatExemptionNotice, 50, y, { width: 250 });
    y = Math.max(doc.y, y + 20) + 30;

    // Payment section
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000").text("Betaling", 50, y);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Bankoverschrijving naar IBAN ${BUSINESS.iban} (BIC ${BUSINESS.bic}),`, 50, y + 20, { width: 320 })
      .text(`met gestructureerde mededeling ${paymentReference}, of contant bij afhaling.`, { width: 320 })
      .text("Scan de QR-code hiernaast om de overschrijving in je bankapp klaar te zetten.", { width: 320 });

    doc.image(qrPngBuffer, 400, y + 15, { width: 130 });

    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(BUSINESS.invoiceFooterNote, 50, 760, { width: 495, align: "center" });

    doc.end();
  });
}
