// One-off: disables the old Outlook connected account (arthur_callens@hotmail.com)
// after mail sending was moved to sophie.cardon@live.be. Disable rather than
// delete, so it's reversible if anything looks wrong.
//
// Run from backend/invoicing/ with COMPOSIO_API_KEY set:
//   node --env-file=.env scripts/disable-old-outlook-account.mjs

import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const OLD_ACCOUNT_ID = "ca_ORoNhhvcgVkO";

const result = await composio.connectedAccounts.disable(OLD_ACCOUNT_ID);
console.log(JSON.stringify(result, null, 2));
