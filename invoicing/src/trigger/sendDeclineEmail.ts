import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { OrderRow } from "../lib/types.js";

type SendDeclineEmailPayload = {
  orderId: string;
};

/**
 * Mails a declined order's client with the reason Sophie wrote, triggered
 * manually from the dashboard via the `send-decline-email` Edge Function
 * (never automatically — the reason is freeform text entered at the moment
 * of declining, there's nothing to react to via a DB trigger).
 */
export const sendDeclineEmail = task({
  id: "send-decline-email",
  retry: { maxAttempts: 5, minTimeoutInMs: 5000, maxTimeoutInMs: 60000, factor: 2, randomize: true },
  run: async ({ orderId }: SendDeclineEmailPayload) => {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    const order: OrderRow = orderData;

    if (order.status !== "declined") {
      throw new Error(`Bestelling ${orderId} heeft status "${order.status}", verwacht "declined".`);
    }
    if (!order.decline_notify || !order.decline_reason) {
      logger.log("Decline email not applicable (no notify or no reason)", { orderId });
      return { sent: false as const };
    }

    const body = [
      `Beste ${order.customer_name},`,
      "",
      `Helaas kunnen we je bestelling bij ${BUSINESS.name} niet uitvoeren.`,
      "",
      order.decline_reason,
      "",
      "Excuses voor het ongemak. Heb je vragen, antwoord gerust op deze e-mail.",
      "",
      BUSINESS.ownerName,
    ].join("\n");

    await sendOutlookWithAttachment({
      to: order.customer_email,
      subject: `Je bestelling bij ${BUSINESS.name}`,
      body,
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ decline_email_status: "sent" })
      .eq("id", orderId);
    if (updateError) throw new Error(`Kon status niet bijwerken: ${updateError.message}`);

    logger.log("Decline email sent", { orderId });
    return { sent: true as const };
  },
  onFailure: async ({ payload: { orderId } }: { payload: SendDeclineEmailPayload }) => {
    await supabaseAdmin.from("orders").update({ decline_email_status: "failed" }).eq("id", orderId);
  },
});
