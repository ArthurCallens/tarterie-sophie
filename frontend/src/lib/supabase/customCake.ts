import { supabase } from "./client";
import { storagePathFromUrl } from "./format";
import { compressImage } from "../compressImage";
import type { CustomCakeGalleryImage, CustomCakeOffer, CustomCakeOfferInput } from "./types";

const OFFER_SELECT = "*, gallery:custom_cake_gallery_images(*)";

function normalize(row: CustomCakeOffer): CustomCakeOffer {
  return {
    ...row,
    price: Number(row.price),
    gallery: [...row.gallery].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function getCustomCakeOffer(): Promise<CustomCakeOffer | null> {
  const { data, error } = await supabase.from("custom_cake_offer").select(OFFER_SELECT).eq("id", 1).maybeSingle();
  if (error) throw error;
  return data ? normalize(data as CustomCakeOffer) : null;
}

export async function updateCustomCakeOffer(input: CustomCakeOfferInput): Promise<CustomCakeOffer> {
  const { data, error } = await supabase
    .from("custom_cake_offer")
    .update(input)
    .eq("id", 1)
    .select(OFFER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as CustomCakeOffer);
}

export async function uploadCustomCakeGalleryFile(file: File): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file);
  const path = `custom-cake/${crypto.randomUUID()}-${compressed.name}`;
  const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function addCustomCakeGalleryImage(
  imageUrl: string,
  altText: string,
  sortOrder: number,
): Promise<CustomCakeGalleryImage> {
  const { data, error } = await supabase
    .from("custom_cake_gallery_images")
    .insert({ offer_id: 1, image_url: imageUrl, alt_text: altText, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data as CustomCakeGalleryImage;
}

export async function deleteCustomCakeGalleryImage(image: CustomCakeGalleryImage): Promise<void> {
  const path = storagePathFromUrl(image.image_url);
  if (path) {
    const { error: storageError } = await supabase.storage.from("product-images").remove([path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("custom_cake_gallery_images").delete().eq("id", image.id);
  if (error) throw error;
}

export async function reorderCustomCakeGalleryImages(images: CustomCakeGalleryImage[]): Promise<void> {
  const updates = images.map((img, index) =>
    supabase.from("custom_cake_gallery_images").update({ sort_order: index }).eq("id", img.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
