// Bridges Supabase's Database Webhook payload shape into trigger.dev's HTTP
// trigger endpoint shape (which expects the data wrapped as { payload: ... }).
// Also holds the trigger.dev secret key as a Supabase secret instead of
// plaintext inside a SQL trigger definition.
//
// Deploy with: supabase functions deploy invoice-webhook
// Set its secret with: supabase secrets set TRIGGER_SECRET_KEY=<from trigger.dev dashboard>

const TRIGGER_TASK_URL = "https://api.trigger.dev/api/v1/tasks/generate-invoice-and-send/trigger";

Deno.serve(async (req: Request) => {
  const body = await req.json();

  // Defense in depth — the Postgres trigger already filters to
  // status → 'accepted', but double-check here too.
  if (body.table !== "orders" || body.record?.status !== "accepted" || body.old_record?.status === "accepted") {
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

  const response = await fetch(TRIGGER_TASK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${triggerSecretKey}`,
    },
    body: JSON.stringify({ payload: body }),
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(JSON.stringify({ error: text }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
