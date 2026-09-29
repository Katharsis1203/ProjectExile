import { createCharacterData, createStatus, isEquipmentSlotCompatible } from "../../engine/character.ts";
import type { PlayerState } from "../../types/player";
import { CHARACTER_CATALOG as catalog } from "../../data/characterCatalog.ts";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid character record");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => ["__proto__", "constructor", "prototype"].includes(key))) throw new Error("Invalid character key");
  return result;
}
function numericMap(value: unknown, nonNegative = false) {
  for (const number of Object.values(record(value))) if (typeof number !== "number" || !Number.isFinite(number) || (nonNegative && number < 0)) throw new Error("Invalid character number");
}
function stringMap(value: unknown) { if (Object.values(record(value)).some((v) => typeof v !== "string")) throw new Error("Invalid character text"); }
function stringList(value: unknown) { if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) throw new Error("Invalid character list"); }

export function migratePlayer(value: unknown, version: 1 | 2): PlayerState {
  const raw = record(value);
  if (typeof raw.name !== "string" || typeof raw.title !== "string") throw new Error("Invalid identity");
  numericMap(raw.stats, true); numericMap(raw.inventory, true);
  if (Object.values(record(raw.inventory)).some((v) => !Number.isInteger(v))) throw new Error("Invalid item quantity");
  if (!Array.isArray(raw.resources) || !Array.isArray(raw.effects)) throw new Error("Invalid resources or effects");
  for (const resource of raw.resources) {
    const r = record(resource);
    if (typeof r.id !== "string" || typeof r.label !== "string" || !["health", "mana", "stamina", "hunger"].includes(String(r.tone)) ||
      typeof r.value !== "number" || !Number.isFinite(r.value) || typeof r.max !== "number" || !Number.isFinite(r.max) || r.max < 0 || r.value < 0 || r.value > r.max) throw new Error("Invalid resource");
  }
  for (const effect of raw.effects) {
    const e = record(effect);
    for (const key of ["id", "name", "icon", "duration", "effect"]) if (typeof e[key] !== "string") throw new Error("Invalid status");
    if (e.remainingTurns !== undefined && e.remainingTurns !== null && (typeof e.remainingTurns !== "number" || !Number.isInteger(e.remainingTurns) || e.remainingTurns < 0)) throw new Error("Invalid status duration");
  }
  const player = structuredClone(raw) as unknown as PlayerState;
  if (version === 1) {
    player.character = createCharacterData();
    player.effects = player.effects.map((e) => catalog.statuses[e.id] ? createStatus(e.id) : e);
    return player;
  }
  const data = record(raw.character);
  for (const field of ["id", "background"]) if (typeof data[field] !== "string") throw new Error("Invalid identity");
  stringMap(data.appearance);
  const appearance = record(data.appearance);
  if (typeof appearance.portrait !== "string" || typeof appearance.description !== "string") throw new Error("Invalid appearance");
  numericMap(data.skills, true); numericMap(data.feats, true); numericMap(data.reputation); numericMap(data.relationships);
  const progression = record(data.progression);
  for (const field of ["experience", "level", "points"]) if (typeof progression[field] !== "number" || !Number.isInteger(progression[field]) || progression[field] < (field === "level" ? 1 : 0)) throw new Error("Invalid progression");
  if (progression.level !== Math.floor((progression.experience as number) / 100) + 1) throw new Error("Invalid level");
  for (const [id, rank] of Object.entries(record(data.feats))) if (!catalog.feats[id] || typeof rank !== "number" || !Number.isInteger(rank) || rank > catalog.feats[id].maxRank) throw new Error("Invalid feat");
  for (const [id, value] of Object.entries(record(data.flags))) {
    const definition = catalog.flags[id];
    if (!definition || typeof value !== definition.type || (definition.values && !definition.values.includes(String(value))) || (typeof value === "number" && !Number.isFinite(value))) throw new Error("Invalid flag");
  }
  for (const [id, value] of Object.entries(record(data.quests))) {
    const quest = record(value); const definition = catalog.quests[id];
    if (!definition || typeof quest.stage !== "string" || !definition.stages[quest.stage]) throw new Error("Invalid quest");
    stringMap(quest.decisions);
    for (const [key, decision] of Object.entries(record(quest.decisions))) if (!definition.decisions[key]?.values[decision as string]) throw new Error("Invalid decision");
    for (const [key, completed] of Object.entries(record(quest.objectives))) if (!definition.objectives[key] || typeof completed !== "boolean") throw new Error("Invalid objective");
  }
  stringList(data.discoveries); stringList(data.claimedRewards); stringMap(data.equipment);
  const instances = record(data.instances);
  for (const [key, value] of Object.entries(instances)) {
    const item = record(value); const definition = catalog.equipment[String(item.definitionId)];
    if (item.id !== key || !definition || typeof item.durability !== "number" || !Number.isFinite(item.durability) || item.durability < 0 || item.durability > definition.maxDurability) throw new Error("Invalid equipment");
  }
  for (const [slot, id] of Object.entries(record(data.equipment))) {
    const item = record(instances[id as string]);
    if (!isEquipmentSlotCompatible(String(item.definitionId), slot)) throw new Error("Invalid equipment slot");
  }
  const equipped = Object.values(record(data.equipment));
  if (new Set(equipped).size !== equipped.length) throw new Error("Duplicate equipped item");
  const mainId = record(data.equipment).main_hand;
  if (typeof mainId === "string" && record(data.equipment).off_hand && catalog.equipment[String(record(instances[mainId]).definitionId)]?.twoHanded) throw new Error("Conflicting hand slots");
  if (typeof data.turns !== "number" || !Number.isInteger(data.turns) || data.turns < 0) throw new Error("Invalid elapsed actions");
  return player;
}
