import { logger, task } from "@trigger.dev/sdk/v3";
import { BUSINESS } from "../config/business.js";
import { renderInvoicePdf } from "../lib/pdf.js";
import { buildEpcQrPayload, renderQrPng } from "../lib/sepaQr.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { buildStructuredCommunication, invoiceNumberToBase10 } from "../lib/structuredCommunication.js";
import type { InvoiceRow, InvoiceSnapshot, OrderRow } from "../lib/types.js";

type GenerateInvoicePdfPayload = {
  orderId: string;
  /**
   * Force a resend even if the active invoice already matches the order's
   * current data (e.g. the email bounced and Sophie wants to try again).
   * Has no effect on whether a *new invoice number* gets issued — that's
   * decided purely by whether the order's data has drifted from what the
   * active invoice was last generated from, never by caller intent.
   */
  forceResend?: boolean;
};

function snapshotFields(order: OrderRow): InvoiceSnapshot {
  return {
    price: order.price,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    occasion: order.occasion,
    servings: order.servings,
    flavor: order.flavor,
    pickup_date: order.pickup_date,
  };
}

function snapshotsEqual(a: InvoiceSnapshot, b: InvoiceSnapshot): boolean {
  return (
    a.price === b.price &&
    a.customer_name === b.customer_name &&
    a.customer_email === b.customer_email &&
    a.occasion === b.occasion &&
    a.servings === b.servings &&
    a.flavor === b.flavor &&
    a.pickup_date === b.pickup_date
  );
}

