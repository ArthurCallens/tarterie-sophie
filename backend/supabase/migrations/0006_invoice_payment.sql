-- Adds a "paid" checkbox and the structured payment reference (Belgian
-- "gestructureerde mededeling") to invoices, and lets the dashboard (any
-- authenticated user) toggle "paid" and read invoices for display on orders.

alter table invoices add column if not exists paid boolean not null default false;
alter table invoices add column if not exists payment_reference text;

create policy "authenticated can update invoices"
  on invoices for update
  to authenticated
  using (true) with check (true);
