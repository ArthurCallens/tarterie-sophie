// Bridges Supabase's Database Webhook payload shape into trigger.dev's HTTP
// trigger endpoint shape (which expects the data wrapped as { payload: ... }).
// Same pattern as invoice-webhook/index.ts, just for a fresh order insert
// instead of an accepted-status update. Fires two independent tasks — the
// customer's "we got it" receipt and Sophie's "check your dashboard" nudge
// — so a failure/retry in one never blocks the other.
//
// Deploy with: supabase functions deploy order-confirmation-webhook
// Uses the same TRIGGER_SECRET_KEY secret already set for invoice-webhook.

const TASK_URLS = [
  "https://api.trigger.dev/api/v1/tasks/send-order-confirmation-email/trigger",
  "https://api.trigger.dev/api/v1/tasks/notify-admin-new-order/trigger",
];

Deno.serve(async (req: Request) => {
  const body = await req.json();

  // Defense in depth — the Postgres trigger already filters to INSERT only,
  // but double-check here too.
  if (body.table !== "orders" || body.type !== "INSERT" || !body.record?.id) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const triggerSecretKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!triggerSecretKey) {
    return new Response(JSON.stringify({ error: "TRIGGER_SECRET_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = await Promise.allSettled(
    TASK_URLS.map((url) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${triggerSecretKey}`,
        },
        body: JSON.stringify({ payload: { orderId: body.record.id } }),
      }).then(async (response) => {
        if (!response.ok) throw new Error(`${url} -> ${response.status}: ${await response.text()}`);
      }),
    ),
  );

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failures.length > 0) {
    return new Response(JSON.stringify({ error: failures.map((f) => String(f.reason)) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
