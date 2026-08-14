-- `in_stock` was never actually used to gate anything customer-facing (the
-- storefront only ever filtered on `active`) — it was a purely cosmetic
-- admin checkbox that did nothing. Removing it rather than leaving dead,
-- never-editable schema/UI around.

alter table products drop column if exists in_stock;
