-- Rekalla v3 — new reminder categories for scanned paper items.
-- (Kept in its own migration: ALTER TYPE ... ADD VALUE must not share a
-- transaction with statements that use the new value.)
alter type public.reminder_category add value if not exists 'event';
alter type public.reminder_category add value if not exists 'bill';
