import assert from "node:assert/strict";
import test from "node:test";
import { drawWeightedEvents } from "../src/engine/eventSelection.ts";
import type { EventPoolEntry } from "../src/types/hub.ts";

function createEntry(id: string, weight: number): EventPoolEntry {
  return {
    id,
    weight,
    conditions: [],
    opens: { eventFile: id, nodeId: "start" },
  };
}

test("weighted draws are unique and do not mutate the source pool", () => {
  const pool = [createEntry("a", 1), createEntry("b", 2), createEntry("c", 3)];
  const snapshot = [...pool];
  const selected = drawWeightedEvents(pool, 3, () => 0.5);

  assert.equal(new Set(selected.map((entry) => entry.id)).size, 3);
  assert.deepEqual(pool, snapshot);
});

test("weights determine the selected interval", () => {
  const pool = [createEntry("light", 1), createEntry("heavy", 9)];

  assert.equal(drawWeightedEvents(pool, 1, () => 0)[0]?.id, "light");
  assert.equal(drawWeightedEvents(pool, 1, () => 0.999)[0]?.id, "heavy");
});

test("zero-weight and ineligible entries are excluded", () => {
  const pool = [
    createEntry("zero", 0),
    createEntry("blocked", 1),
    createEntry("eligible", 1),
  ];
  const selected = drawWeightedEvents(
    pool,
    10,
    () => 0,
    (entry) => entry.id !== "blocked",
  );

  assert.deepEqual(selected.map((entry) => entry.id), ["eligible"]);
});
