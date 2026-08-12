export const SITE = {
  name: "Tarterie Sophie",
  tagline: "Life is short, make it sweet.",
};

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Zo werkt het", to: "/bestellen" },
  { label: "Over mij", to: "/over-mij" },
  { label: "Workshops", to: "/workshops" },
  { label: "Contact", to: "/contact" },
];

// Every other page's copy (Home intro, Over mij, Bestellen banner + steps,
// Contact details, Workshops) now lives in Supabase (`page_content`,
// `trust_badges`, `order_steps`, `workshops`) and is editable via /admin —
// see src/lib/supabase/pageContent.ts, trustBadges.ts, orderSteps.ts, workshops.ts.
// Products (Classics, Klein gebak) and the Custom Cake offer work the same
// way — see src/lib/supabase/products.ts and customCake.ts.

export const ALLERGENS = [
  { id: "gluten", label: "Gluten" },
  { id: "ei", label: "Ei" },
  { id: "melk", label: "Melk" },
  { id: "noten", label: "Noten" },
  { id: "soja", label: "Soja" },
];
