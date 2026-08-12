import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { renderEmailTemplate } from "../lib/emailTemplate.js";
import type { OrderRow } from "../lib/types.js";

type SendDeclineEmailPayload = {
  orderId: string;
};

type DeclineEmailContent = {
  subject: string;
  body: string;
};

/** Used until Sophie saves her own template on /admin/site/decline-email — same copy the code sent before this became editable. */
const DEFAULT_DECLINE_EMAIL: DeclineEmailContent = {
  subject: "Je bestelling bij {{bedrijfsnaam}}",
  body: [
    "Beste {{naam}},",
    "",
    "Helaas kunnen we je bestelling bij {{bedrijfsnaam}} niet uitvoeren.",
    "",
    "{{reden}}",
    "",
    "Excuses voor het ongemak. Heb je vragen, antwoord gerust op deze e-mail.",
    "",
    "{{eigenaar}}",
  ].join("\n"),
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

    const { data: templateRow } = await supabaseAdmin
      .from("page_content")
      .select("content")
      .eq("page_key", "decline_email")
      .maybeSingle();
    const template = (templateRow?.content as DeclineEmailContent | undefined) ?? DEFAULT_DECLINE_EMAIL;

    const vars = {
      naam: order.customer_name,
      reden: order.decline_reason ?? "",
      bedrijfsnaam: BUSINESS.name,
      eigenaar: BUSINESS.ownerName,
    };

    await sendOutlookWithAttachment({
      to: order.customer_email,
      subject: renderEmailTemplate(template.subject, vars),
      body: renderEmailTemplate(template.body, vars),
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
