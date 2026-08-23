// One-off: sends a test email through the currently-configured Composio
// Outlook connected account, to confirm COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID
// is actually pointing at the right mailbox.
//
// Run from backend/invoicing/ with COMPOSIO_API_KEY and
// COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID set:
//   node --env-file=.env scripts/test-send-email.mjs <recipient-email>

import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const COMPOSIO_USER_ID = "tarterie-sophie";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node --env-file=.env scripts/test-send-email.mjs <recipient-email>");
  process.exit(1);
}

const connectedAccountId = process.env.COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID;
console.log(`Sending via connected account: ${connectedAccountId}`);

const result = await composio.tools.execute("OUTLOOK_SEND_EMAIL", {
  userId: COMPOSIO_USER_ID,
  connectedAccountId,
  dangerouslySkipVersionCheck: true,
  arguments: {
    to,
    subject: "Tarterie Sophie - test email (account relink)",
    body: "This is a test to confirm mail now sends from sophie.cardon@live.be.",
    is_html: false,
  },
});

console.log("Result:", JSON.stringify(result, null, 2));
