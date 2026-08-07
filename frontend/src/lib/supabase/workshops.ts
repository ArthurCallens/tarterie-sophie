import { supabase } from "./client";
import { storagePathFromUrl } from "./format";
import type { Workshop, WorkshopInput } from "./types";

function normalize(row: Workshop): Workshop {
  return { ...row, price: row.price === null ? null : Number(row.price) };
}

/** Storefront: only workshops still to come, soonest first. */
export async function getUpcomingWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data as Workshop[]).map(normalize);
}

/** Admin: every workshop, most recent event first. */
export async function getAllWorkshopsAdmin(): Promise<Workshop[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: true });
  if (error) throw error;
  return (data as Workshop[]).map(normalize);
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  const { data, error } = await supabase.from("workshops").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Workshop) : null;
}

export async function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  const { data, error } = await supabase.from("workshops").insert(input).select().single();
  if (error) throw error;
  return normalize(data as Workshop);
}

export async function updateWorkshop(id: string, input: WorkshopInput): Promise<Workshop> {
  const { data, error } = await supabase.from("workshops").update(input).eq("id", id).select().single();
  if (error) throw error;
  return normalize(data as Workshop);
}

/** Deletes the workshop's photo from Storage (if any), then the row. */
export async function deleteWorkshop(id: string, imageUrl: string | null): Promise<void> {
  if (imageUrl) {
    const path = storagePathFromUrl(imageUrl);
    if (path) {
      const { error: storageError } = await supabase.storage.from("product-images").remove([path]);
      if (storageError) throw storageError;
    }
  }
  const { error } = await supabase.from("workshops").delete().eq("id", id);
  if (error) throw error;
}
