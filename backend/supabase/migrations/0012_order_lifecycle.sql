-- Order lifecycle overhaul:
--  - invoices become versioned: a sent invoice that no longer matches the
--    order (price/details changed) is superseded and a brand-new invoice
--    number is issued, instead of silently rewriting the old PDF in place.
--  - orders gain a "reject with reason" trail, mailed to the client unless
--    explicitly skipped.

-- ---------------------------------------------------------------------------
-- invoices: versioning
-- ---------------------------------------------------------------------------

alter table invoices
  drop constraint if exists invoices_status_check;

alter table invoices
  add constraint invoices_status_check check (status in ('pending', 'sent', 'failed', 'superseded'));

alter table invoices
  add column if not exists replaces_invoice_id uuid references invoices(id),
  add column if not exists superseded_at timestamptz,
  add column if not exists snapshot jsonb not null default '{}'::jsonb;

-- At most one *active* (non-superseded) invoice per order. Historical
-- (superseded) invoices are kept indefinitely for the audit trail.
alter table invoices drop constraint if exists invoices_order_id_key;
drop index if exists invoices_order_active_unique;
create unique index invoices_order_active_unique on invoices(order_id) where status <> 'superseded';

-- ---------------------------------------------------------------------------
-- orders: reject-with-reason
-- ---------------------------------------------------------------------------

alter table orders
  add column if not exists decline_reason text,
  add column if not exists decline_notify boolean not null default true,
  add column if not exists decline_email_status text
    check (decline_email_status in ('pending', 'sent', 'failed'));
