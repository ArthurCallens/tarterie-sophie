// Lets Sophie send the decline-reason email for an order she just rejected,
// from the dashboard. Unlike invoicing, there's no automatic Postgres-trigger
// path here — the reason is freeform text entered at the moment of declining
// (see DeclineOrderModal.tsx), so the dashboard always calls this directly
// right after writing decline_reason/decline_notify onto the order.
//
// Deploy with: supabase functions deploy send-decline-email
// (Reuses the TRIGGER_SECRET_KEY secret already set for invoice-webhook —
// secrets are shared across all Edge Functions in a Supabase project.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the runtime,
// no need to set them manually.)

const TRIGGER_TASK_URL = "https://api.trigger.dev/api/v1/tasks/send-decline-email/trigger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** Reads the `role` claim (anon | authenticated) from an already-verified Supabase JWT. */
function jwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwtRole(token) !== "authenticated") {
    return json({ error: "Alleen ingelogde gebruikers kunnen een weigeringsmail versturen." }, 403);
  }

  const { orderId } = await req.json();
  if (!orderId || typeof orderId !== "string") {
    return json({ error: "orderId is verplicht" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const triggerSecretKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!supabaseUrl || !serviceRoleKey || !triggerSecretKey) {
    return json({ error: "Server niet correct geconfigureerd." }, 500);
  }

  const orderRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const [order] = await orderRes.json();
  if (!order) return json({ error: "Bestelling niet gevonden." }, 404);
  if (order.status !== "declined") {
    return json({ error: `Bestelling heeft status "${order.status}", niet "declined".` }, 400);
  }
  if (!order.decline_notify || !order.decline_reason) {
    return json({ error: "Deze bestelling heeft geen reden om te mailen." }, 400);
  }

  const response = await fetch(TRIGGER_TASK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${triggerSecretKey}`,
    },
    body: JSON.stringify({ payload: { orderId } }),
  });

  if (!response.ok) {
    const text = await response.text();
    return json({ error: text }, 502);
  }

  return json({ ok: true });
});
