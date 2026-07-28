import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { renderInvoicePdf } from "../lib/pdf.js";
import { buildEpcQrPayload, renderQrPng } from "../lib/sepaQr.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { buildStructuredCommunication, invoiceNumberToBase10 } from "../lib/structuredCommunication.js";
import type { InvoiceRow, OrderRow } from "../lib/types.js";

type GenerateInvoicePdfPayload = {
  orderId: string;
};

export const generateInvoicePdf = task({
  id: "generate-invoice-pdf",
  retry: { maxAttempts: 3, minTimeoutInMs: 1000, maxTimeoutInMs: 5000, factor: 2 },
  run: async ({ orderId }: GenerateInvoicePdfPayload) => {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    const order: OrderRow = orderData;
    if (order.status !== "accepted") {
      throw new Error(`Bestelling ${orderId} heeft status "${order.status}", verwacht "accepted".`);
    }

    // Idempotent: reuse the existing invoice if this order already has one.
    const { data: existingInvoiceData } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();
    const existingInvoice: InvoiceRow | null = existingInvoiceData;

    if (existingInvoice?.pdf_storage_path && existingInvoice.invoice_number) {
      logger.log("Invoice already generated, reusing it", { orderId, invoiceNumber: existingInvoice.invoice_number });
      return {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoice_number,
        pdfStoragePath: existingInvoice.pdf_storage_path,
        paymentReference:
          existingInvoice.payment_reference ??
          buildStructuredCommunication(invoiceNumberToBase10(existingInvoice.invoice_number)),
      };
    }

    const total = order.price ?? 0;

    const { data: invoiceNumberData, error: seqError } = await supabaseAdmin.rpc("next_invoice_number");
    if (seqError) throw new Error(`Kon factuurnummer niet genereren: ${seqError.message}`);
    const invoiceNumber = invoiceNumberData as string;
    const paymentReference = buildStructuredCommunication(invoiceNumberToBase10(invoiceNumber));

    const invoiceDate = new Date();
    const qrPayload = buildEpcQrPayload({
      name: BUSINESS.name,
      iban: BUSINESS.iban,
      bic: BUSINESS.bic,
      amount: total,
      remittanceInfo: paymentReference,
    });
    const qrPngBuffer = await renderQrPng(qrPayload);

    const pdfBuffer = await renderInvoicePdf({
      order,
      invoiceNumber,
      paymentReference,
      invoiceDate,
      qrPngBuffer,
    });

    const pdfStoragePath = `invoices/${order.id}/${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoices")
      .upload(pdfStoragePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`Kon PDF niet uploaden: ${uploadError.message}`);

    const { data: invoiceRowData, error: upsertError } = await supabaseAdmin
      .from("invoices")
      .upsert(
        {
          order_id: order.id,
          invoice_number: invoiceNumber,
          pdf_storage_path: pdfStoragePath,
          payment_reference: paymentReference,
          status: "pending",
        },
        { onConflict: "order_id" },
      )
      .select()
      .single();
    if (upsertError) throw new Error(`Kon factuur niet opslaan: ${upsertError.message}`);
    const invoiceRow: InvoiceRow = invoiceRowData;
    if (!invoiceRow.invoice_number || !invoiceRow.pdf_storage_path) {
      throw new Error(`Factuur ${invoiceRow.id} mist invoice_number of pdf_storage_path na opslaan.`);
    }

    logger.log("Invoice PDF generated", { orderId, invoiceNumber, paymentReference });

    return {
      invoiceId: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      pdfStoragePath: invoiceRow.pdf_storage_path,
      paymentReference,
    };
  },
});
