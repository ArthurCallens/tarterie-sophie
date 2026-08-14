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
  phone: "+32 487 45 97 78",

  // Where the "new order — check your dashboard" internal notification goes.
  // Currently Arthur's inbox while the site is being built out — change this
  // to Sophie's own address once she's ready to receive these directly.
  adminNotificationEmail: "arthur_callens@hotmail.com",
  vatNumber: null as string | null, // e.g. "BE0123456789" if she ever registers for VAT
  vatExemptionNotice: "Vrijgesteld van btw, art. 56bis W.BTW (vrijstellingsregeling kleine ondernemingen).",

  // Bank details for the "pay by transfer" section + SEPA/EPC QR code.
  iban: "BE75 2895 0213 6486",
  bic: "KREDBEBB",

  invoiceFooterNote:
    "Gelieve het factuurnummer als mededeling te gebruiken bij overschrijving. Betalen kan ook cash bij afhaling.",
} as const;
