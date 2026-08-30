// Model pricing, in one place so the two functions cannot drift apart. They did:
// both had Sonnet hard-coded at $3/$15 per million, which overstated spend by
// about 50% and made the usage meter useless for pricing decisions.
//
// Rates are US dollars per million tokens. Update them here when the model
// changes, and update MODEL_RATES alongside ANTHROPIC_MODEL in each function.

interface Rate {
  /** dollars per million input tokens */
  input: number;
  /** dollars per million output tokens */
  output: number;
}

const MODEL_RATES: Record<string, Rate> = {
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** What we bill against when the configured model isn't in the table. */
const FALLBACK: Rate = MODEL_RATES["claude-sonnet-5"];

/**
 * Estimated cost of one call in micro-dollars (1 dollar = 1e6), which is what
 * assistant_usage.est_cost_micros stores. Rounded up, so the meter never
 * flatters the margin.
 */
export function estCostMicros(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = MODEL_RATES[model] ?? FALLBACK;
  return Math.ceil(inputTokens * rate.input + outputTokens * rate.output);
}
