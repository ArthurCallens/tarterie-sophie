// ---------------------------------------------------------------------------
// Site CMS — lets Sophie edit every public page's text/photos from /admin.
// ---------------------------------------------------------------------------

export type PageKey = "home" | "about" | "bestellen" | "contact" | "workshops_banner" | "decline_email";

export type HomeContent = {
  heroImageUrl: string | null;
  heroEyebrow: string;
  heroSubtext: string;
  introText: string;
};

export type AboutContent = {
  bannerEyebrow: string;
  portraitImageUrl: string | null;
  introText: string;
  trainingIntro: string;
  trainingList: string[];
  planningIntro: string;
  planningList: string[];
  bakeOffText: string;
};

export type BestellenContent = {
  bannerEyebrow: string;
  bannerTitle: string;
  bannerIntro: string;
};

export type ContactContent = {
  bannerEyebrow: string;
  bannerTitle: string;
  addressStreet: string;
  addressCity: string;
  phone: string;
  phoneHref: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
};

/**
 * Sophie's fully-editable "weigeren" (decline) email template. Supports
 * placeholder tokens substituted at send time (see
 * frontend/src/lib/emailTemplate.ts and
 * backend/invoicing/src/lib/emailTemplate.ts — kept in sync manually, same
 * as other duplicated business constants in this codebase):
 *   {{naam}}         — the customer's name
 *   {{reden}}        — the reason Sophie typed when declining
 *   {{bedrijfsnaam}} — the business name
 *   {{eigenaar}}     — Sophie's name (sign-off)
 */
export type DeclineEmailContent = {
  subject: string;
  body: string;
};

export type WorkshopsBannerContent = {
  bannerEyebrow: string;
  bannerTitle: string;
  bannerIntro: string;
  /** Callout above the workshop list about booking a private group session. */
  groupNote: string;
};

export type TrustBadge = {
  id: string;
  label: string;
  detail: string;
  sort_order: number;
  created_at: string;
};

export type TrustBadgeInput = {
  label: string;
  detail: string;
  sort_order: number;
};

export type OrderStep = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
};

export type OrderStepInput = {
  title: string;
  body: string;
  sort_order: number;
};

export type Workshop = {
  id: string;
  name: string;
  event_date: string | null;
  time_range: string;
  location: string;
  price: number | null;
  description: string;
  cta_text: string;
  spots_note: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WorkshopInput = {
  name: string;
  event_date: string | null;
  time_range: string;
  location: string;
  price: number | null;
  description: string;
  cta_text: string;
  spots_note: string;
  image_url: string | null;
  sort_order: number;
};

export type ProductCategory = "klassieker" | "klein-gebak";

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  allergens: string[];
  in_stock: boolean;
  active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
};

export type ProductInput = {
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  allergens: string[];
  in_stock: boolean;
  active: boolean;
  featured: boolean;
  sort_order: number;
};

export type CustomCakeGalleryImage = {
  id: string;
  offer_id: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

export type CustomCakeOffer = {
  id: number;
  intro: string;
  price: number;
  price_unit: string;
  detail: string;
  fillings: string[];
  updated_at: string;
  gallery: CustomCakeGalleryImage[];
};

export type CustomCakeOfferInput = {
  intro: string;
  price: number;
  price_unit: string;
  detail: string;
  fillings: string[];
};

export type OrderStatus = "pending" | "accepted" | "declined" | "archived";

export type OrderItemCategory = "klassieker" | "klein-gebak" | "custom";

/**
 * One line of an order — a cake/pastry choice with its own quantity and
 * price, so the total can be calculated automatically instead of typed in
 * by hand. `quantity` means a different thing per category: number of
 * whole cakes for a klassieker (always baked for 8 people), number of
 * pieces for klein gebak, number of people for the personalised cake.
 * `unitPrice`/`lineTotal` stay editable per item on the dashboard (see
 * OrderCard.tsx) even after the customer submits.
 */
export type OrderItem = {
  id: string;
  category: OrderItemCategory;
  label: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  occasion: string;
  servings: number;
  flavor: string;
  allergens: string[];
  pickup_date: string;
  message: string | null;
  reference_photo_url: string | null;
  price: number | null;
  items: OrderItem[];
  notes: string | null;
  // Sophie removed this order's income from the Boekhouding ledger (e.g. it
  // was entered with a wrong price) — the order itself is untouched, still
  // visible in Archief exactly as before.
  excluded_from_bookkeeping: boolean;
  created_at: string;
  updated_at: string;
  // Snapshot of what the client originally submitted — set once at creation
  // by a DB trigger, never touched by later edits. A permanent memory of the
  // original request regardless of how many times the live fields change.
  original_customer_name: string;
  original_customer_email: string;
  original_customer_phone: string | null;
  original_occasion: string;
  original_servings: number;
  original_flavor: string;
  original_allergens: string[];
  original_pickup_date: string;
  original_message: string | null;
  // Set when this order is declined — the reason Sophie wrote (mailed to the
  // client) and whether/how that mail went out. Reset back to defaults
  // whenever the order is restored to accepted.
  decline_reason: string | null;
  decline_notify: boolean;
  decline_email_status: DeclineEmailStatus | null;
};

export type DeclineEmailStatus = "pending" | "sent" | "failed";

export type OrderInput = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  occasion: string;
  servings: number;
  flavor: string;
  allergens: string[];
  pickup_date: string;
  message: string | null;
  reference_photo_url: string | null;
  items: OrderItem[];
  /** Auto-computed sum of the items' line totals at submission time — a starting suggestion, not binding; Sophie reviews/adjusts before accepting. */
  price: number;
};

