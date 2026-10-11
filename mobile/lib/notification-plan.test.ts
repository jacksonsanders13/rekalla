/**
 * Tests for the notification planner.
 *
 * Run with `npm test`. No framework: Node 24 strips the types and runs these
 * directly, which keeps the dependency tree untouched. That is deliberate in
 * this repo, where a transitively hoisted dependency once crashed five
 * consecutive TestFlight builds.
 *
 * Every case below is a bug that shipped. The planner exists because these
 * were all invisible until a particular date arrived on a real device.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { planNotifications } from "./notification-plan.ts";
import type { Reminder } from "./types.ts";

function reminder(over: Partial<Reminder> = {}): Reminder {
  return {
    id: "r1",
    user_id: "u1",
    created_by: "u1",
    title: "Take a walk",
    notes: null,
    category: "exercise",
    recurrence: "daily",
    days_of_week: [],
    time_of_day: "09:00",
    start_date: "2026-01-01",
    end_date: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  } as Reminder;
}

/** 15 March 2026 is a Sunday. 08:00 local, so a 09:00 reminder is still ahead. */
const NOW = new Date(2026, 2, 15, 8, 0, 0);

describe("bounds the old scheduler ignored", () => {
  test("a reminder that already ended is not scheduled", () => {
    const plan = planNotifications(
      [reminder({ end_date: "2026-02-01" })],
      NOW,
    );
    assert.equal(plan.length, 0);
  });

  test("a reminder that has not started yet is not scheduled today", () => {
    const plan = planNotifications(
      [reminder({ start_date: "2026-04-01", end_date: "2026-04-30" })],
      NOW,
    );
    assert.ok(plan.length > 0, "should schedule its future dates");
    for (const item of plan) {
      assert.equal(item.trigger.kind, "date");
      if (item.trigger.kind === "date") {
        assert.ok(
          item.trigger.at >= new Date(2026, 3, 1),
          `fired before start_date: ${item.trigger.at.toISOString()}`,
        );
      }
    }
  });

  test("a bounded reminder never fires past its end_date", () => {
    const plan = planNotifications(
      [reminder({ start_date: "2026-03-01", end_date: "2026-03-20" })],
      NOW,
    );
    assert.ok(plan.length > 0);
    for (const item of plan) {
      if (item.trigger.kind === "date") {
        assert.ok(
          item.trigger.at <= new Date(2026, 2, 20, 23, 59),
          `fired after end_date: ${item.trigger.at.toISOString()}`,
        );
      }
    }
  });

  test("an inactive reminder is not scheduled", () => {
    assert.equal(planNotifications([reminder({ is_active: false })], NOW).length, 0);
  });
});

describe("month-end, where the UI and the phone used to disagree", () => {
  test("a reminder anchored to the 31st fires on 28 February", () => {
    // The old CALENDAR trigger asked iOS for day 31 and February never came.
    const feb = new Date(2026, 1, 1, 8, 0, 0); // 1 Feb 2026, not a leap year
    const plan = planNotifications(
      [reminder({ recurrence: "monthly", start_date: "2026-01-31" })],
      feb,
      60,
      28, // stay inside February
    );
    const days = plan
      .filter((p) => p.trigger.kind === "date")
      .map((p) => (p.trigger as { at: Date }).at.getDate());
    assert.deepEqual(days, [28], "should clamp to the last day of February");
  });

  test("the same reminder fires on the 31st in a 31-day month", () => {
    const may = new Date(2026, 4, 1, 8, 0, 0);
    const plan = planNotifications(
      [reminder({ recurrence: "monthly", start_date: "2026-01-31" })],
      may,
      60,
      30, // stay inside May
    );
    const days = plan
      .filter((p) => p.trigger.kind === "date")
      .map((p) => (p.trigger as { at: Date }).at.getDate());
    assert.deepEqual(days, [31]);
  });
});

describe("repeating triggers, which survive the app never reopening", () => {
  test("an unbounded daily reminder repeats rather than enumerating dates", () => {
    const plan = planNotifications([reminder()], NOW);
    assert.equal(plan.length, 1);
    assert.deepEqual(plan[0].trigger, { kind: "daily", hour: 9, minute: 0 });
  });

  test("an unbounded weekly reminder repeats once per chosen weekday", () => {
    const plan = planNotifications(
      [reminder({ recurrence: "weekly", days_of_week: [1, 3, 5] })],
      NOW,
    );
    assert.equal(plan.length, 3);
    assert.deepEqual(
      plan.map((p) => (p.trigger as { weekday: number }).weekday),
      [1, 3, 5],
    );
  });

  test("a daily reminder with an end_date gets real dates, not a repeat", () => {
    const plan = planNotifications([reminder({ end_date: "2026-03-18" })], NOW);
    assert.ok(plan.every((p) => p.trigger.kind === "date"));
    assert.equal(plan.length, 4); // 15th 09:00 is still ahead, through the 18th
  });

  test("duplicate weekdays do not produce duplicate notifications", () => {
    const plan = planNotifications(
      [reminder({ recurrence: "weekly", days_of_week: [2, 2, 2] })],
      NOW,
    );
    assert.equal(plan.length, 1);
  });
});

describe("today's remaining time", () => {
  test("a time that has already passed today is not scheduled for today", () => {
    const afternoon = new Date(2026, 2, 15, 14, 0, 0);
    const plan = planNotifications(
      [reminder({ recurrence: "once", start_date: "2026-03-15", time_of_day: "09:00" })],
      afternoon,
    );
    assert.equal(plan.length, 0, "09:00 has gone; nothing to schedule");
  });

  test("a time still ahead today is scheduled", () => {
    const plan = planNotifications(
      [reminder({ recurrence: "once", start_date: "2026-03-15", time_of_day: "09:00" })],
      NOW,
    );
    assert.equal(plan.length, 1);
  });
});

describe("the iOS 64-notification ceiling", () => {
  test("the plan never exceeds its budget", () => {
    // Thirty bounded dailies would enumerate hundreds of dates unchecked.
    const many = Array.from({ length: 30 }, (_, i) =>
      reminder({ id: `r${i}`, end_date: "2026-12-31" }),
    );
    const plan = planNotifications(many, NOW, 60);
    assert.equal(plan.length, 60);
  });

  test("repeating entries are allocated before dated ones", () => {
    const mixed = [
      reminder({ id: "repeat" }), // unbounded daily
      ...Array.from({ length: 80 }, (_, i) =>
        reminder({ id: `bounded${i}`, end_date: "2026-12-31" }),
      ),
    ];
    const plan = planNotifications(mixed, NOW, 10);
    assert.equal(plan.length, 10);
    assert.equal(plan[0].reminderId, "repeat");
    assert.equal(plan[0].trigger.kind, "daily");
  });

  test("dated entries are scheduled soonest first", () => {
    const plan = planNotifications(
      [
        reminder({ id: "later", recurrence: "once", start_date: "2026-03-20" }),
        reminder({ id: "sooner", recurrence: "once", start_date: "2026-03-16" }),
      ],
      NOW,
    );
    assert.deepEqual(plan.map((p) => p.reminderId), ["sooner", "later"]);
  });
});

describe("malformed data does not take the whole plan down", () => {
  test("an unparseable time is skipped, others still schedule", () => {
    const plan = planNotifications(
      [reminder({ id: "bad", time_of_day: "not-a-time" }), reminder({ id: "good" })],
      NOW,
    );
    assert.deepEqual(plan.map((p) => p.reminderId), ["good"]);
  });
});

