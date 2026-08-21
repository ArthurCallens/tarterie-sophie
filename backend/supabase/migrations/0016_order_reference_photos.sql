-- Multiple inspiration photos per order instead of exactly one.
--
-- `reference_photo_url` (singular, from 0003) is deliberately left in place
-- rather than migrated away: it's what every order placed before this holds,
-- and the dashboard still reads it as a fallback. New orders write only the
-- array. Backfilling and dropping the old column would gain nothing — the
-- app layer merges both in one place (see `orderPhotos()` in the frontend).

alter table orders add column if not exists reference_photo_urls text[] not null default '{}'::text[];
