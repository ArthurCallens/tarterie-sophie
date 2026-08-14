import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { OrderRow } from "../lib/types.js";

type NotifyAdminNewOrderPayload = {
  orderId: string;
};

/**
 * Internal "check your dashboard" nudge — fired alongside
 * sendOrderConfirmationEmail whenever a customer submits a new order, so
 * Sophie (currently BUSINESS.adminNotificationEmail, while the site is
 * being built out) doesn't have to remember to poll /admin/orders. Same
 * trigger chain: order-confirmation-webhook Edge Function, itself fired by
 * the Postgres `after insert on orders` trigger — see
 * 0013_order_confirmation_email.sql.
 */
export const notifyAdminNewOrder = task({
  id: "notify-admin-new-order",
  retry: { maxAttempts: 5, minTimeoutInMs: 5000, maxTimeoutInMs: 60000, factor: 2, randomize: true },
  run: async ({ orderId }: NotifyAdminNewOrderPayload) => {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    const order: OrderRow = orderData;

    const body = [
      `Er is een nieuwe bestelling binnengekomen bij ${BUSINESS.name}.`,
      "",
      `Klant: ${order.customer_name}`,
      `Taart(en): ${order.flavor}`,
      `Gelegenheid: ${order.occasion}`,
      `Gewenste afhaaldatum: ${order.pickup_date}`,
      order.price !== null ? `Geschatte prijs: ${order.price} EUR` : null,
      "",
      "Check het dashboard om ze te bekijken en te accepteren of te weigeren.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    await sendOutlookWithAttachment({
      to: BUSINESS.adminNotificationEmail,
      subject: `Nieuwe bestelling van ${order.customer_name} — check je dashboard`,
      body,
    });

    logger.log("Admin new-order notification sent", { orderId });
    return { sent: true as const };
  },
});
