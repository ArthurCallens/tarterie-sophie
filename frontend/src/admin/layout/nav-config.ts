// Add future tools here — the shell needs no other changes.
export const ADMIN_NAV_GROUPS = [
  {
    heading: "Beheer",
    items: [
      { label: "Bestellingen", to: "/admin/orders" },
      { label: "Kalender", to: "/admin/calendar" },
      { label: "Archief", to: "/admin/archive" },
      { label: "Boekhouding", to: "/admin/bookkeeping" },
    ],
  },
  {
    heading: "Website",
    items: [
      { label: "Home", to: "/admin/site/home" },
      { label: "Over mij", to: "/admin/site/about" },
      { label: "Bestellen", to: "/admin/site/bestellen" },
      { label: "Workshops", to: "/admin/site/workshops" },
      { label: "Contact", to: "/admin/site/contact" },
    ],
  },
];
