export type OrderItemCategory = "klassieker" | "klein-gebak" | "custom";

/**
 * One line of an order. `quantity` means a different thing per category:
 * number of whole cakes for a klassieker (always baked for 8 people),
 * number of pieces for klein gebak, number of people for the personalised
 * cake — see frontend/src/lib/supabase/types.ts (same shape, duplicated —
 * no shared package between the two projects).
 */
export type OrderItem = {
  id: string;
  category: OrderItemCategory;
  label: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** Mirrors the relevant columns of tarterie_sophie's `orders` table. */
export type OrderRow = {
  id: string;
  status: "pending" | "accepted" | "declined" | "archived";
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  occasion: string;
  servings: number;
  flavor: string;
  allergens: string[];
  pickup_date: string;
  message: string | null;
  /** Legacy single photo; new orders fill `reference_photo_urls` instead. Neither is used on the invoice. */
  reference_photo_url: string | null;
  reference_photo_urls: string[];
  price: number | null;
  items: OrderItem[];
  notes: string | null;
  decline_reason: string | null;
  decline_notify: boolean;
  decline_email_status: "pending" | "sent" | "failed" | null;
  created_at: string;
  updated_at: string;
};

/** The order fields an invoice PDF is actually rendered from — snapshotted onto InvoiceRow.snapshot. */
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

/**
 * The payload `generateInvoiceAndSend` receives. Two ways in:
 *  - the Postgres Database Webhook (an UPDATE event) when status → 'accepted'.
 *  - the `resend-invoice` Edge Function, for a manual resend Sophie triggers
 *    from the dashboard (sets `forceResend: true`, bypasses the "already sent"
 *    and "not a fresh acceptance" guards — see generateInvoiceAndSend.ts).
 */
export type OrdersWebhookPayload = {
  type: string;
  table: "orders";
  schema: "public";
  record: OrderRow;
  old_record?: OrderRow;
  forceResend?: boolean;
};

/** Mirrors the `invoices` table added in 0004_invoices.sql (+ 0006_invoice_payment.sql). */
export type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string | null;
  pdf_storage_path: string | null;
  payment_reference: string | null;
  status: "pending" | "sent" | "failed" | "superseded";
  paid: boolean;
  replaces_invoice_id: string | null;
  superseded_at: string | null;
  snapshot: InvoiceSnapshot;
  created_at: string;
  updated_at: string;
};
