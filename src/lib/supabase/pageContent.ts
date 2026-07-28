import { supabase } from "./client";

/** Reads one page's JSON content blob (home/about/bestellen/contact/workshops_banner). */
export async function getPageContent<T>(pageKey: string): Promise<T | null> {
  const { data, error } = await supabase.from("page_content").select("content").eq("page_key", pageKey).maybeSingle();
  if (error) throw error;
  return data ? (data.content as T) : null;
}

export async function updatePageContent<T extends object>(pageKey: string, content: T): Promise<T> {
  const { data, error } = await supabase
    .from("page_content")
    .upsert({ page_key: pageKey, content }, { onConflict: "page_key" })
    .select("content")
    .single();
  if (error) throw error;
  return data.content as T;
}

/** Uploads a page photo (hero/portrait/workshop) to the shared product-images bucket under `folder`. */
export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
