import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVITY_ENERGY_RECHARGE_MS } from "../src/data/activityEnergyConfig.ts";
import {
  createFullActivityEnergy,
  recoverActivityEnergy,
  spendActivityEnergy,
} from "../src/engine/activityEnergy.ts";

test("activity energy spends once and begins a recharge window", () => {
  const now = 10_000;
  const result = spendActivityEnergy(createFullActivityEnergy(), 1, now);

  assert.equal(result.spent, true);
  assert.deepEqual(result.state, {
    value: 59,
    nextRechargeAt: now + ACTIVITY_ENERGY_RECHARGE_MS,
  });
});

test("activity energy recovers elapsed intervals and clears a full timer", () => {
  const firstRechargeAt = 20_000;
  const recovered = recoverActivityEnergy(
    { value: 58, nextRechargeAt: firstRechargeAt },
    firstRechargeAt + ACTIVITY_ENERGY_RECHARGE_MS,
  );

  assert.deepEqual(recovered, { value: 60, nextRechargeAt: null });
});

test("activity energy refuses a cost above the available value", () => {
  const result = spendActivityEnergy(
    { value: 1, nextRechargeAt: 50_000 },
    2,
    40_000,
  );

  assert.equal(result.spent, false);
  assert.deepEqual(result.state, { value: 1, nextRechargeAt: 50_000 });
});
