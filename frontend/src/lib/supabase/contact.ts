import { supabase } from "./client";

export type ContactMessageInput = {
  name: string;
  email: string;
  /** Het bericht uit het contactformulier — weglaten bij een workshopinschrijving. */
  message?: string;
  /** Zet dit om een inschrijving voor een workshop door te sturen i.p.v. een vrije vraag. */
  workshopName?: string;
};

/**
 * Stuurt het contactformulier (/contact) of een workshopinschrijving
 * (/workshops) door naar Sophie via de `send-contact-message` Edge Function →
 * trigger.dev → Outlook. Gooit een fout als het versturen mislukt, zodat geen
 * van beide formulieren "verstuurd!" toont voor iets dat nooit is aangekomen.
 */
export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke("send-contact-message", { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
