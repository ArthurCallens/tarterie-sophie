import { supabase } from "./client";
import { storagePathFromUrl } from "./format";
import { compressImage } from "../compressImage";
import type { Product, ProductCategory, ProductImage, ProductInput } from "./types";

const PRODUCT_SELECT = "*, images:product_images(*)";

function sortImages(product: Product): Product {
  return { ...product, images: [...product.images].sort((a, b) => a.sort_order - b.sort_order) };
}

function normalize(row: Product): Product {
  return sortImages({ ...row, price: Number(row.price), servings_per_unit: Number(row.servings_per_unit) });
}

/** Storefront: products flagged for the Home page, in display order. */
export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("featured", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as Product[]).map(normalize);
}

/** Storefront: active products in a category, in display order. */
export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("category", category)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as Product[]).map(normalize);
}

/** Admin: every product regardless of active state. */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as Product[]).map(normalize);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Product) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(input).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return normalize(data as Product);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Product);
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function setProductFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ featured }).eq("id", id);
  if (error) throw error;
}

/** Persists a new display order (within one category) — index in the given array becomes the row's sort_order. */
export async function reorderProducts(products: Product[]): Promise<void> {
  const updates = products.map((p, index) => supabase.from("products").update({ sort_order: index }).eq("id", p.id));
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** Deletes the product's Storage files, then the row (product_images cascades). */
export async function deleteProduct(id: string, images: ProductImage[]): Promise<void> {
  const paths = images.map((img) => storagePathFromUrl(img.image_url)).filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from("product-images").remove(paths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/** Uploads a file to the product-images bucket and returns its public URL + storage path. */
export async function uploadProductImageFile(
  productId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file);
  const path = `products/${productId}/${crypto.randomUUID()}-${compressed.name}`;
  const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function addProductImage(
  productId: string,
  imageUrl: string,
  altText: string,
  sortOrder: number,
): Promise<ProductImage> {
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_url: imageUrl, alt_text: altText, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data as ProductImage;
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  const path = storagePathFromUrl(image.image_url);
  if (path) {
    const { error: storageError } = await supabase.storage.from("product-images").remove([path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("product_images").delete().eq("id", image.id);
  if (error) throw error;
}

export async function reorderProductImages(images: ProductImage[]): Promise<void> {
  const updates = images.map((img, index) =>
    supabase.from("product_images").update({ sort_order: index }).eq("id", img.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
