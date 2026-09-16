import type { Hub } from "../../types/hub";
import {
  expectArray,
  expectFiniteNumber,
  expectOptionalBoolean,
  expectOptionalEnum,
  expectOptionalString,
  expectRecord,
  expectString,
  fail,
  validateStringArray,
} from "./validationPrimitives.ts";

const HUB_SCHEMA_VERSIONS = new Set([1]);
const HUB_TAG_TONES = new Set(["cold", "danger", "neutral", "night"]);
const HUB_STAT_TONES = new Set(["safe", "warning", "danger", "cold", "neutral"]);
const LIGHTING_EFFECTS = new Set(["day", "dawn", "dusk", "night", "overcast"]);
const WEATHER_EFFECTS = new Set(["none", "snow", "fog"]);
const WEATHER_INTENSITIES = new Set(["light", "medium", "heavy"]);
const BLEND_MODES = new Set(["normal", "multiply", "screen", "overlay"]);
const NUMERIC_OPERATORS = new Set(["lt", "lte", "eq", "gte", "gt"]);
const CONDITION_TYPES = new Set([
  "playerResource", "playerStat", "statusEffect", "inventoryItem", "hubStat", "scene",
]);
const SCENE_FIELDS = new Set(["lighting", "weather", "weatherIntensity"]);

function validateEventCondition(value: unknown, source: string, field: string): void {
  const condition = expectRecord(value, source, field);
  const type = expectString(condition.type, source, `${field}.type`);
  if (!CONDITION_TYPES.has(type)) {
    fail(source, `"${field}.type" must be one of: ${[...CONDITION_TYPES].join(", ")}.`);
  }
  if (type === "playerResource" || type === "playerStat" || type === "hubStat") {
    const key = type === "playerResource" ? "resource" : "stat";
    expectString(condition[key], source, `${field}.${key}`);
    expectOptionalEnum(condition.operator, NUMERIC_OPERATORS, source, `${field}.operator`);
    if (condition.operator === undefined) fail(source, `"${field}.operator" is required.`);
    expectFiniteNumber(condition.value, source, `${field}.value`);
    return;
  }
  if (type === "inventoryItem") {
    expectString(condition.item, source, `${field}.item`);
    if (condition.quantity !== undefined) {
      const quantity = expectFiniteNumber(condition.quantity, source, `${field}.quantity`);
      if (!Number.isInteger(quantity) || quantity < 1) {
        fail(source, `"${field}.quantity" must be a positive integer.`);
      }
    }
    expectOptionalBoolean(condition.present, source, `${field}.present`);
    return;
  }
  if (type === "statusEffect") {
    expectString(condition.effect, source, `${field}.effect`);
    expectOptionalBoolean(condition.present, source, `${field}.present`);
    return;
  }
  expectOptionalEnum(condition.field, SCENE_FIELDS, source, `${field}.field`);
  if (condition.field === undefined) fail(source, `"${field}.field" is required.`);
  expectString(condition.equals, source, `${field}.equals`);
}

function validateEventPool(value: unknown, source: string, field: string): void {
  const ids = new Set<string>();
  expectArray(value, source, field).forEach((entryValue, index) => {
    const entryField = `${field}[${index}]`;
    const entry = expectRecord(entryValue, source, entryField);
    const id = expectString(entry.id, source, `${entryField}.id`);
    if (ids.has(id)) fail(source, `duplicate pool entry id "${id}" in "${field}".`);
    ids.add(id);
    const weight = expectFiniteNumber(entry.weight, source, `${entryField}.weight`);
    if (weight < 0) fail(source, `"${entryField}.weight" cannot be negative.`);
    expectArray(entry.conditions, source, `${entryField}.conditions`).forEach(
      (condition, conditionIndex) =>
        validateEventCondition(
          condition,
          source,
          `${entryField}.conditions[${conditionIndex}]`,
        ),
    );
    const opens = expectRecord(entry.opens, source, `${entryField}.opens`);
    expectString(opens.eventFile, source, `${entryField}.opens.eventFile`);
    expectString(opens.nodeId, source, `${entryField}.opens.nodeId`);
  });
}

