import test from "node:test";
import assert from "node:assert/strict";

import {
  BESIDE,
  bandHeading,
  bandOrder,
  inferPlacement,
  readContactName,
} from "./relations.ts";

test("common relationship words place somebody on the tree", () => {
  assert.equal(inferPlacement("granddaughter"), 2);
  assert.equal(inferPlacement("Grandson"), 2);
  assert.equal(inferPlacement("daughter"), 1);
  assert.equal(inferPlacement("sister"), 0);
  assert.equal(inferPlacement("mother"), -1);
  assert.equal(inferPlacement("grandmother"), -2);
});

test("longer words win, so a great-grandmother is not read as a grandmother", () => {
  assert.equal(inferPlacement("great-grandmother"), -3);
  assert.equal(inferPlacement("great grandson"), 3);
  assert.equal(inferPlacement("great-niece"), 2);
});

test("the words people actually use at home are understood", () => {
  assert.equal(inferPlacement("my nan"), -2);
  assert.equal(inferPlacement("Mum"), -1);
  assert.equal(inferPlacement("her grandad"), -2);
  assert.equal(inferPlacement("mother-in-law"), -1);
});

test("friends and neighbors sit beside the family rather than on it", () => {
  assert.equal(inferPlacement("friend"), BESIDE);
  assert.equal(inferPlacement("next door neighbor"), BESIDE);
  assert.equal(bandOrder(BESIDE) > bandOrder(3), true);
});

test("a word we do not know is left unplaced rather than guessed at", () => {
  assert.equal(inferPlacement("someone from the choir"), null);
  assert.equal(inferPlacement(""), null);
  assert.equal(inferPlacement(null), null);
});

test("every band has a heading, including the one for everybody else", () => {
  assert.equal(bandHeading(0), "You, and your own generation");
  assert.equal(bandHeading(2), "Grandchildren");
  assert.equal(bandHeading(BESIDE), "Also in your life");
});

test("a contact saved under what they are called gives up the relationship", () => {
  assert.deepEqual(readContactName("Grandma Jean"), {
    relationship: "grandma",
    displayName: "Jean",
  });
  assert.deepEqual(readContactName("Uncle Bob"), {
    relationship: "uncle",
    displayName: "Bob",
  });
  assert.equal(readContactName("Mom").relationship, "mom");
});

test("a name that is only the relationship keeps it as the name too", () => {
  // Asking "who is Mom to you" is silly, but "Mom" is what they are called.
  assert.deepEqual(readContactName("Mom"), {
    relationship: "mom",
    displayName: "Mom",
  });
});

test("an ordinary name gives nothing away, and is left alone", () => {
  assert.deepEqual(readContactName("Jane Smith"), {
    relationship: null,
    displayName: "Jane Smith",
  });
});

test("only whole words count, so no stranger is misplaced", () => {
  // "Sonya" contains "son" and "Jason" contains "son". Reading either as a
  // child would put someone a generation out on the tree.
  assert.equal(readContactName("Sonya").relationship, null);
  assert.equal(readContactName("Jason Reed").relationship, null);
  assert.equal(readContactName("Brothers Pizza").relationship, null);
});

test("the word found in a name places them on the tree", () => {
  const reading = readContactName("Grandma Jean");
  assert.equal(inferPlacement(reading.relationship), -2);
  assert.equal(inferPlacement(readContactName("Uncle Bob").relationship), -1);
});
