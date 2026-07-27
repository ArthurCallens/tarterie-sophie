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
