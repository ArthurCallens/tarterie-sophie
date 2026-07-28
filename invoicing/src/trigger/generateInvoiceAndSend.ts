import { logger, task } from "@trigger.dev/sdk/v3";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { OrdersWebhookPayload } from "../lib/types.js";
import { generateInvoicePdf } from "./generateInvoicePdf.js";
import { sendInvoiceEmail } from "./sendInvoiceEmail.js";

/**
 * The task exposed to the outside world — triggered by a Postgres trigger on
 * the `orders` table (see supabase/migrations/0004_invoices.sql in
 * tarterie_sophie) whenever an order's status becomes 'accepted'.
 *
 * Chains: receive order → generate invoice PDF → send email.
 * If PDF generation fails, sendInvoiceEmail is never called (triggerAndWait
 * throws first). Email failures retry per sendInvoiceEmail's own retry config.
 */
export const generateInvoiceAndSend = task({
  id: "generate-invoice-and-send",
  run: async (payload: OrdersWebhookPayload) => {
    const { record, old_record } = payload;

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

    const pdfResult = await generateInvoicePdf.triggerAndWait({ orderId: record.id });
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
