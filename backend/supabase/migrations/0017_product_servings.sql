-- Cake products serve a fixed group size that was hardcoded to 8 everywhere
-- on the site. Making it a per-product column lets Sophie set a different
-- size (e.g. a smaller/larger klassieker) from the admin dashboard.
alter table products
  add column if not exists servings_per_unit integer not null default 8;