export type InvoiceStatus = "pending" | "sent" | "failed" | "superseded";

/** The order fields an invoice PDF was actually rendered from, at generation time. */
export type InvoiceSnapshot = {
  price: number | null;
  customer_name: string;
  customer_email: string;
  occasion: string;
  servings: number;
  flavor: string;
  pickup_date: string;
  items: OrderItem[];
};

/** Mirrors the `invoices` table (managed mostly by the tarterie-invoicing trigger.dev project). */
export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string | null;
  pdf_storage_path: string | null;
  payment_reference: string | null;
  status: InvoiceStatus;
  paid: boolean;
  // Non-null once an invoice is superseded by a newer one (price/details
  // changed after this invoice was sent) — the old PDF stays in Storage for
  // the audit trail but is no longer the order's active invoice.
  replaces_invoice_id: string | null;
  superseded_at: string | null;
  snapshot: InvoiceSnapshot;
  created_at: string;
  updated_at: string;
};

/** A manual entry the user typed in, or a snapshot auto-taken when its source order was deleted. */
export type IncomeEntryOrigin = "manual" | "order_snapshot";

export type IncomeEntry = {
  id: string;
  amount: number;
  description: string;
  entry_date: string;
  proof_storage_path: string | null;
  /** Which bucket proof_storage_path lives in — 'invoices' for an order-income snapshot's invoice PDF. */
  proof_bucket: "bookkeeping-proofs" | "invoices";
  origin: IncomeEntryOrigin;
  created_at: string;
  updated_at: string;
};

export type IncomeEntryInput = {
  amount: number;
  description: string;
  entry_date: string;
};

export type ExpenseType = "variable" | "fixed";

export type ExpenseEntry = {
  id: string;
  expense_type: ExpenseType;
  amount: number;
  description: string;
  entry_date: string;
  proof_storage_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseEntryInput = {
  expense_type: ExpenseType;
  amount: number;
  description: string;
  entry_date: string;
};

/**
 * A single row in the bookkeeping overview — unifies order-derived income
 * (read-only, sourced live from `orders`/`invoices`) with manual income and
 * expense entries so the page can filter/sort/export them as one ledger.
 */
export type LedgerEntry = {
  id: string;
  kind: "income" | "expense";
  source: "order" | "manual";
  categoryLabel: string;
  amount: number;
  description: string;
  entryDate: string;
  proofBucket: "invoices" | "bookkeeping-proofs" | null;
  proofPath: string | null;
  orderId: string | null;
  paid: boolean | null;
};

/** Fields Sophie can edit on a pending or accepted order. */
export type OrderEditableFields = {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  occasion: string;
  servings: number;
  flavor: string;
  allergens: string[];
  pickup_date: string;
  message: string | null;
  items: OrderItem[];
};

/** What Sophie writes (or explicitly skips) when declining an order. */
export type OrderDeclineFields = {
  reason: string | null;
  notify: boolean;
};
