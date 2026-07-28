import { logger, task } from "@trigger.dev/sdk/v3";
import type { OrdersWebhookPayload } from "../lib/types.js";
import { generateInvoicePdf } from "./generateInvoicePdf.js";
import { sendInvoiceEmail } from "./sendInvoiceEmail.js";

/**
 * The task exposed to the outside world. Two triggers:
 *  - a Postgres trigger on `orders` (see 0004_invoices.sql) whenever status
 *    becomes 'accepted' — the normal, automatic path (fresh accept, or a
 *    restore from declined).
 *  - the `resend-invoice` Edge Function, for a manual (re)send Sophie
 *    triggers from the dashboard (`forceResend: true`).
 *
 * Whether a *new* invoice number gets issued is decided entirely inside
 * generateInvoicePdf, by comparing the order's live data against what the
 * active invoice was last generated from — never by which trigger fired.
 * That's what makes "the invoice always reflects the order's current data" a
 * structural guarantee rather than something each caller has to get right.
 *
 * Chains: receive order → ensure invoice is current → send email if needed.
 * If PDF generation fails, sendInvoiceEmail is never called (triggerAndWait
 * throws first). Email failures retry per sendInvoiceEmail's own retry config.
 */
export const generateInvoiceAndSend = task({
  id: "generate-invoice-and-send",
  run: async (payload: OrdersWebhookPayload) => {
    const { record, old_record, forceResend } = payload;

    if (!forceResend && (record.status !== "accepted" || old_record?.status === "accepted")) {
      logger.log("Ignoring — not a fresh acceptance", { orderId: record.id, status: record.status });
      return { skipped: true as const };
    }

    const pdfResult = await generateInvoicePdf.triggerAndWait({ orderId: record.id, forceResend });
    if (!pdfResult.ok) {
      throw new Error(`Factuur-PDF genereren mislukt voor bestelling ${record.id}: ${pdfResult.error}`);
    }

    if (pdfResult.output.alreadyCurrent) {
      logger.log("Invoice already current and sent, skipping email", { orderId: record.id });
      return { skipped: true as const };
    }

    const emailResult = await sendInvoiceEmail.triggerAndWait({
      orderId: record.id,
      invoiceId: pdfResult.output.invoiceId,
    });
    if (!emailResult.ok) {
      throw new Error(`Factuur e-mail versturen mislukt voor bestelling ${record.id}: ${emailResult.error}`);
    }

    logger.log("Invoice generated and sent", { orderId: record.id, invoiceNumber: pdfResult.output.invoiceNumber });
    return { skipped: false as const, invoiceNumber: pdfResult.output.invoiceNumber };
  },
});
