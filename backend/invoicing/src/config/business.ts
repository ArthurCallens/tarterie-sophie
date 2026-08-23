/** Fill these in with Sophie's real business details before deploying. */
export const BUSINESS = {
  name: "Tarterie Sophie",
  ownerName: "Sophie Cardon",
  address: {
    street: "Sint-Pietersaalststraat 19",
    postalCode: "9000",
    city: "Gent",
    country: "België",
  },
  email: "sophie.cardon@live.be",
  phone: "+32 474 57 73 27",

  // Where the internal notifications land: a new order came in, someone asked
  // a question, someone signed up for a workshop. Sophie's own inbox — these
  // are hers to act on. Note this is the same mailbox the site sends *from*
  // (connected via Composio), so these arrive as mail from herself.
  adminNotificationEmail: "sophie.cardon@live.be",
  vatNumber: null as string | null, // e.g. "BE0123456789" if she ever registers for VAT
  vatExemptionNotice: "Vrijgesteld van btw, art. 56bis W.BTW (vrijstellingsregeling kleine ondernemingen).",

  // Bank details for the "pay by transfer" section + SEPA/EPC QR code.
  iban: "BE81 3200 8373 5524",
  // Bewust leeg. Voor een Belgische IBAN is de BIC niet vereist: sinds de
  // SEPA "IBAN only"-regel volstaat het rekeningnummer, en de EPC-QR-standaard
  // (versie 002) laat het veld ook leeg toe. Een verkeerde BIC op een factuur
  // levert alleen verwarring op, een ontbrekende BIC kost niets. Vul dit pas
  // in met de code die letterlijk in Sophie's bankapp staat.
  bic: null as string | null,

  invoiceFooterNote:
    "Gelieve het factuurnummer als mededeling te gebruiken bij overschrijving. Betalen kan ook cash bij afhaling.",
} as const;
