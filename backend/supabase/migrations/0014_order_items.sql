-- Structured order line items, so pricing can be calculated automatically
-- from what was actually ordered (cake count × per-cake price, piece count
-- × per-piece price, person count × per-person price) instead of Sophie
-- typing one flat total. Schemaless JSONB, same pattern as invoices.snapshot
-- and page_content.content — shape is owned by the app layer.

alter table orders add column if not exists items jsonb not null default '[]'::jsonb;
