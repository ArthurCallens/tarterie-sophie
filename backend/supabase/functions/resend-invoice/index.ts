// Lets Sophie manually (re)send an accepted order's invoice from the
// dashboard — e.g. she accepted an order, the invoice bounced because the
// email was wrong, she corrected it, and now wants to force a fresh send; or
// the price/details changed after the invoice was already sent, in which
// case generate-invoice-and-send automatically supersedes the old invoice
// and issues a brand-new invoice number (see generateInvoicePdf.ts).
// Unlike the automatic Postgres-webhook path (invoice-webhook), this always
// sends, bypassing the "already sent, nothing changed" idempotency guard in
// generate-invoice-and-send.
//
// Deploy with: supabase functions deploy resend-invoice
// (Reuses the TRIGGER_SECRET_KEY secret already set for invoice-webhook —
// secrets are shared across all Edge Functions in a Supabase project.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the runtime,
// no need to set them manually.)

const TRIGGER_TASK_URL = "https://api.trigger.dev/api/v1/tasks/generate-invoice-and-send/trigger";

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

  // Edge Function's default JWT verification already confirms the token is a
  // valid Supabase-issued JWT; this additionally restricts it to logged-in
  // dashboard users (role "authenticated"), not just anyone holding the
  // public anon key.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwtRole(token) !== "authenticated") {
    return json({ error: "Alleen ingelogde gebruikers kunnen een factuur opnieuw versturen." }, 403);
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
  if (order.status !== "accepted") {
    return json({ error: `Bestelling heeft status "${order.status}", niet "accepted".` }, 400);
  }

  const response = await fetch(TRIGGER_TASK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${triggerSecretKey}`,
    },
    body: JSON.stringify({
      payload: {
        type: "MANUAL_RESEND",
        table: "orders",
        schema: "public",
        record: order,
        forceResend: true,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return json({ error: text }, 502);
  }

  return json({ ok: true });
});
