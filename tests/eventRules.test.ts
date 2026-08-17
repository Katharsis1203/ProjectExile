import assert from "node:assert/strict";
import test from "node:test";
import {
  getCheckChance,
  getStatValue,
  resolveChoice,
  rollStatCheck,
} from "../src/engine/eventRules.ts";
import type { CheckedEventChoice } from "../src/types/event.ts";

const PLAYER_STATS = {
  perception: 8,
  survival: 6,
};

test("stat lookup is case-insensitive and uses the documented fallback", () => {
  assert.equal(getStatValue(PLAYER_STATS, " Perception "), 8);
  assert.equal(getStatValue(PLAYER_STATS, "unknown"), 5);
});

test("displayed check chance matches every possible d6 result", () => {
  assert.equal(
    getCheckChance({ stat: "perception", difficulty: 7 }, PLAYER_STATS),
    100,
  );
  assert.equal(
    getCheckChance({ stat: "survival", difficulty: 10 }, PLAYER_STATS),
    50,
  );
  assert.equal(
    getCheckChance({ stat: "survival", difficulty: 13 }, PLAYER_STATS),
    0,
  );
});

test("rollStatCheck maps random boundaries to a d6 roll", () => {
  const lowRoll = rollStatCheck(
    { stat: "survival", difficulty: 7 },
    PLAYER_STATS,
    () => 0,
  );
  const highRoll = rollStatCheck(
    { stat: "survival", difficulty: 13 },
    PLAYER_STATS,
    () => 1,
  );

  assert.deepEqual(lowRoll, {
    stat: "survival",
    difficulty: 7,
    statValue: 6,
    roll: 1,
    success: true,
  });
  assert.equal(highRoll.roll, 6);
  assert.equal(highRoll.success, false);
});

test("checked choices select the highest satisfied threshold without mutating data", () => {
  const choice: CheckedEventChoice = {
    type: "checked",
    text: "Search",
    statChecks: [
      { stat: "perception", difficulty: 9 },
      { stat: "survival", difficulty: 8 },
    ],
    weighted: {
      buckets: [
        { id: "fail", threshold: 0, next: "fail" },
        {
          id: "success",
          threshold: 2,
          next: "success",
          flavourText: "Found it.",
        },
        { id: "partial", threshold: 1, next: "partial" },
      ],
    },
  };
  const originalOrder = choice.weighted?.buckets.map((bucket) => bucket.id);
  const result = resolveChoice(choice, PLAYER_STATS, () => 0.99);

  assert.equal(result.next, "success");
  assert.equal(result.flavourText, "Found it.");
  assert.deepEqual(
    choice.weighted?.buckets.map((bucket) => bucket.id),
    originalOrder,
  );
});
