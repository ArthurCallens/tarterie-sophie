import { logger, task } from "@trigger.dev/sdk/v3";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { OrdersWebhookPayload } from "../lib/types.js";
import { generateInvoicePdf } from "./generateInvoicePdf.js";
import { sendInvoiceEmail } from "./sendInvoiceEmail.js";

/**
 * The task exposed to the outside world. Two triggers:
 *  - a Postgres trigger on `orders` (see 0004_invoices.sql) whenever status
 *    becomes 'accepted' — the normal, automatic path.
 *  - the `resend-invoice` Edge Function, for a manual resend Sophie triggers
 *    from the dashboard (`forceResend: true`) — e.g. she accepted an order,
 *    the invoice bounced because the email was wrong, she corrected it on the
 *    order and now wants to force a fresh send.
 *
 * Chains: receive order → generate invoice PDF → send email.
 * If PDF generation fails, sendInvoiceEmail is never called (triggerAndWait
 * throws first). Email failures retry per sendInvoiceEmail's own retry config.
 */
export const generateInvoiceAndSend = task({
  id: "generate-invoice-and-send",
  run: async (payload: OrdersWebhookPayload) => {
    const { record, old_record, forceResend } = payload;

    if (!forceResend) {
      if (record.status !== "accepted" || old_record?.status === "accepted") {
        logger.log("Ignoring — not a fresh acceptance", { orderId: record.id, status: record.status });
        return { skipped: true as const };
      }

      const { data: existing } = await supabaseAdmin
        .from("invoices")
        .select("status")
        .eq("order_id", record.id)
        .maybeSingle();
      if (existing?.status === "sent") {
        logger.log("Invoice already sent for this order, skipping", { orderId: record.id });
        return { skipped: true as const };
      }
    }

    const pdfResult = await generateInvoicePdf.triggerAndWait({ orderId: record.id, forceRegenerate: forceResend });
    if (!pdfResult.ok) {
      throw new Error(`Factuur-PDF genereren mislukt voor bestelling ${record.id}: ${pdfResult.error}`);
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
