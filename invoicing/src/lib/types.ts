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
  reference_photo_url: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  status: "pending" | "sent" | "failed";
  paid: boolean;
  created_at: string;
  updated_at: string;
};
