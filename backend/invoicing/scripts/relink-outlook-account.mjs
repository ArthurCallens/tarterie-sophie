// One-off script: creates a new Outlook connected account for the
// "tarterie-sophie" Composio user, reusing whichever auth config the
// current connection uses, then waits for the OAuth flow to complete and
// prints the new connected account ID to put into
// COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID (trigger.dev dashboard -> Project
// Settings -> Environment Variables).
//
// Run from backend/invoicing/ with COMPOSIO_API_KEY set, e.g.:
//   node --env-file=.env scripts/relink-outlook-account.mjs
// (put COMPOSIO_API_KEY=... in backend/invoicing/.env first, or export it
// in your shell — the value is the same one set in trigger.dev's env vars)

import { Composio } from "@composio/core";

const COMPOSIO_USER_ID = "tarterie-sophie";

const apiKey = process.env.COMPOSIO_API_KEY;
if (!apiKey) {
  console.error("Set COMPOSIO_API_KEY first (same value as in trigger.dev's env vars).");
  process.exit(1);
}

const composio = new Composio({ apiKey });

const existing = await composio.connectedAccounts.list({
  userIds: [COMPOSIO_USER_ID],
  toolkitSlugs: ["outlook"],
});

if (existing.items.length === 0) {
  console.error(
    `No existing Outlook connected account found for user "${COMPOSIO_USER_ID}" in this Composio project. ` +
      "Double-check you're logged into the project that owns the working COMPOSIO_API_KEY."
  );
  process.exit(1);
}

const current = existing.items[0];
console.log(`Current connected account: ${current.id} (status: ${current.status})`);
console.log(`Reusing auth config: ${current.authConfig.id}`);

const connectionRequest = await composio.connectedAccounts.link(
  COMPOSIO_USER_ID,
  current.authConfig.id,
  { allowMultiple: true }
);

console.log("\nOpen this URL and sign in with the Microsoft account you want to send from");
console.log("(e.g. sophie.cardon@live.be, if it's an Outlook/Microsoft 365 mailbox):\n");
console.log(connectionRequest.redirectUrl);
console.log("\nWaiting for the connection to complete...");

const connected = await connectionRequest.waitForConnection(180_000);

console.log(`\nConnected! New connected account ID: ${connected.id}`);
console.log(
  "\nNext: set COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID to this ID in the trigger.dev dashboard " +
    "(Project Settings -> Environment Variables, prod env), and in backend/invoicing/.env if you run trigger.dev dev locally."
);
console.log(
  `\nOnce confirmed working, you can retire the old one with: composio.connectedAccounts.delete("${current.id}")`
);
