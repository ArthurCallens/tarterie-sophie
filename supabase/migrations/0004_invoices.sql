-- Auto-invoicing: an `invoices` table + a Postgres trigger that fires the
-- "generate-invoice-and-send" trigger.dev task whenever an order becomes accepted.
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

-- ---------------------------------------------------------------------------
-- Invoice numbering
-- ---------------------------------------------------------------------------

create sequence if not exists invoice_number_seq;

create or replace function next_invoice_number()
returns text
language sql
as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists invoices (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null unique references orders(id) on delete cascade,
  invoice_number    text unique,
  pdf_storage_path  text,
  status            text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists invoices_status_idx on invoices(status);

drop trigger if exists invoices_set_updated_at on invoices;
create trigger invoices_set_updated_at
  before update on invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — only the service role (trigger.dev tasks) ever touches
-- this table directly; nothing here needs to be readable from the browser.
-- ---------------------------------------------------------------------------

alter table invoices enable row level security;

create policy "authenticated can read invoices"
  on invoices for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Private storage bucket for generated invoice PDFs (emailed as attachments,
-- never linked publicly — no anon/authenticated policies needed; the
-- trigger.dev task uses the service role key, which bypasses RLS/Storage policies).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Webhook: fire the `invoice-webhook` Edge Function when an order transitions
-- to 'accepted'. That function re-shapes the payload for trigger.dev and
-- holds the real trigger.dev secret key as a Supabase secret (never in SQL).
--
-- Uses pg_net directly (net.http_post) rather than Supabase's
-- `supabase_functions.http_request` wrapper — that wrapper only exists on
-- projects where the dashboard's "Database Webhooks" feature has been used
-- at least once; pg_net is a plain, always-available Postgres extension, so
-- this trigger is fully self-contained.
--
-- The Authorization header below uses this project's anon key — not
-- sensitive, it's the same public key already shipped in the frontend bundle
-- as VITE_SUPABASE_ANON_KEY, just required so the Edge Function accepts the
-- request.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;

create or replace function notify_invoice_webhook()
returns trigger
language plpgsql
as $$
begin
  perform net.http_post(
    url := 'https://rmfndrnzykfvmvjcxgjj.supabase.co/functions/v1/invoice-webhook',
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'orders',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZm5kcm56eWtmdm12amN4Z2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzA2MzMsImV4cCI6MjEwMDc0NjYzM30.f91LMJWJg4zBrd5-leesZwss25I0_WVuqj8dByTICd4'
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists orders_accepted_invoice_webhook on orders;
create trigger orders_accepted_invoice_webhook
  after update on orders
  for each row
  when (new.status = 'accepted' and old.status is distinct from 'accepted')
  execute function notify_invoice_webhook();
