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
  created_at: string;
  updated_at: string;
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
