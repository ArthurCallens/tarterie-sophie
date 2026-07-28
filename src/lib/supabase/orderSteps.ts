import { supabase } from "./client";
import type { OrderStep, OrderStepInput } from "./types";

/** The "Zo werkt het" 4-step list on the Bestellen page. */
export async function getAllOrderSteps(): Promise<OrderStep[]> {
  const { data, error } = await supabase.from("order_steps").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data as OrderStep[];
}

export async function createOrderStep(input: OrderStepInput): Promise<OrderStep> {
  const { data, error } = await supabase.from("order_steps").insert(input).select().single();
  if (error) throw error;
  return data as OrderStep;
}

export async function updateOrderStep(id: string, input: OrderStepInput): Promise<OrderStep> {
  const { data, error } = await supabase.from("order_steps").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as OrderStep;
}

export async function deleteOrderStep(id: string): Promise<void> {
  const { error } = await supabase.from("order_steps").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderOrderSteps(steps: OrderStep[]): Promise<void> {
  const updates = steps.map((step, index) => supabase.from("order_steps").update({ sort_order: index }).eq("id", step.id));
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