async function renderAndUpload(order: OrderRow, invoiceNumber: string, paymentReference: string) {
  const invoiceDate = new Date();
  const qrPayload = buildEpcQrPayload({
    name: BUSINESS.name,
    iban: BUSINESS.iban,
    bic: BUSINESS.bic,
    amount: order.price ?? 0,
    remittanceInfo: paymentReference,
  });
  const qrPngBuffer = await renderQrPng(qrPayload);
  const pdfBuffer = await renderInvoicePdf({ order, invoiceNumber, paymentReference, invoiceDate, qrPngBuffer });

  const pdfStoragePath = `invoices/${order.id}/${invoiceNumber}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("invoices")
    .upload(pdfStoragePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`Kon PDF niet uploaden: ${uploadError.message}`);
  return pdfStoragePath;
}

async function nextInvoiceNumber(): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("next_invoice_number");
  if (error) throw new Error(`Kon factuurnummer niet genereren: ${error.message}`);
  return data as string;
}

export const generateInvoicePdf = task({
  id: "generate-invoice-pdf",
  retry: { maxAttempts: 3, minTimeoutInMs: 1000, maxTimeoutInMs: 5000, factor: 2 },
  run: async ({ orderId, forceResend }: GenerateInvoicePdfPayload) => {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError) throw new Error(`Kon bestelling niet ophalen: ${orderError.message}`);
    const order: OrderRow = orderData;
    if (order.status !== "accepted") {
      throw new Error(`Bestelling ${orderId} heeft status "${order.status}", verwacht "accepted".`);
    }

    // At most one active (non-superseded) invoice per order — enforced by a
    // partial unique index (0012_order_lifecycle.sql).
    const { data: activeData } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .neq("status", "superseded")
      .maybeSingle();
    const active: InvoiceRow | null = activeData;
    const currentFields = snapshotFields(order);

    // No active invoice — either this order has never been invoiced, or its
    // previous invoice was superseded by a decline/cancel (supersedeInvoice()
    // in useOrders.ts) and it's now being re-accepted. In the latter case,
    // link the new invoice to the one it replaces so the "this replaces
    // invoice X, which is no longer valid" email copy in sendInvoiceEmail.ts
    // fires correctly — otherwise a re-accepted order silently looks like a
    // brand-new, first-time invoice to the customer.
    if (!active) {
      const { data: lastSuperseded } = await supabaseAdmin
        .from("invoices")
        .select("id")
        .eq("order_id", orderId)
        .eq("status", "superseded")
        .order("superseded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const invoiceNumber = await nextInvoiceNumber();
      const paymentReference = buildStructuredCommunication(invoiceNumberToBase10(invoiceNumber));
      const pdfStoragePath = await renderAndUpload(order, invoiceNumber, paymentReference);
      const { data: invoiceRowData, error: insertError } = await supabaseAdmin
        .from("invoices")
        .insert({
          order_id: order.id,
          invoice_number: invoiceNumber,
          pdf_storage_path: pdfStoragePath,
          payment_reference: paymentReference,
          status: "pending",
          replaces_invoice_id: lastSuperseded?.id ?? null,
          snapshot: currentFields,
        })
        .select()
        .single();
      if (insertError) throw new Error(`Kon factuur niet opslaan: ${insertError.message}`);
      logger.log(lastSuperseded ? "Invoice re-issued after cancel/decline" : "First invoice generated", {
        orderId,
        invoiceNumber,
        replacesInvoiceId: lastSuperseded?.id ?? null,
      });
      return { invoiceId: invoiceRowData.id, invoiceNumber, isNew: true, alreadyCurrent: false };
    }

    const fieldsChanged = !snapshotsEqual(active.snapshot, currentFields);

    // Nothing was ever successfully delivered under this number — safe to
    // correct in place, whatever changed, without burning a new number.
    if (active.status === "pending" || active.status === "failed") {
      const invoiceNumber = active.invoice_number ?? (await nextInvoiceNumber());
      const paymentReference =
        active.payment_reference ?? buildStructuredCommunication(invoiceNumberToBase10(invoiceNumber));
      const pdfStoragePath = await renderAndUpload(order, invoiceNumber, paymentReference);
      const { error: updateError } = await supabaseAdmin
        .from("invoices")
        .update({
          invoice_number: invoiceNumber,
          payment_reference: paymentReference,
          pdf_storage_path: pdfStoragePath,
          status: "pending",
          snapshot: currentFields,
        })
        .eq("id", active.id);
      if (updateError) throw new Error(`Kon factuur niet bijwerken: ${updateError.message}`);
      logger.log("Undelivered invoice regenerated in place", { orderId, invoiceNumber });
      return { invoiceId: active.id, invoiceNumber, isNew: false, alreadyCurrent: false };
    }

    // active.status === "sent" from here on.
    if (!fieldsChanged && !forceResend) {
      logger.log("Invoice already current and sent, nothing to do", { orderId, invoiceNumber: active.invoice_number });
      return { invoiceId: active.id, invoiceNumber: active.invoice_number, isNew: false, alreadyCurrent: true };
    }

    if (!fieldsChanged && forceResend) {
      // Manual resend of an unchanged, already-sent invoice (e.g. bounced email).
      const invoiceNumber = active.invoice_number!;
      const paymentReference = active.payment_reference!;
      const pdfStoragePath = await renderAndUpload(order, invoiceNumber, paymentReference);
      const { error: updateError } = await supabaseAdmin
        .from("invoices")
        .update({ pdf_storage_path: pdfStoragePath, status: "pending", snapshot: currentFields })
        .eq("id", active.id);
      if (updateError) throw new Error(`Kon factuur niet bijwerken: ${updateError.message}`);
      logger.log("Unchanged sent invoice regenerated for manual resend", { orderId, invoiceNumber });
      return { invoiceId: active.id, invoiceNumber, isNew: false, alreadyCurrent: false };
    }

    // Order data changed after this invoice was sent — void it and issue a
    // brand-new invoice number. The old invoice/PDF is kept, marked superseded.
    const { error: supersedeError } = await supabaseAdmin
      .from("invoices")
      .update({ status: "superseded", superseded_at: new Date().toISOString() })
      .eq("id", active.id);
    if (supersedeError) throw new Error(`Kon oude factuur niet ongeldig maken: ${supersedeError.message}`);

    const invoiceNumber = await nextInvoiceNumber();
    const paymentReference = buildStructuredCommunication(invoiceNumberToBase10(invoiceNumber));
    const pdfStoragePath = await renderAndUpload(order, invoiceNumber, paymentReference);
    const { data: invoiceRowData, error: insertError } = await supabaseAdmin
      .from("invoices")
      .insert({
        order_id: order.id,
        invoice_number: invoiceNumber,
        pdf_storage_path: pdfStoragePath,
        payment_reference: paymentReference,
        status: "pending",
        replaces_invoice_id: active.id,
        snapshot: currentFields,
      })
      .select()
      .single();
    if (insertError) throw new Error(`Kon nieuwe factuur niet opslaan: ${insertError.message}`);

    logger.log("Order data changed since last send — issued a new invoice", {
      orderId,
      oldInvoiceNumber: active.invoice_number,
      newInvoiceNumber: invoiceNumber,
    });
    return { invoiceId: invoiceRowData.id, invoiceNumber, isNew: true, alreadyCurrent: false };
  },
});
