// Takes the public site's two visitor-facing forms — "Stuur een berichtje"
// (/contact) and the workshop signup (/workshops) — and fires the
// `send-contact-message` trigger.dev task, which mails them to Sophie. Before
// this existed both forms only *looked* like they sent something: they flipped
// straight to the thank-you state without any network call at all, so every
// question and every signup a visitor ever typed was silently thrown away.
//
// A workshop signup carries `workshopName` and no `message`; a contact
// question carries `message` and no `workshopName`. Everything else is shared,
// hence one function rather than two near-identical ones.
//
// Unlike send-decline-email this one is deliberately reachable by anon: the
// whole point is that a visitor who isn't logged in can use it. What keeps it
// from being an open relay is that the recipient is fixed (hardcoded in the
// trigger.dev task, never taken from the request) and every field is length-
// capped here, so the worst a bad actor gets is a capped-size note into
// Sophie's own inbox.
//
// Deploy with: supabase functions deploy send-contact-message
// (Reuses the TRIGGER_SECRET_KEY secret already set for invoice-webhook.)

const TRIGGER_TASK_URL = "https://api.trigger.dev/api/v1/tasks/send-contact-message/trigger";

const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 5000;
const MAX_WORKSHOP_NAME = 200;

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

/** Trims, rejects empties, and caps the length — one helper for all three fields. */
function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > max) return null;
  return trimmed;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Ongeldige aanvraag." }, 400);
  }
  const {
    name: rawName,
    email: rawEmail,
    message: rawMessage,
    workshopName: rawWorkshopName,
  } = (payload ?? {}) as Record<string, unknown>;

  const name = clean(rawName, MAX_NAME);
  const email = clean(rawEmail, MAX_EMAIL);
  const message = clean(rawMessage, MAX_MESSAGE);
  const workshopName = clean(rawWorkshopName, MAX_WORKSHOP_NAME);
  if (!name || !email) {
    return json({ error: "Naam en e-mailadres zijn verplicht." }, 400);
  }
  // Een inschrijving vraagt geen bericht (alleen naam + e-mail), een vrije
  // vraag wél — anders zou een leeg contactformulier als geldig doorgaan.
  if (!workshopName && !message) {
    return json({ error: "Een bericht is verplicht." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Dat e-mailadres ziet er niet geldig uit." }, 400);
  }

  const triggerSecretKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!triggerSecretKey) {
    return json({ error: "Server niet correct geconfigureerd." }, 500);
  }

  const response = await fetch(TRIGGER_TASK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${triggerSecretKey}`,
    },
    body: JSON.stringify({
      payload: {
        name,
        email,
        ...(message ? { message } : {}),
        ...(workshopName ? { workshopName } : {}),
      },
    }),
  });

  if (!response.ok) {
    return json({ error: await response.text() }, 502);
  }

  return json({ ok: true });
});
