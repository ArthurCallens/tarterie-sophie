import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { sendOutlookWithAttachment } from "../lib/composio.js";

type SendContactMessagePayload = {
  name: string;
  email: string;
  /** Het bericht uit het contactformulier. Leeg bij een workshopinschrijving. */
  message?: string;
  /** Gezet als dit een inschrijving is voor een workshop, i.p.v. een vrije vraag. */
  workshopName?: string;
};

/**
 * Mails Sophie wat een bezoeker op de site heeft ingevuld — ofwel het
 * "Stuur een berichtje"-formulier op /contact, ofwel een inschrijving op een
 * workshop. Getriggerd door de `send-contact-message` Edge Function, die de
 * publieke site rechtstreeks aanroept.
 *
 * Beide gaan door dezelfde taak omdat het resultaat identiek is: één mail naar
 * Sophie's inbox, zonder rij in de database. Een vraag of een inschrijving is
 * geen bestelling — er valt niets op te volgen in het dashboard, dus er valt
 * ook niets te bewaren. Alleen het onderwerp en de opbouw van de mail
 * verschillen, zodat ze in haar inbox meteen ziet welke van de twee het is.
 *
 * Het adres van de bezoeker staat in de body en niet als afzender: de mail
 * vertrekt via Sophie's eigen Outlook-account (Composio), dus een vervalste
 * From zou alleen maar in de spam belanden. Antwoorden betekent dat adres
 * kopiëren, wat volstaat voor het handvol berichten dat hier langskomt.
 */
export const sendContactMessage = task({
  id: "send-contact-message",
  retry: { maxAttempts: 5, minTimeoutInMs: 5000, maxTimeoutInMs: 60000, factor: 2, randomize: true },
  run: async ({ name, email, message, workshopName }: SendContactMessagePayload) => {
    const intro = workshopName
      ? `${name} heeft zich via de site ingeschreven voor de workshop "${workshopName}".`
      : `Er is een nieuw bericht binnengekomen via het contactformulier op de site van ${BUSINESS.name}.`;

    const body = [
      intro,
      "",
      `Naam: ${name}`,
      `E-mail: ${email}`,
      ...(message ? ["", "Bericht:", message] : []),
      "",
      workshopName
        ? `Bevestig haar/zijn plekje door een mail te sturen naar ${email}.`
        : `Antwoorden doe je door een mail te sturen naar ${email}.`,
    ].join("\n");

    await sendOutlookWithAttachment({
      to: BUSINESS.adminNotificationEmail,
      subject: workshopName
        ? `Inschrijving workshop "${workshopName}" — ${name}`
        : `Nieuw bericht via de site — ${name}`,
      body,
    });

    logger.log("Contact message forwarded", { email, workshopName: workshopName ?? null });
    return { sent: true as const };
  },
});
