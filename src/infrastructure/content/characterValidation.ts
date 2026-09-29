import { CHARACTER_CATALOG as catalog } from "../../data/characterCatalog.ts";
import { expectRecord, expectString, expectFiniteNumber, fail } from "./validationPrimitives.ts";

function known(table: Record<string, unknown>, value: unknown, source: string, field: string): string {
  const id = expectString(value, source, field);
  if (!Object.hasOwn(table, id)) fail(source, `Unknown ${field}: ${id}`);
  return id;
}
function flagValue(id: string, value: unknown, source: string) {
  const definition = catalog.flags[id]!;
  if (typeof value !== definition.type || (definition.values && !definition.values.includes(String(value))) || (typeof value === "number" && !Number.isFinite(value))) fail(source, `Invalid value for flag ${id}`);
}
export function validateCharacterCondition(value: unknown, source: string, field: string): void {
  const c = expectRecord(value, source, field);
  if (c.type === "feat") {
    const id = known(catalog.feats, c.feat, source, `${field}.feat`);
    if (c.rank !== undefined && (typeof c.rank !== "number" || !Number.isInteger(c.rank) || c.rank < 1 || c.rank > catalog.feats[id]!.maxRank)) fail(source, `Invalid feat rank in ${field}`);
  } else if (c.type === "flag") {
    flagValue(known(catalog.flags, c.flag, source, `${field}.flag`), c.equals, source);
  } else if (c.type === "questStage") {
    const id = known(catalog.quests, c.quest, source, `${field}.quest`);
    known(catalog.quests[id]!.stages, c.stage, source, `${field}.stage`);
  } else if (c.type === "questDecision") {
    const id = known(catalog.quests, c.quest, source, `${field}.quest`);
    const key = known(catalog.quests[id]!.decisions, c.decision, source, `${field}.decision`);
    known(catalog.quests[id]!.decisions[key]!.values, c.equals, source, `${field}.equals`);
  } else fail(source, `Unknown character condition in ${field}`);
  if (c.present !== undefined && typeof c.present !== "boolean") fail(source, `Invalid presence in ${field}`);
}
export function validateCharacterEffect(value: unknown, source: string, field: string): void {
  const e = expectRecord(value, source, field);
  switch (e.type) {
    case "quest": {
      const id = known(catalog.quests, e.quest, source, `${field}.quest`);
      const definition = catalog.quests[id]!;
      if (e.stage !== undefined) known(definition.stages, e.stage, source, `${field}.stage`);
      if (e.objective !== undefined) known(definition.objectives, e.objective, source, `${field}.objective`);
      if (e.decision !== undefined || e.value !== undefined) {
        const key = known(definition.decisions, e.decision, source, `${field}.decision`);
        known(definition.decisions[key]!.values, e.value, source, `${field}.value`);
      }
      if (e.stage === undefined && e.objective === undefined && e.decision === undefined) fail(source, `Empty quest effect in ${field}`);
      return;
    }
    case "flag": flagValue(known(catalog.flags, e.flag, source, `${field}.flag`), e.value, source); return;
    case "experience": {
      const amount = expectFiniteNumber(e.amount, source, `${field}.amount`);
      if (!Number.isInteger(amount) || amount < 0) fail(source, `Invalid experience in ${field}`); return;
    }
    case "feat": {
      const id = known(catalog.feats, e.feat, source, `${field}.feat`);
      if (typeof e.rank !== "number" || !Number.isInteger(e.rank) || e.rank < 1 || e.rank > catalog.feats[id]!.maxRank) fail(source, `Invalid feat rank in ${field}`); return;
    }
    case "status":
      known(catalog.statuses, e.status, source, `${field}.status`);
      if (e.remove !== undefined && typeof e.remove !== "boolean") fail(source, `Invalid status removal in ${field}`);
      if (e.turns !== undefined && (typeof e.turns !== "number" || !Number.isInteger(e.turns) || e.turns < 1)) fail(source, `Invalid status duration in ${field}`); return;
    case "reputation": known(catalog.factions, e.faction, source, `${field}.faction`); expectFiniteNumber(e.amount, source, `${field}.amount`); return;
    case "relationship": known(catalog.people, e.person, source, `${field}.person`); expectFiniteNumber(e.amount, source, `${field}.amount`); return;
    case "discovery": known(catalog.discoveries, e.discovery, source, `${field}.discovery`); return;
    case "equipmentItem": known(catalog.equipment, e.item, source, `${field}.item`); expectString(e.instanceId, source, `${field}.instanceId`); return;
    default: fail(source, `Unknown effect type in ${field}`);
  }
}
