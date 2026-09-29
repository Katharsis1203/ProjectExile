import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createDefaultPlayer } from "../src/data/defaultPlayer.ts";
import { CHARACTER_CATALOG as catalog } from "../src/data/characterCatalog.ts";
import { advanceCharacterTurn, equipItem, getEffectiveStats, getFeatBlockReason, getStatBreakdown, learnFeat, meetsCharacterCondition, trainStat, unequipItem } from "../src/engine/character.ts";
import { applyEventEffects, consumeInventoryItem } from "../src/engine/playerState.ts";
import { advanceEventSession, createPassageSession, restorePassage, savePassage } from "../src/engine/eventSession.ts";
import { migratePlayer } from "../src/infrastructure/persistence/playerMigration.ts";
import { parseGameEvent } from "../src/infrastructure/content/eventValidation.ts";
import { parseHub } from "../src/infrastructure/content/hubValidation.ts";
import { areEventConditionsMet } from "../src/engine/eventConditions.ts";
import { validateCharacterEffect } from "../src/infrastructure/content/characterValidation.ts";

async function json(file: string) { return JSON.parse(await readFile(new URL(file, import.meta.url), "utf8")) as unknown; }

test("modifiers compose without changing base stats or accumulating on re-equip", () => {
  const player = createDefaultPlayer();
  const trained = learnFeat(player, "cold_hardened");
  const equipped = equipItem(trained, "starter-coat");
  assert.equal(getEffectiveStats(equipped).endurance, 10);
  assert.equal(equipped.stats.endurance, 8);
  assert.equal(getEffectiveStats(equipItem(equipped, "starter-coat")).endurance, 10);
  assert.equal(getEffectiveStats(unequipItem(equipped, "body")).endurance, 9);
  assert.equal(player.character.progression.points, 1);
  assert.equal(equipped.character.progression.points, 0);
  assert.equal(learnFeat(equipped, "keen_observer"), equipped);
  assert.ok(getFeatBlockReason(equipped, "cold_hardened"));
  assert.equal(getStatBreakdown(equipped, "survival").value, 6);
});

test("training spends a point once and ignores unknown skills", () => {
  const player = createDefaultPlayer();
  const next = trainStat(player, "medicine");
  assert.equal(next.character.skills.medicine, 4);
  assert.equal(next.character.progression.points, 0);
  assert.equal(trainStat(next, "medicine"), next);
  assert.equal(trainStat(player, "invented"), player);
});

test("status timers expire by actions, bandages remove wounds, refreshed statuses never stack", () => {
  let player = createDefaultPlayer();
  assert.equal(getEffectiveStats(player).perception, 9);
  for (let i = 0; i < 4; i++) player = advanceCharacterTurn(player);
  assert.equal(getEffectiveStats(player).perception, 8);
  player = consumeInventoryItem(player, "bandage").player;
  assert.equal(player.effects.some((e) => e.id === "minor_wound"), false);
  const applied = applyEventEffects(player, [{ type: "status", status: "focused", turns: 2 }, { type: "status", status: "focused", turns: 3 }]);
  assert.equal(applied.player.effects.filter((e) => e.id === "focused").length, 1);
  assert.equal(getEffectiveStats(applied.player).perception, 9);
});

test("legacy player migration preserves resources, inventory and stats and creates isolated character records", () => {
  const old = createDefaultPlayer();
  const { character: _character, ...legacy } = old;
  void _character;
  legacy.stats.strength = 12;
  legacy.inventory.rope = 3;
  const migrated = migratePlayer(legacy, 1);
  assert.equal(migrated.stats.strength, 12);
  assert.equal(migrated.inventory.rope, 3);
  assert.equal(migrated.resources[0]?.value, 82);
  assert.deepEqual(migratePlayer(migrated, 2), migrated);
  migrated.character.feats.keen_observer = 1;
  assert.deepEqual(migratePlayer(legacy, 1).character.feats, {});
  assert.throws(() => migratePlayer({ ...legacy, inventory: { rope: -1 } }, 1));
  assert.throws(() => migratePlayer({ ...old, character: { ...old.character, equipment: { body: "missing" } } }, 2));
});

test("ledger quest ties item requirements, checks, decisions, rewards and a later encounter together", async () => {
  const event = parseGameEvent(await json("../public/data/events/missing_ledger.json"), "ledger");
  const hub = parseHub(await json("../public/data/hubs/snowlands_hub.json"), "hub");
  let player = createDefaultPlayer();
  let session = createPassageSession(event.nodes.start!);
  const choose = (text: string) => {
    const choice = session.node.choices.find((entry) => entry.text === text);
    assert.ok(choice, text);
    const outcome = advanceEventSession({ event, session, choice, player, random: () => 0.999 });
    assert.notEqual(outcome.kind, "blocked");
    player = outcome.player; session = outcome.session;
    return outcome;
  };
  const ropeChoice = session.node.choices.find((c) => c.text.includes("rope"))!;
  const noRope = { ...player, inventory: {} };
  assert.equal(advanceEventSession({ event, session, choice: ropeChoice, player: noRope }).kind, "blocked");
  choose("Use your rope to reach behind the stove");
  assert.equal(player.inventory.missing_ledger, 1);
  assert.equal(player.character.quests.missing_ledger?.objectives.ledger_recovered, true);
  choose("Give it to Mara and mention the cloth");
  assert.equal(player.inventory.missing_ledger, undefined);
  choose("Return to the hub");
  assert.equal(player.character.progression.level, 2);
  assert.equal(player.character.progression.points, 2);
  assert.equal(player.inventory.winter_scrip, 4);
  assert.equal(player.character.flags["story.mara_trust"], "trusted");
  assert.ok(player.character.instances["mara-ledger-charm"]);
  assert.equal(meetsCharacterCondition({ type: "questDecision", quest: "missing_ledger", decision: "ledger_destination", equals: "returned" }, player), true);
  const restored = restorePassage(event, savePassage(session));
  assert.ok(restored);
  const repeated = advanceEventSession({ event, session: restored, choice: event.nodes.return!.choices[0]!, player });
  assert.equal(repeated.player, player);
  const replayed = advanceEventSession({ event, session: createPassageSession(event.nodes.return!), choice: event.nodes.return!.choices[0]!, player });
  assert.equal(replayed.player.inventory.winter_scrip, 4);
  assert.equal(replayed.player.character.progression.experience, 100);
  const eligible = hub.eventPools.life.filter((entry) => areEventConditionsMet(entry.conditions, { player, hub }));
  assert.ok(eligible.some((entry) => entry.id === "mara_followup_trusted"));
  assert.ok(!eligible.some((entry) => entry.id === "missing_ledger_entry" || entry.id === "mara_followup_broken"));
});

