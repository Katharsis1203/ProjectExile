import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultPlayer } from "../src/data/defaultPlayer.ts";
import { isEventConditionMet } from "../src/engine/eventConditions.ts";
import type { Hub } from "../src/types/hub.ts";

const hub: Hub = {
  schemaVersion: 1,
  id: "test_hub",
  name: "Test Hub",
  type: "hub",
  image: "test.png",
  stats: [{ label: "Visibility", value: "Poor", percent: 35 }],
  scene: {
    effects: { lighting: "night", weather: "snow", weatherIntensity: "heavy" },
  },
  eventPools: { life: [], explore: [], special: [] },
};

const player = createDefaultPlayer();
const context = { player, hub };

test("event conditions evaluate each supported source", () => {
  assert.equal(
    isEventConditionMet(
      { type: "playerResource", resource: "health", operator: "gte", value: 80 },
      context,
    ),
    true,
  );
  assert.equal(
    isEventConditionMet(
      { type: "playerStat", stat: "perception", operator: "eq", value: 8 },
      context,
    ),
    true,
  );
  assert.equal(
    isEventConditionMet({ type: "statusEffect", effect: "chilled" }, context),
    true,
  );
  assert.equal(
    isEventConditionMet(
      { type: "inventoryItem", item: "rope", quantity: 1 },
      context,
    ),
    true,
  );
  assert.equal(
    isEventConditionMet(
      { type: "hubStat", stat: "visibility", operator: "lte", value: 40 },
      context,
    ),
    true,
  );
  assert.equal(
    isEventConditionMet(
      { type: "scene", field: "weatherIntensity", equals: "HEAVY" },
      context,
    ),
    true,
  );
});

test("absence conditions invert status and inventory checks", () => {
  assert.equal(
    isEventConditionMet(
      { type: "statusEffect", effect: "focused", present: false },
      context,
    ),
    false,
  );
  assert.equal(
    isEventConditionMet(
      { type: "inventoryItem", item: "missing", present: false },
      context,
    ),
    true,
  );
});
