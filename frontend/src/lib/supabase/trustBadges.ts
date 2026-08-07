import { supabase } from "./client";
import type { TrustBadge, TrustBadgeInput } from "./types";

/** Shown on both Home and Over mij — a single shared list, edited once. */
export async function getAllTrustBadges(): Promise<TrustBadge[]> {
  const { data, error } = await supabase.from("trust_badges").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data as TrustBadge[];
}

export async function createTrustBadge(input: TrustBadgeInput): Promise<TrustBadge> {
  const { data, error } = await supabase.from("trust_badges").insert(input).select().single();
  if (error) throw error;
  return data as TrustBadge;
}

export async function updateTrustBadge(id: string, input: TrustBadgeInput): Promise<TrustBadge> {
  const { data, error } = await supabase.from("trust_badges").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as TrustBadge;
}

export async function deleteTrustBadge(id: string): Promise<void> {
  const { error } = await supabase.from("trust_badges").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderTrustBadges(badges: TrustBadge[]): Promise<void> {
  const updates = badges.map((badge, index) =>
    supabase.from("trust_badges").update({ sort_order: index }).eq("id", badge.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
