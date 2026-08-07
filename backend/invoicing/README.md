# invoicing

Trigger.dev v4 project (lives at `tarterie_sophie/backend/invoicing/`, deployed independently from the Vite app in `frontend/`): generates a PDF invoice and emails it to the client whenever an order is marked "accepted" in the Tarterie Sophie admin dashboard.

## How it's wired up

```
orders table (Postgres, in the tarterie_sophie Supabase project)
  └─ AFTER UPDATE trigger, only when status → 'accepted'
       └─ pg_net (net.http_post) calls the `invoice-webhook` Supabase Edge Function
            (../supabase/functions/invoice-webhook)
            └─ re-shapes the payload and POSTs to trigger.dev's HTTP trigger endpoint
                 └─ generateInvoiceAndSend (this project, src/trigger/generateInvoiceAndSend.ts)
                      ├─ generateInvoicePdf  (PDF + SEPA/EPC QR + structured payment reference,
                      │                       uploads to Storage, invoices row)
                      └─ sendInvoiceEmail    (Composio Outlook send with the PDF attached)
```

## Status

Live and verified end-to-end (trigger.dev project `proj_bpviemutpfjolozquhby`, "tarterie sophie"):
- Migrations `0004_invoices.sql` / `0005_order_phone.sql` / `0006_invoice_payment.sql` applied.
- `invoice-webhook` Edge Function deployed, `TRIGGER_SECRET_KEY` set as its secret.
- Env vars set in the `prod` environment: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `COMPOSIO_API_KEY`, `COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID`.
- Sophie's Outlook account connected via Composio (`connectedAccountId: ca_ORoNhhvcgVkO`).
- Real business details filled into `src/config/business.ts`.
- Full pipeline tested repeatedly: order accepted → PDF generated with a Belgian structured payment reference → emailed via Outlook → invoice marked `sent`, and the dashboard's "Al betaald" checkbox correctly toggles `invoices.paid`.

## CLI version — important

This project uses `@trigger.dev/sdk` **v4** (pinned exactly, no caret, in `package.json` — trigger.dev's deploy check compares the literal semver range string against the CLI version and rejects ranges). Always run the CLI as `npx trigger.dev@latest` from inside this `invoicing/` folder; it will match the pinned SDK version automatically. (Earlier in this project's history it briefly ran on SDK v3.3.17 — that's no longer the case; v3 CLI deploys are fully retired server-side.)

## Setup reference (already done once, kept here for redeploys)

1. **Business details** — `src/config/business.ts` (name, address, IBAN, BIC, contact info, VAT-exemption notice). Redeploy after any edit here — trigger.dev bundles the code at deploy time, it does **not** pick up local file changes automatically.
2. **Supabase migrations** — apply any new `../supabase/migrations/*.sql` file via the Supabase SQL editor or `supabase db push` (see the CLI commands used throughout this project's history for the exact linking steps if starting fresh).
3. **Edge Function bridge** — `../supabase/functions/invoice-webhook`, deployed via `supabase functions deploy invoice-webhook`, with its `TRIGGER_SECRET_KEY` secret set via `supabase secrets set`.
4. **Webhook trigger** — the `orders_accepted_invoice_webhook` Postgres trigger (in `0004_invoices.sql`) points at the Edge Function URL with the project's anon key in its Authorization header (not sensitive — same key already shipped in the frontend bundle).
5. **Composio Outlook connection** — done once via `composio.authConfigs.create("outlook")` + `composio.connectedAccounts.link(userId, authConfigId)`, then visiting the returned redirect URL to authorize. The `userId` used was `"tarterie-sophie"` (hardcoded in `src/lib/composio.ts` — this is a solo-business project with one connected account).
6. **Env vars** — set in the trigger.dev dashboard (Project Settings → Environment Variables → prod), or via `POST /api/v1/projects/{projectRef}/envvars/prod/import` with a personal access token.
7. **Install and deploy:**
   ```bash
   cd invoicing
   npm install
   npx trigger.dev@latest login
   npx trigger.dev@latest deploy
   ```
8. **Test** — accept a real (or throwaway) order from `/admin/orders`, watch the run in the trigger.dev dashboard, confirm an `invoices` row appears with a `payment_reference` in `+++abc/defg/hijkl+++` format, a PDF lands in the `invoices` Storage bucket, the email arrives, and the "Al betaald" checkbox on the order's card in `/admin/orders` persists when toggled.

## Notes / things worth knowing

- **Composio SDK**: `@composio/core` (current package — `composio-core` is deprecated, don't reinstall it).
- **Outlook send action**: `OUTLOOK_SEND_EMAIL` (not `OUTLOOK_OUTLOOK_SEND_EMAIL` — that's a stale slug shown by Composio's older `/api/v3` tool listing; the SDK actually calls `/api/v3.1`, where the correct slug and recipient field (`to`, not `to_email`) live). Verified directly against the live schema, not guessed.
- **`userId` + `connectedAccountId` both required** when calling `composio.tools.execute()` for a connected-account action — Composio's error message ("User ID is required with connected account") makes this easy to miss.
- **pdfkit in a bundled deploy**: pdfkit reads its standard-font `.afm` metrics from `<bundle dir>/data/*.afm` via `__dirname` at runtime. The bundler doesn't copy non-JS assets by default, so `./data/` here is a checked-in copy of `node_modules/pdfkit/js/data`, wired in via `trigger.config.ts`'s `additionalFiles({ files: ["data/**"] })` build extension.
- **`runtime: "node-22"`** in `trigger.config.ts` — `@supabase/supabase-js` needs native `WebSocket` just to construct a client (even though this project never uses realtime features).
- **Structured payment reference**: Belgian "gestructureerde mededeling" (OGM), format `+++abc/defg/hijkl+++`, derived from the invoice number's year+sequence digits (`src/lib/structuredCommunication.ts`) — separate from the human-readable `invoice_number` (which is also used in the Storage path, so it was kept stable rather than reformatted).
- The `orders` table has one line item per order (one cake, one price) — `pdf.ts` renders a single line item. If orders ever grow multiple line items, `renderInvoicePdf` is the one place to extend.
- Invoice numbers are permanent once issued — retries reuse the same invoice via the `order_id` unique constraint rather than burning a new number.
