import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { InvoiceRow, OrderRow } from "../lib/types.js";

type SendInvoiceEmailPayload = {
  orderId: string;
  invoiceId: string;
};

export const sendInvoiceEmail = task({
  id: "send-invoice-email",
  retry: { maxAttempts: 5, minTimeoutInMs: 5000, maxTimeoutInMs: 60000, factor: 2, randomize: true },
  run: async ({ orderId, invoiceId }: SendInvoiceEmailPayload) => {
    const [{ data: orderData, error: orderError }, { data: invoiceData, error: invoiceError }] = await Promise.all([
      supabaseAdmin.from("orders").select("*").eq("id", orderId).single(),
      supabaseAdmin.from("invoices").select("*").eq("id", invoiceId).single(),
    ]);
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    if (invoiceError) throw new Error(`Kon factuur niet ophalen: ${invoiceError.message}`);
    const order: OrderRow = orderData;
    const invoice: InvoiceRow = invoiceData;
    if (!invoice.pdf_storage_path || !invoice.invoice_number) {
      throw new Error(`Factuur ${invoiceId} heeft nog geen PDF.`);
    }

    const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
      .from("invoices")
      .download(invoice.pdf_storage_path);
    if (downloadError) throw new Error(`Kon factuur-PDF niet downloaden: ${downloadError.message}`);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    let previousInvoiceNumber: string | null = null;
    if (invoice.replaces_invoice_id) {
      const { data: previousInvoice } = await supabaseAdmin
        .from("invoices")
        .select("invoice_number")
        .eq("id", invoice.replaces_invoice_id)
        .maybeSingle();
      previousInvoiceNumber = previousInvoice?.invoice_number ?? null;
    }

    // Een factuur vertrekt alleen nadat Sophie de bestelling aanvaard heeft —
    // zeg dat er expliciet bij, anders komt een factuur uit het niets binnen
    // zonder dat de klant ooit een "ja" gelezen heeft.
    const body = [
      `Beste ${order.customer_name},`,
      "",
      previousInvoiceNumber
        ? `In bijlage vind je een herziene factuur (${invoice.invoice_number}) voor je bestelling bij ${BUSINESS.name}. Deze factuur vervangt de eerder verstuurde factuur ${previousInvoiceNumber}, die niet langer geldig is.`
        : `Goed nieuws: je bestelling bij ${BUSINESS.name} is aanvaard en staat ingepland voor ${order.pickup_date}. In bijlage vind je de factuur (${invoice.invoice_number}).`,
      "",
      `Je kan betalen via overschrijving (zie factuur voor IBAN en QR-code) of contant bij afhaling op ${order.pickup_date}.`,
      "",
      "Tot binnenkort!",
      BUSINESS.ownerName,
    ].join("\n");

    await sendOutlookWithAttachment({
      to: order.customer_email,
      subject: previousInvoiceNumber
        ? `Herziene factuur ${invoice.invoice_number} (vervangt ${previousInvoiceNumber}) — ${BUSINESS.name}`
        : `Je bestelling is aanvaard — factuur ${invoice.invoice_number} — ${BUSINESS.name}`,
      body,
      pdfBuffer,
      filename: `${invoice.invoice_number}.pdf`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);
    if (updateError) throw new Error(`Kon factuurstatus niet bijwerken: ${updateError.message}`);

    logger.log("Invoice email sent", { orderId, invoiceNumber: invoice.invoice_number });
    return { sent: true };
  },
  onFailure: async ({ payload: { invoiceId } }: { payload: SendInvoiceEmailPayload }) => {
    // All retries exhausted — mark the invoice so Sophie can see it needs manual follow-up.
    await supabaseAdmin.from("invoices").update({ status: "failed" }).eq("id", invoiceId);
  },
});
