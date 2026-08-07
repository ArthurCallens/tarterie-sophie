import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// The Composio "user id" Sophie's Outlook account was connected under
// (composio.connectedAccounts.link("tarterie-sophie", authConfigId)) — this
// is a solo-business project with a single connected account, so it's a
// fixed constant rather than something per-request.
const COMPOSIO_USER_ID = "tarterie-sophie";

type SendOutlookEmailInput = {
  to: string;
  subject: string;
  body: string;
  /** Omit for a plain-text email with no attachment (e.g. a decline notice). */
  pdfBuffer?: Buffer;
  filename?: string;
};

/**
 * Sends an email — optionally with a PDF attachment — through Sophie's
 * Outlook/Microsoft account, connected once via Composio
 * (COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID identifies that connection).
 *
 * Uses the file-upload + tools.execute flow documented by @composio/core: file
 * arguments must be staged via `composio.files.upload()` first, then passed as
 * the returned { name, mimetype, s3key } descriptor to the tool call.
 *
 * The tool slug and argument names below (`OUTLOOK_SEND_EMAIL`, `to`, `subject`,
 * `body`, `is_html`, `attachment`) were verified directly against the live
 * schema the SDK itself queries — GET /api/v3.1/tools/OUTLOOK_SEND_EMAIL (the
 * @composio/core SDK calls the v3.1 API internally; note this differs from the
 * v3 API's tool listing, which shows a stale `OUTLOOK_OUTLOOK_SEND_EMAIL` slug
 * with a `to_email` field that 404s when actually executed).
 */
export async function sendOutlookWithAttachment({ to, subject, body, pdfBuffer, filename }: SendOutlookEmailInput) {
  let uploadedAttachment: Awaited<ReturnType<typeof composio.files.upload>> | undefined;
  if (pdfBuffer && filename) {
    const file = new File([new Uint8Array(pdfBuffer)], filename, { type: "application/pdf" });
    uploadedAttachment = await composio.files.upload({
      file,
      toolSlug: "OUTLOOK_SEND_EMAIL",
      toolkitSlug: "outlook",
    });
  }

  await composio.tools.execute("OUTLOOK_SEND_EMAIL", {
    userId: COMPOSIO_USER_ID,
    connectedAccountId: process.env.COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID,
    dangerouslySkipVersionCheck: true,
    arguments: {
      to,
      subject,
      body,
      is_html: false,
      ...(uploadedAttachment ? { attachment: uploadedAttachment } : {}),
    },
  });
}
