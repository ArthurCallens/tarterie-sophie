-- Adds a customer phone number to orders (collected on the order form, and
-- editable by Sophie like the rest of the order's details before accepting).
-- Nullable so existing rows aren't broken; the order form makes it required
-- for new submissions.

alter table orders add column if not exists customer_phone text;
