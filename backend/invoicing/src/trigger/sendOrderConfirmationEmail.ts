import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { OrderRow } from "../lib/types.js";

type SendOrderConfirmationEmailPayload = {
  orderId: string;
};

/**
 * Mails the customer right after they submit an order — purely a "we got
 * it" receipt, not a confirmation that Sophie accepted it (that's the
 * invoice email, sent later once she reviews and prices it). Triggered by
 * the `order-confirmation-webhook` Edge Function, itself fired by a
 * Postgres `after insert on orders` trigger — see
 * 0013_order_confirmation_email.sql.
 */
export const sendOrderConfirmationEmail = task({
  id: "send-order-confirmation-email",
  retry: { maxAttempts: 5, minTimeoutInMs: 5000, maxTimeoutInMs: 60000, factor: 2, randomize: true },
  run: async ({ orderId }: SendOrderConfirmationEmailPayload) => {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    const order: OrderRow = orderData;

    const body = [
      `Beste ${order.customer_name},`,
      "",
      `Bedankt voor je bestelling bij ${BUSINESS.name}! We hebben ‘m goed ontvangen:`,
      "",
      `Taart(en): ${order.flavor}`,
      `Aantal personen: ${order.servings}`,
      `Gelegenheid: ${order.occasion}`,
      `Gewenste afhaaldatum: ${order.pickup_date}`,
      "",
      "Sophie neemt binnen de 3 dagen persoonlijk contact met je op via e-mail om je bestelling te bevestigen en een afhaalmoment af te spreken.",
      "",
      "Tot binnenkort!",
      BUSINESS.ownerName,
    ].join("\n");

    await sendOutlookWithAttachment({
      to: order.customer_email,
      subject: `We ontvingen je bestelling bij ${BUSINESS.name}`,
      body,
    });

    logger.log("Order confirmation email sent", { orderId });
    return { sent: true as const };
  },
});
