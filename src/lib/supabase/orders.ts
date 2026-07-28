import { supabase } from "./client";
import type { Order, OrderEditableFields, OrderInput, OrderStatus } from "./types";

const ORDER_SELECT = "*";

function normalize(row: Order): Order {
  return { ...row, price: row.price === null ? null : Number(row.price) };
}

function referencePhotoStoragePath(url: string): string | null {
  const marker = "/object/public/order-references/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/** Storefront: submit a new order (pending, unauthenticated). */
export async function submitOrder(input: OrderInput): Promise<void> {
  const { error } = await supabase.from("orders").insert(input);
  if (error) throw error;
}

/** Storefront: uploads a customer's reference photo, unauthenticated, returns its public URL. */
export async function uploadOrderReferencePhoto(file: File): Promise<string> {
  const path = `orders/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("order-references").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("order-references").getPublicUrl(path);
  return data.publicUrl;
}

/** Admin: every order, most recent first. */
export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Order[]).map(normalize);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Order);
}

/** The only path into 'accepted' — always carries a price, whether from pending or restored from declined. */
export async function acceptOrder(id: string, price: number): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "accepted", price })
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Order);
}

/** Sophie edits any of an order's own details (name, contact info, occasion, etc.) before accepting it. */
export async function updateOrderFields(id: string, fields: OrderEditableFields): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update(fields)
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Order);
}

export async function updateOrderDetails(
  id: string,
  fields: { price: number | null; notes: string | null },
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update(fields)
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Order);
}

/** Permanently deletes an order (and its reference photo, if any). Only meant for declined orders. */
export async function deleteOrder(id: string, referencePhotoUrl: string | null): Promise<void> {
  if (referencePhotoUrl) {
    const path = referencePhotoStoragePath(referencePhotoUrl);
    if (path) {
      const { error: storageError } = await supabase.storage.from("order-references").remove([path]);
      if (storageError) throw storageError;
    }
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
