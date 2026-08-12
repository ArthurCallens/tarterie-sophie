-- Auto-confirmation: fire the "send-order-confirmation-email" trigger.dev
-- task whenever a customer submits a new order, so they get an immediate
-- "we received it" receipt instead of hearing nothing until Sophie
-- accepts/declines. Mirrors notify_invoice_webhook() in 0004_invoices.sql —
-- same pg_net direct-post pattern, same anon-key header (public, already
-- shipped in the frontend bundle as VITE_SUPABASE_ANON_KEY).

create or replace function notify_order_submitted_webhook()
returns trigger
language plpgsql
as $$
begin
  perform net.http_post(
    url := 'https://rmfndrnzykfvmvjcxgjj.supabase.co/functions/v1/order-confirmation-webhook',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'orders',
      'schema', 'public',
      'record', to_jsonb(new)
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

drop trigger if exists orders_submitted_confirmation_webhook on orders;
create trigger orders_submitted_confirmation_webhook
  after insert on orders
  for each row
  execute function notify_order_submitted_webhook();
