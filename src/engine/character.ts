import { CHARACTER_CATALOG as catalog } from "../data/characterCatalog.ts";
import type { CharacterCondition, CharacterData, CharacterEffect, Modifier } from "../types/character";
import type { PlayerState, PlayerStatusEffect, AppliedCharacterEffect } from "../types/player";

export function createCharacterData(): CharacterData {
  return {
    id: "the-exile", background: "An exile finding their place in the Snowlands",
    appearance: { portrait: "exile_soft_portrait.png", description: "A traveller weathered by the northern roads." },
    skills: { medicine: 3, persuasion: 3, lore: 3 }, feats: {},
    progression: { experience: 0, level: 1, points: 1 },
    quests: {}, flags: Object.fromEntries(Object.entries(catalog.flags).map(([id, definition]) => [id, definition.default])),
    reputation: { village: 0 }, relationships: { mara: 0 }, discoveries: [],
    instances: { "starter-coat": { id: "starter-coat", definitionId: "traveller_coat", durability: 100 } },
    equipment: {}, claimedRewards: [], turns: 0,
  };
}

export function createStatus(id: string, turns?: number): PlayerStatusEffect {
  const definition = catalog.statuses[id];
  if (!definition) throw new Error(`Unknown status: ${id}`);
  const remainingTurns = turns ?? definition.turns;
  return { id, name: definition.name, icon: definition.icon, tone: definition.tone,
    effect: definition.description, remainingTurns,
    duration: remainingTurns === null ? "Until treated" : `${remainingTurns} actions remaining` };
}

export function getStatBreakdown(player: PlayerState, stat: string) {
  const base = player.character.skills[stat] ?? player.stats[stat] ?? 0;
  const modifiers: Array<{ source: string; amount: number }> = [];
  function add(source: string, entries: Modifier[], rank = 1) {
    for (const modifier of entries) if (modifier.stat === stat) modifiers.push({ source, amount: modifier.amount * rank });
  }
  for (const [id, rank] of Object.entries(player.character.feats)) {
    const definition = catalog.feats[id];
    if (definition) add(definition.name, definition.modifiers, rank);
  }
  for (const effect of player.effects) {
    const definition = catalog.statuses[effect.id];
    if (definition && effect.remainingTurns !== 0) add(definition.name, definition.modifiers);
  }
  for (const [slot, instanceId] of Object.entries(player.character.equipment)) {
    const instance = player.character.instances[instanceId];
    const definition = instance && catalog.equipment[instance.definitionId];
    if (instance && instance.durability > 0 && definition && isEquipmentSlotCompatible(instance.definitionId, slot)) add(instance.name ?? definition.name, definition.modifiers);
  }
  return { base, modifiers, value: Math.max(0, base + modifiers.reduce((sum, modifier) => sum + modifier.amount, 0)) };
}

export function getEffectiveStats(player: PlayerState): Record<string, number> {
  return Object.fromEntries(Object.keys({ ...player.stats, ...player.character.skills }).map((stat) => [stat, getStatBreakdown(player, stat).value]));
}

export function meetsCharacterCondition(condition: CharacterCondition, player: PlayerState): boolean {
  const data = player.character;
  switch (condition.type) {
    case "feat": return ((data.feats[condition.feat] ?? 0) >= (condition.rank ?? 1)) === (condition.present ?? true);
    case "flag": return (data.flags[condition.flag] ?? catalog.flags[condition.flag]?.default) === condition.equals;
    case "questStage": return ((data.quests[condition.quest]?.stage ?? "unstarted") === condition.stage) === (condition.present ?? true);
    case "questDecision": return data.quests[condition.quest]?.decisions[condition.decision] === condition.equals;
  }
}