function validateHubScene(value: unknown, source: string): void {
  const scene = expectRecord(value, source, "scene");
  ["image", "focalPoint", "timeOfDay", "weather", "temperature", "tone"].forEach(
    (field) => expectOptionalString(scene[field], source, `scene.${field}`),
  );
  expectOptionalEnum(scene.tone, LIGHTING_EFFECTS, source, "scene.tone");
  if (scene.labels !== undefined) {
    const labels = expectRecord(scene.labels, source, "scene.labels");
    ["time", "weather", "temperature"].forEach((field) =>
      expectOptionalString(labels[field], source, `scene.labels.${field}`),
    );
  }
  if (scene.effects !== undefined) {
    const effects = expectRecord(scene.effects, source, "scene.effects");
    expectOptionalEnum(effects.lighting, LIGHTING_EFFECTS, source, "scene.effects.lighting");
    expectOptionalEnum(effects.weather, WEATHER_EFFECTS, source, "scene.effects.weather");
    expectOptionalEnum(
      effects.weatherIntensity,
      WEATHER_INTENSITIES,
      source,
      "scene.effects.weatherIntensity",
    );
  }
  if (scene.layers !== undefined) {
    expectArray(scene.layers, source, "scene.layers").forEach((layer, index) => {
      const field = `scene.layers[${index}]`;
      const record = expectRecord(layer, source, field);
      expectString(record.id, source, `${field}.id`);
      expectString(record.image, source, `${field}.image`);
      expectOptionalString(record.focalPoint, source, `${field}.focalPoint`);
      if (record.opacity !== undefined) expectFiniteNumber(record.opacity, source, `${field}.opacity`);
      expectOptionalEnum(record.blendMode, BLEND_MODES, source, `${field}.blendMode`);
    });
  }
}

function validateHubTags(value: unknown, source: string): void {
  expectArray(value, source, "tags").forEach((tag, index) => {
    const field = `tags[${index}]`;
    const record = expectRecord(tag, source, field);
    expectString(record.label, source, `${field}.label`);
    expectOptionalEnum(record.tone, HUB_TAG_TONES, source, `${field}.tone`);
  });
}

function validateHubStats(value: unknown, source: string): void {
  expectArray(value, source, "stats").forEach((stat, index) => {
    const field = `stats[${index}]`;
    const record = expectRecord(stat, source, field);
    expectString(record.label, source, `${field}.label`);
    expectString(record.value, source, `${field}.value`);
    expectFiniteNumber(record.percent, source, `${field}.percent`);
    expectOptionalEnum(record.tone, HUB_STAT_TONES, source, `${field}.tone`);
  });
}

export function parseHub(value: unknown, source: string): Hub {
  const hub = expectRecord(value, source, "document");
  const version = expectFiniteNumber(hub.schemaVersion, source, "schemaVersion");
  if (!HUB_SCHEMA_VERSIONS.has(version)) fail(source, `unsupported hub schema version ${version}.`);
  if (hub.type !== "hub") fail(source, '"type" must be "hub".');
  expectString(hub.id, source, "id");
  expectString(hub.name, source, "name");
  expectString(hub.image, source, "image");
  expectOptionalString(hub.background, source, "background");
  expectOptionalString(hub.description, source, "description");
  if (hub.ambient !== undefined) validateStringArray(hub.ambient, source, "ambient");
  if (hub.tags !== undefined) validateHubTags(hub.tags, source);
  if (hub.stats !== undefined) validateHubStats(hub.stats, source);
  if (hub.scene !== undefined) validateHubScene(hub.scene, source);
  const pools = expectRecord(hub.eventPools, source, "eventPools");
  validateEventPool(pools.life, source, "eventPools.life");
  validateEventPool(pools.explore, source, "eventPools.explore");
  validateEventPool(pools.special, source, "eventPools.special");
  return hub as Hub;
}
