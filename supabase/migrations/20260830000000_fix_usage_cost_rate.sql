-- =====================================================================
-- Rekalla — correct the estimated-cost rate on assistant_usage.
--
-- Both Edge Functions computed est_cost_micros as input*3 + output*15,
-- priced for $3/$15 per million tokens. Claude Sonnet 5 is $2/$10, so every
-- row written so far overstates spend by about 50%. The functions now share
-- the rates in supabase/functions/_shared/pricing.ts; this corrects the rows
-- already stored, and the stale comment on the column.
--
-- Both rates scale by the same factor (2/3 and 10/15), so the correction is a
-- straight ratio and the original token counts are not needed to undo it.
-- =====================================================================

update public.assistant_usage
  set est_cost_micros = ceil(est_cost_micros * 2.0 / 3.0)
  where est_cost_micros > 0;

comment on column public.assistant_usage.est_cost_micros is
  'Estimated cost in micro-dollars (1 dollar = 1e6). Written by the Edge '
  'Functions using the rates in supabase/functions/_shared/pricing.ts. Sonnet 5 '
  'is $2 per million input tokens and $10 per million output: input*2 + output*10.';
