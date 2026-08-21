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

/**
 * Alle inspiratiefoto's van een bestelling, ongeacht wanneer ze geplaatst is.
 * Bestellingen van voor 0016 hebben er hoogstens één, in het oude
 * `reference_photo_url`; nieuwe schrijven enkel naar de array. Eén plek die
 * beide samenvoegt, zodat de rest van de app maar met één lijst hoeft te
 * werken.
 */
export function orderPhotos(order: Pick<Order, "reference_photo_url" | "reference_photo_urls">): string[] {
  const urls = order.reference_photo_urls ?? [];
  if (urls.length > 0) return urls;
  return order.reference_photo_url ? [order.reference_photo_url] : [];
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

/**
 * Declined → pending. Een geweigerde bestelling die Sophie toch wil aannemen
 * gaat eerst terug in "wachtend": daar kan ze naam, datum, items en prijs nog
 * aanpassen, en pas het daaropvolgende "Accepteren" stuurt een factuur. Zo
 * vertrekt er nooit een factuur op basis van gegevens die ze nog wou wijzigen.
 */
export async function reopenOrder(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "pending",
      // De volgende weigercyclus (als die er komt) start weer schoon.
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

/** The only path into 'accepted' — always carries a price. */
export async function acceptOrder(id: string, price: number): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "accepted",
      price,
      // An accepted order starts its next possible decline cycle clean.
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

/** Permanently deletes an order (and all its reference photos, if any). Meant for declined or archived orders. */
export async function deleteOrder(id: string, referencePhotoUrls: string[]): Promise<void> {
  const paths = referencePhotoUrls
    .map(referencePhotoStoragePath)
    .filter((path): path is string => path !== null);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from("order-references").remove(paths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
