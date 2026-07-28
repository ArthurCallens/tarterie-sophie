// ---------------------------------------------------------------------------
// Site CMS — lets Sophie edit every public page's text/photos from /admin.
// ---------------------------------------------------------------------------

export type PageKey = "home" | "about" | "bestellen" | "contact" | "workshops_banner";

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
};

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
};

export type InvoiceStatus = "pending" | "sent" | "failed";

/** Mirrors the `invoices` table (managed mostly by the tarterie-invoicing trigger.dev project). */
export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string | null;
  pdf_storage_path: string | null;
  payment_reference: string | null;
  status: InvoiceStatus;
  paid: boolean;
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

/** Fields Sophie can edit on a pending order before accepting it. */
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
};
