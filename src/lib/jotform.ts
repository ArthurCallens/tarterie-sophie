const JOTFORM_FORM_ID = "262074600283047";
const JOTFORM_ACTION = `https://submit.jotform.com/submit/${JOTFORM_FORM_ID}`;

// Field IDs read off Tarterie Sophie's own Jotform form (form.jotform.com/262074600283047).
export const JOTFORM_FIELDS = {
  naam: "q2_q2_textbox0",
  email: "q3_q3_email1",
  formulier: "q4_q4_textbox2",
  opmerking: "q5_q5_textbox3",
} as const;

export async function submitToJotform(fields: Record<string, string>) {
  const fd = new FormData();
  fd.append("formID", JOTFORM_FORM_ID);
  // Jotform's anti-spam token (visible in the form's own source as `formID-formID`) and
  // honeypot field — required for a submission to be accepted rather than silently dropped.
  fd.append("simple_spc", `${JOTFORM_FORM_ID}-${JOTFORM_FORM_ID}`);
  fd.append("website", "");

  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }

  // Jotform doesn't send CORS headers back, so the response is opaque — we can't read
  // success/failure from it. "no-cors" still lets the POST reach their server.
  await fetch(JOTFORM_ACTION, {
    method: "POST",
    mode: "no-cors",
    body: fd,
  });
}