export function describeCharacterCondition(condition: CharacterCondition): string {
  switch (condition.type) {
    case "feat": return `${condition.present === false ? "Without " : ""}${catalog.feats[condition.feat]?.name ?? condition.feat} (rank ${condition.rank ?? 1})`;
    case "flag": return `${catalog.flags[condition.flag]?.name ?? condition.flag}: ${condition.equals}`;
    case "questStage": return `${catalog.quests[condition.quest]?.name ?? condition.quest}: ${condition.present === false ? "not " : ""}${catalog.quests[condition.quest]?.stages[condition.stage] ?? condition.stage}`;
    case "questDecision": return catalog.quests[condition.quest]?.decisions[condition.decision]?.values[condition.equals] ?? condition.equals;
  }
}

export function getFeatBlockReason(player: PlayerState, id: string): string | null {
  const feat = catalog.feats[id];
  if (!feat) return "Unknown feat.";
  if ((player.character.feats[id] ?? 0) >= feat.maxRank) return "Maximum rank reached.";
  if (player.character.progression.points < feat.cost) return `Requires ${feat.cost} advancement point.`;
  for (const [stat, minimum] of Object.entries(feat.prerequisites)) {
    if ((player.character.skills[stat] ?? player.stats[stat] ?? 0) < minimum) return `Requires base ${catalog.stats[stat]?.name ?? stat} ${minimum}.`;
  }
  return null;
}

export function learnFeat(player: PlayerState, id: string): PlayerState {
  if (getFeatBlockReason(player, id)) return player;
  const next = structuredClone(player);
  next.character.feats[id] = (next.character.feats[id] ?? 0) + 1;
  next.character.progression.points -= catalog.feats[id]!.cost;
  return next;
}

export function isEquipmentSlotCompatible(definitionId: string, slot: string): boolean {
  const definition = catalog.equipment[definitionId];
  return Boolean(catalog.equipmentSlots[slot] && definition &&
    (definition.slot === slot || (definition.slot === "trinket" && slot === "trinket_2")));
}

export function getEquipmentBlockReason(player: PlayerState, instanceId: string, slot: string): string | null {
  const instance = player.character.instances[instanceId];
  const definition = instance && catalog.equipment[instance.definitionId];
  if (!instance || !definition) return "Item unavailable.";
  if (!isEquipmentSlotCompatible(instance.definitionId, slot)) return "This item does not fit this slot.";
  if (instance.durability <= 0) return "Broken items cannot be equipped.";
  for (const [stat, minimum] of Object.entries(definition.requirements ?? {})) {
    if ((player.character.skills[stat] ?? player.stats[stat] ?? 0) < minimum) return `Requires base ${catalog.stats[stat]?.name ?? stat} ${minimum}.`;
  }
  return null;
}

export function equipItem(player: PlayerState, instanceId: string, targetSlot?: string): PlayerState {
  const instance = player.character.instances[instanceId];
  const definition = instance && catalog.equipment[instance.definitionId];
  const slot = targetSlot ?? definition?.slot ?? "";
  if (getEquipmentBlockReason(player, instanceId, slot) || !definition) return player;
  const equipment = { ...player.character.equipment };
  for (const [key, value] of Object.entries(equipment)) if (value === instanceId) delete equipment[key];
  if (slot === "main_hand" && definition.twoHanded) delete equipment.off_hand;
  const main = player.character.instances[equipment.main_hand ?? ""];
  if (slot === "off_hand" && main && catalog.equipment[main.definitionId]?.twoHanded) delete equipment.main_hand;
  equipment[slot] = instanceId;
  return { ...player, character: { ...player.character, equipment } };
}

export function unequipItem(player: PlayerState, slot: string): PlayerState {
  const equipment = { ...player.character.equipment };
  delete equipment[slot];
  return { ...player, character: { ...player.character, equipment } };
}

export function advanceCharacterTurn(player: PlayerState): PlayerState {
  return { ...player, character: { ...player.character, turns: player.character.turns + 1 },
    effects: player.effects.flatMap((effect) => {
      const remaining = effect.remainingTurns;
      if (remaining == null) return [effect];
      if (remaining <= 1) return [];
      return [{ ...effect, remainingTurns: remaining - 1, duration: `${remaining - 1} actions remaining` }];
    }) };
}

