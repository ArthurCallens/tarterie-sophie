import { supabase } from "./client";
import { compressImage } from "../compressImage";
import type { Order, OrderDeclineFields, OrderEditableFields, OrderInput, OrderStatus } from "./types";

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
  const compressed = await compressImage(file);
  const path = `orders/${crypto.randomUUID()}-${compressed.name}`;
  const { error } = await supabase.storage.from("order-references").upload(path, compressed, {
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

/**
 * Pending → declined, or accepted → declined. Always carries a reason (or an
 * explicit "no reason needed" skip) — declining silently isn't allowed from
 * this layer up, only `setOrderStatus` can still do a bare status flip and
 * that's reserved for other transitions (e.g. archive).
 */
export async function declineOrder(id: string, fields: OrderDeclineFields): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "declined",
      decline_reason: fields.notify ? fields.reason : null,
      decline_notify: fields.notify,
      decline_email_status: fields.notify ? "pending" : null,
    })
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
    .update({
      status: "accepted",
      price,
      // A restored order starts its next possible decline cycle clean.
      decline_reason: null,
      decline_notify: true,
      decline_email_status: null,
    })
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

/** Removes/restores an order's income row from the Boekkeeping ledger, without touching the order itself. */
export async function setOrderExcludedFromBookkeeping(id: string, excluded: boolean): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ excluded_from_bookkeeping: excluded })
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return normalize(data as Order);
}

/** Sends the decline-reason email for an already-declined order (decline_notify must be true). */
export async function sendDeclineEmail(orderId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("send-decline-email", { body: { orderId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** Permanently deletes an order (and its reference photo, if any). Meant for declined or archived orders. */
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
