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

/** The Postgres Database Webhook payload shape for an UPDATE event. */
export type OrdersWebhookPayload = {
  type: "UPDATE";
  table: "orders";
  schema: "public";
  record: OrderRow;
  old_record: OrderRow;
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
