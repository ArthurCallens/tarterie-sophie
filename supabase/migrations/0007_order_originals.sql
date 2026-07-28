-- Permanently remembers what the client originally submitted, separate from
-- the live/editable columns Sophie can change afterward. Populated once at
-- INSERT time by a trigger (never touched by later UPDATEs), so it survives
-- any number of edits — a fixed "memory" of the original request.

alter table orders
  add column if not exists original_customer_name  text,
  add column if not exists original_customer_email text,
  add column if not exists original_customer_phone text,
  add column if not exists original_occasion       text,
  add column if not exists original_servings       integer,
  add column if not exists original_flavor         text,
  add column if not exists original_allergens      text[],
  add column if not exists original_pickup_date    date,
  add column if not exists original_message         text;

-- Backfill existing rows: their "original" is whatever their current value
-- already is — there's no earlier snapshot to recover for orders placed
-- before this migration.
update orders set
  original_customer_name  = customer_name,
  original_customer_email = customer_email,
  original_customer_phone = customer_phone,
  original_occasion       = occasion,
  original_servings       = servings,
  original_flavor         = flavor,
  original_allergens      = allergens,
  original_pickup_date    = pickup_date,
  original_message        = message
where original_customer_name is null;

create or replace function snapshot_order_originals()
returns trigger
language plpgsql
as $$
begin
  new.original_customer_name  := new.customer_name;
  new.original_customer_email := new.customer_email;
  new.original_customer_phone := new.customer_phone;
  new.original_occasion       := new.occasion;
  new.original_servings       := new.servings;
  new.original_flavor         := new.flavor;
  new.original_allergens      := new.allergens;
  new.original_pickup_date    := new.pickup_date;
  new.original_message        := new.message;
  return new;
end;
$$;

drop trigger if exists orders_snapshot_originals on orders;
create trigger orders_snapshot_originals
  before insert on orders
  for each row execute function snapshot_order_originals();
