import test from "node:test";
import assert from "node:assert/strict";

import { currentRun, daysBetween, daysPracticed, recordPracticeDay } from "./progress.ts";

test("days practiced counts distinct days and only goes up", () => {
  assert.equal(daysPracticed([]), 0);
  assert.equal(daysPracticed(["2026-09-01", "2026-09-01", "2026-09-02"]), 2);
});

test("consecutive days build a run", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03"];

  assert.equal(currentRun(days, "2026-09-03"), 3);
});

test("a single missed day costs nothing", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03"];

  // Yesterday was missed; the run is intact when they come back today.
  assert.equal(currentRun(days, "2026-09-05"), 3);
});

test("longer gaps erode the run one day at a time rather than resetting it", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"];

  assert.equal(currentRun(days, "2026-09-06"), 5);
  assert.equal(currentRun(days, "2026-09-08"), 4);
  assert.equal(currentRun(days, "2026-09-09"), 3);
  assert.equal(currentRun(days, "2026-09-11"), 1);
});

test("a run never goes below zero however long the gap", () => {
  const days = ["2026-09-01", "2026-09-02"];

  assert.equal(currentRun(days, "2026-12-25"), 0);
});

test("a fortnight away and one day back does not wipe the record", () => {
  const days = [
    "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24",
    "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29",
    // Two weeks in hospital, then back at it.
    "2026-09-12",
  ];

  assert.ok(currentRun(days, "2026-09-12") > 0);
  assert.equal(daysPracticed(days), 11);
});

test("no practice at all is a run of zero, not a negative number", () => {
  assert.equal(currentRun([], "2026-09-03"), 0);
});

test("today is recorded once and kept in order", () => {
  const first = recordPracticeDay(["2026-09-02"], "2026-09-03");
  const again = recordPracticeDay(first, "2026-09-03");

  assert.deepEqual(first, ["2026-09-02", "2026-09-03"]);
  assert.equal(again, first);
  assert.deepEqual(recordPracticeDay(["2026-09-04"], "2026-09-03"), [
    "2026-09-03",
    "2026-09-04",
  ]);
});

test("days between two dates crosses months and years", () => {
  assert.equal(daysBetween("2026-09-03", "2026-09-04"), 1);
  assert.equal(daysBetween("2026-08-31", "2026-09-01"), 1);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2026-09-04", "2026-09-03"), -1);
});
