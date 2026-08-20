export const SITE = {
  name: "Tarterie Sophie",
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

// Altijd in kleine letters — zo staan ze ook op de producten in Supabase, en
// zo worden ze op de site getoond ("bevat: gluten, ei, melk").
export const ALLERGENS = [
  { id: "gluten", label: "gluten" },
  { id: "ei", label: "ei" },
  { id: "melk", label: "melk" },
  { id: "noten", label: "noten" },
  { id: "soja", label: "soja" },
];

/**
 * Vergelijkt allergenen zonder rekening te houden met hoofdletters — oude
 * bestellingen bevatten nog "Gluten"/"Ei"/… uit de tijd dat de labels met een
 * hoofdletter geschreven werden, en die moeten in het dashboard nog altijd als
 * aangevinkt herkend worden.
 */
export function hasAllergen(selected: string[], label: string): boolean {
  return selected.some((a) => a.toLowerCase() === label.toLowerCase());
}
