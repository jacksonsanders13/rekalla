// What a given user is allowed this month.
//
// Both Edge Functions capped everyone with one env var. They now ask here, so
// the cap follows the plan and there is a single place to change the numbers.
//
// Defaults keep today's behaviour: FREE_MONTHLY_LIMIT falls back to the old
// MONTHLY_MESSAGE_LIMIT, so deploying this changes nothing for anyone until
// you deliberately lower it. Drop it to the real free-tier number on the day
// you start charging, not before.

const FREE_LIMIT = Number(
  Deno.env.get("FREE_MONTHLY_LIMIT") ??
    Deno.env.get("MONTHLY_MESSAGE_LIMIT") ??
    "500",
);
const PLUS_LIMIT = Number(Deno.env.get("PLUS_MONTHLY_LIMIT") ?? "300");

interface Db {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: { plan?: string; status?: string; current_period_end?: string | null } | null;
        }>;
      };
    };
  };
}

/**
 * The monthly call limit for this user. Zero means uncapped.
 *
 * Fails open to the paid limit on an infrastructure error: an outage in the
 * entitlements read should never lock a paying customer out of the app they
 * are paying for. The usage meter still records every call, so spend stays
 * visible either way.
 */
export async function monthlyLimitFor(admin: unknown, userId: string): Promise<number> {
  try {
    const { data } = await (admin as Db)
      .from("entitlements")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    // No row is the normal case: everyone is free until a webhook says otherwise.
    if (!data) return FREE_LIMIT;

    // A lapsed or cancelled subscription degrades to free rather than locking
    // the person out of what they have already scanned.
    if (data.status !== "active") return FREE_LIMIT;

    if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
      return FREE_LIMIT;
    }

    return data.plan === "plus" ? PLUS_LIMIT : FREE_LIMIT;
  } catch (_) {
    return PLUS_LIMIT;
  }
}
