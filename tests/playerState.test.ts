import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultPlayer } from "../src/data/defaultPlayer.ts";
import {
  applyEventEffects,
  consumeInventoryItem,
  discardInventoryItem,
} from "../src/engine/playerState.ts";

test("event effects clamp resources and apply integer inventory changes immutably", () => {
  const player = createDefaultPlayer();
  const result = applyEventEffects(player, [
    { type: "resource", resource: "health", amount: 100 },
    { type: "item", item: "rope", amount: -1 },
    { type: "item", item: "winter_scrip", amount: 3 },
  ]);

  assert.notEqual(result.player, player);
  assert.equal(player.resources.find((resource) => resource.id === "health")?.value, 82);
  assert.equal(result.player.resources.find((resource) => resource.id === "health")?.value, 100);
  assert.equal(result.player.inventory.rope, undefined);
  assert.equal(result.player.inventory.winter_scrip, 3);
  assert.deepEqual(
    result.appliedEffects.map((effect) => effect.amount),
    [18, -1, 3],
  );
});

test("consuming an item spends one copy and applies its configured effects", () => {
  const player = createDefaultPlayer();
  player.resources = player.resources.map((resource) =>
    resource.id === "health" ? { ...resource, value: 50 } : resource,
  );

  const result = consumeInventoryItem(player, "bandage");

  assert.equal(result.player.inventory.bandage, undefined);
  assert.equal(result.player.resources.find((resource) => resource.id === "health")?.value, 62);
});

test("non-discardable items are preserved", () => {
  const player = createDefaultPlayer();
  player.inventory.drowned_bell = 1;

  const result = discardInventoryItem(player, "drowned_bell");

  assert.equal(result.player, player);
  assert.deepEqual(result.appliedEffects, []);
});