export function applyCharacterEffect(player: PlayerState, effect: CharacterEffect): { player: PlayerState; applied: AppliedCharacterEffect | null } {
  const next = structuredClone(player);
  const data = next.character;
  let name = "";
  let amount = 0;
  switch (effect.type) {
    case "quest": {
      const definition = catalog.quests[effect.quest];
      if (!definition) throw new Error(`Unknown quest: ${effect.quest}`);
      const progress = data.quests[effect.quest] ?? { stage: "unstarted", decisions: {}, objectives: {} };
      if (effect.stage) progress.stage = effect.stage;
      if (effect.decision && effect.value) progress.decisions[effect.decision] = effect.value;
      if (effect.objective) progress.objectives[effect.objective] = true;
      data.quests[effect.quest] = progress;
      name = `${definition.name}: ${definition.stages[progress.stage] ?? progress.stage}`;
      break;
    }
    case "flag": data.flags[effect.flag] = effect.value; name = `${catalog.flags[effect.flag]?.name ?? effect.flag}: ${effect.value}`; break;
    case "experience": {
      const beforeLevel = data.progression.level;
      data.progression.experience = Math.max(0, data.progression.experience + effect.amount);
      data.progression.level = Math.floor(data.progression.experience / 100) + 1;
      data.progression.points += Math.max(0, data.progression.level - beforeLevel);
      amount = effect.amount; name = "Experience"; break;
    }
    case "feat": data.feats[effect.feat] = Math.max(data.feats[effect.feat] ?? 0, Math.min(catalog.feats[effect.feat]?.maxRank ?? 1, effect.rank)); name = `${catalog.feats[effect.feat]?.name ?? effect.feat} acquired`; break;
    case "status":
      next.effects = next.effects.filter((entry) => entry.id !== effect.status);
      if (!effect.remove) next.effects.push(createStatus(effect.status, effect.turns));
      name = `${catalog.statuses[effect.status]?.name ?? effect.status} ${effect.remove ? "removed" : "applied"}`; break;
    case "reputation": {
      const before = data.reputation[effect.faction] ?? 0;
      const definition = catalog.factions[effect.faction];
      data.reputation[effect.faction] = Math.max(definition?.min ?? -100, Math.min(definition?.max ?? 100, before + effect.amount));
      name = `${definition?.name ?? effect.faction} reputation`; amount = (data.reputation[effect.faction] ?? before) - before; break;
    }
    case "relationship": {
      const before = data.relationships[effect.person] ?? 0;
      const definition = catalog.people[effect.person];
      data.relationships[effect.person] = Math.max(definition?.min ?? -100, Math.min(definition?.max ?? 100, before + effect.amount));
      name = `${definition?.name ?? effect.person} relationship`; amount = (data.relationships[effect.person] ?? before) - before; break;
    }
    case "discovery": if (!data.discoveries.includes(effect.discovery)) data.discoveries.push(effect.discovery); name = `Discovered: ${catalog.discoveries[effect.discovery]?.name ?? effect.discovery}`; break;
    case "equipmentItem": {
      const definition = catalog.equipment[effect.item];
      if (!definition) throw new Error(`Unknown equipment: ${effect.item}`);
      if (!data.instances[effect.instanceId]) data.instances[effect.instanceId] = { id: effect.instanceId, definitionId: effect.item, durability: definition.maxDurability };
      name = `${definition.name} acquired`; break;
    }
  }
  if (JSON.stringify(next) === JSON.stringify(player)) return { player, applied: null };
  return { player: next, applied: { type: "character", name, amount, before: 0, after: 0 } };
}

export function trainStat(player: PlayerState, id: string): PlayerState {
  const value = player.character.skills[id] ?? player.stats[id];
  if (value === undefined || !catalog.stats[id] || player.character.progression.points < 1 || value >= 20) return player;
  const next = structuredClone(player);
  if (id in next.character.skills) next.character.skills[id] = value + 1;
  else next.stats[id] = value + 1;
  next.character.progression.points -= 1;
  return next;
}