test("invalid destinations do not consume items, grant experience or advance time", () => {
  const node = { id: "start", title: "Start", text: "Start", choices: [] };
  const player = createDefaultPlayer();
  const result = advanceEventSession({ event: { id: "test", name: "Test", schemaVersion: 2, type: "event", nodes: { start: node } }, session: createPassageSession(node), player,
    choice: { type: "simple", text: "Broken", next: "missing", effects: [{ type: "item", item: "rope", amount: -1 }, { type: "experience", amount: 100 }] } });
  assert.equal(result.kind, "invalid-target");
  assert.equal(result.player, player);
});

test("catalog references and quest decisions are validated", () => {
  for (const definition of [...Object.values(catalog.feats), ...Object.values(catalog.statuses), ...Object.values(catalog.equipment)]) {
    for (const modifier of definition.modifiers) { assert.ok(catalog.stats[modifier.stat]); assert.ok(Number.isFinite(modifier.amount)); }
  }
  for (const feat of Object.values(catalog.feats)) {
    assert.ok(feat.cost >= 1 && Number.isInteger(feat.cost));
    assert.ok(feat.maxRank >= 1 && Number.isInteger(feat.maxRank));
    for (const stat of Object.keys(feat.prerequisites)) assert.ok(catalog.stats[stat]);
  }
  assert.throws(() => validateCharacterEffect({ type: "quest", quest: "missing_ledger", decision: "ledger_destination", value: "typo" }, "test", "effect"));
  assert.throws(() => validateCharacterEffect({ type: "flag", flag: "story.mara_trust", value: true }, "test", "effect"));
});

test("equipment swaps preserve ownership and accessory moves never duplicate bonuses", () => {
  let player = createDefaultPlayer();
  player.character.instances.charm = { id: "charm", definitionId: "scouting_charm", durability: 100 };
  player.character.instances.coat2 = { id: "coat2", definitionId: "traveller_coat", durability: 50 };
  player = equipItem(equipItem(player, "starter-coat"), "coat2");
  assert.equal(player.character.equipment.body, "coat2");
  assert.ok(player.character.instances["starter-coat"]);
  assert.equal(getEffectiveStats(player).endurance, 9);
  player = equipItem(equipItem(player, "charm"), "charm", "trinket_2");
  assert.equal(player.character.equipment.trinket, undefined);
  assert.equal(player.character.equipment.trinket_2, "charm");
  assert.equal(getEffectiveStats(player).perception, 10);
  assert.deepEqual(migratePlayer(player, 2), player);
  assert.equal(equipItem(player, "charm", "body"), player);
  assert.equal(equipItem(player, "missing"), player);
  player.character.instances.charm!.durability = 0;
  assert.equal(equipItem(player, "charm"), player);
  assert.equal(getEffectiveStats(player).perception, 9);
  const duplicate = structuredClone(player);
  duplicate.character.equipment.trinket = "charm";
  assert.throws(() => migratePlayer(duplicate, 2));
});

test("two-handed swaps clear conflicting slots and enforce base requirements", () => {
  catalog.equipment.test_staff = { name: "Staff", description: "Test", slot: "main_hand", twoHanded: true, maxDurability: 100, modifiers: [], requirements: { strength: 7 } };
  catalog.equipment.test_shield = { name: "Shield", description: "Test", slot: "off_hand", maxDurability: 100, modifiers: [] };
  try {
    let player = createDefaultPlayer();
    player.character.instances.staff = { id: "staff", definitionId: "test_staff", durability: 100 };
    player.character.instances.shield = { id: "shield", definitionId: "test_shield", durability: 100 };
    player = equipItem(equipItem(player, "shield"), "staff");
    assert.equal(player.character.equipment.off_hand, undefined);
    assert.equal(player.character.equipment.main_hand, "staff");
    const invalid = structuredClone(player);
    invalid.character.equipment.off_hand = "shield";
    assert.throws(() => migratePlayer(invalid, 2));
    player = equipItem(player, "shield");
    assert.equal(player.character.equipment.main_hand, undefined);
    assert.equal(player.character.equipment.off_hand, "shield");
    player.stats.strength = 6;
    assert.equal(equipItem(player, "staff"), player);
    assert.ok(player.character.instances.staff);
  } finally { delete catalog.equipment.test_staff; delete catalog.equipment.test_shield; }
});
