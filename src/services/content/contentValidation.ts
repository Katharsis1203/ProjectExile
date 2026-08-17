import type { EventChoice, EventNode, GameEvent } from "../../types/event";
import type { EventPoolEntry, Hub, LoadedHub } from "../../types/hub";

type UnknownRecord = Record<string, unknown>;

const EVENT_SCHEMA_VERSIONS = new Set([1, 2]);
const HUB_SCHEMA_VERSIONS = new Set([1]);
const HUB_TAG_TONES = new Set(["cold", "danger", "neutral", "night"]);
const HUB_STAT_TONES = new Set([
  "safe",
  "warning",
  "danger",
  "cold",
  "neutral",
]);
const LIGHTING_EFFECTS = new Set([
  "day",
  "dawn",
  "dusk",
  "night",
  "overcast",
]);
const WEATHER_EFFECTS = new Set(["none", "snow", "fog"]);
const WEATHER_INTENSITIES = new Set(["light", "medium", "heavy"]);
const BLEND_MODES = new Set(["normal", "multiply", "screen", "overlay"]);

export class ContentValidationError extends Error {
  constructor(source: string, message: string) {
    super(`Invalid content in ${source}: ${message}`);
    this.name = "ContentValidationError";
  }
}

function fail(source: string, message: string): never {
  throw new ContentValidationError(source, message);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectRecord(
  value: unknown,
  source: string,
  field: string,
): UnknownRecord {
  return isRecord(value) ? value : fail(source, `"${field}" must be an object.`);
}

function expectArray(
  value: unknown,
  source: string,
  field: string,
): unknown[] {
  return Array.isArray(value)
    ? value
    : fail(source, `"${field}" must be an array.`);
}

function expectString(
  value: unknown,
  source: string,
  field: string,
): string {
  return typeof value === "string" && value.length > 0
    ? value
    : fail(source, `"${field}" must be a non-empty string.`);
}

function expectFiniteNumber(
  value: unknown,
  source: string,
  field: string,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fail(source, `"${field}" must be a finite number.`);
}

function expectOptionalString(
  value: unknown,
  source: string,
  field: string,
): void {
  if (value !== undefined && value !== null && typeof value !== "string") {
    fail(source, `"${field}" must be a string or null when provided.`);
  }
}

function expectOptionalBoolean(
  value: unknown,
  source: string,
  field: string,
): void {
  if (value !== undefined && typeof value !== "boolean") {
    fail(source, `"${field}" must be a boolean when provided.`);
  }
}

function expectOptionalEnum(
  value: unknown,
  supportedValues: ReadonlySet<string>,
  source: string,
  field: string,
): void {
  if (
    value !== undefined &&
    (typeof value !== "string" || !supportedValues.has(value))
  ) {
    fail(
      source,
      `"${field}" must be one of: ${[...supportedValues].join(", ")}.`,
    );
  }
}

function validateStringArray(
  value: unknown,
  source: string,
  field: string,
): void {
  const items = expectArray(value, source, field);

  items.forEach((item, index) => {
    expectString(item, source, `${field}[${index}]`);
  });
}

function validateStatChecks(
  value: unknown,
  source: string,
  field: string,
): void {
  const checks = expectArray(value, source, field);

  checks.forEach((check, index) => {
    const checkField = `${field}[${index}]`;
    const checkRecord = expectRecord(check, source, checkField);
    expectString(checkRecord.stat, source, `${checkField}.stat`);
    expectFiniteNumber(
      checkRecord.difficulty,
      source,
      `${checkField}.difficulty`,
    );
  });
}

function validateThresholdOutcome(
  value: unknown,
  source: string,
  field: string,
): void {
  const outcome = expectRecord(value, source, field);
  const buckets = expectArray(outcome.buckets, source, `${field}.buckets`);
  const bucketIds = new Set<string>();

  buckets.forEach((bucket, index) => {
    const bucketField = `${field}.buckets[${index}]`;
    const bucketRecord = expectRecord(bucket, source, bucketField);
    const id = expectString(bucketRecord.id, source, `${bucketField}.id`);

    if (bucketIds.has(id)) {
      fail(source, `duplicate outcome bucket id "${id}" in "${field}".`);
    }

    bucketIds.add(id);
    expectFiniteNumber(
      bucketRecord.threshold,
      source,
      `${bucketField}.threshold`,
    );
    expectOptionalString(
      bucketRecord.flavourText,
      source,
      `${bucketField}.flavourText`,
    );
    expectString(bucketRecord.next, source, `${bucketField}.next`);
  });
}

function validateChoice(
  value: unknown,
  source: string,
  field: string,
): void {
  const choice = expectRecord(value, source, field);
  const type = expectString(choice.type, source, `${field}.type`);

  if (type !== "simple" && type !== "checked") {
    fail(source, `"${field}.type" must be "simple" or "checked".`);
  }

  expectString(choice.text, source, `${field}.text`);
  expectOptionalString(choice.next, source, `${field}.next`);
  expectOptionalBoolean(choice.returnToHub, source, `${field}.returnToHub`);
  expectOptionalBoolean(choice.endEvent, source, `${field}.endEvent`);

  if (type === "checked") {
    validateStatChecks(choice.statChecks, source, `${field}.statChecks`);

    if (choice.weighted !== undefined) {
      validateThresholdOutcome(choice.weighted, source, `${field}.weighted`);
    }
  }
}

function validateNode(
  value: unknown,
  source: string,
  nodeKey: string,
): void {
  const field = `nodes.${nodeKey}`;
  const node = expectRecord(value, source, field);
  const id = expectString(node.id, source, `${field}.id`);

  if (id !== nodeKey) {
    fail(source, `node key "${nodeKey}" does not match its id "${id}".`);
  }

  expectString(node.title, source, `${field}.title`);
  expectString(node.text, source, `${field}.text`);
  expectOptionalString(node.image, source, `${field}.image`);
  expectOptionalString(node.background, source, `${field}.background`);
  expectOptionalString(node.miscText, source, `${field}.miscText`);

  expectArray(node.choices, source, `${field}.choices`).forEach(
    (choice, index) => validateChoice(choice, source, `${field}.choices[${index}]`),
  );
}

function normaliseNodes(
  value: unknown,
  source: string,
): Record<string, EventNode> {
  if (Array.isArray(value)) {
    const nodes: Record<string, EventNode> = {};

    value.forEach((node, index) => {
      const nodeRecord = expectRecord(node, source, `nodes[${index}]`);
      const id = expectString(nodeRecord.id, source, `nodes[${index}].id`);

      if (nodes[id]) {
        fail(source, `duplicate node id "${id}".`);
      }

      validateNode(node, source, id);
      nodes[id] = node as EventNode;
    });

    return nodes;
  }

  const nodeRecord = expectRecord(value, source, "nodes");

  Object.entries(nodeRecord).forEach(([nodeKey, node]) => {
    validateNode(node, source, nodeKey);
  });

  return nodeRecord as Record<string, EventNode>;
}

export function parseGameEvent(value: unknown, source: string): GameEvent {
  const event = expectRecord(value, source, "document");
  const schemaVersion = expectFiniteNumber(
    event.schemaVersion,
    source,
    "schemaVersion",
  );

  if (!EVENT_SCHEMA_VERSIONS.has(schemaVersion)) {
    fail(source, `unsupported event schema version ${schemaVersion}.`);
  }

  if (event.type !== "event") {
    fail(source, '"type" must be "event".');
  }

  expectString(event.id, source, "id");
  expectString(event.name, source, "name");
  expectOptionalString(event.cardImage, source, "cardImage");
  expectOptionalString(event.cardColourImage, source, "cardColourImage");

  if (event.tags !== undefined) {
    validateStringArray(event.tags, source, "tags");
  }

  const nodes = normaliseNodes(event.nodes, source);

  return { ...event, nodes } as GameEvent;
}

function validateEventPoolEntry(
  value: unknown,
  source: string,
  field: string,
): void {
  const entry = expectRecord(value, source, field);
  expectString(entry.id, source, `${field}.id`);
  const weight = expectFiniteNumber(entry.weight, source, `${field}.weight`);

  if (weight < 0) {
    fail(source, `"${field}.weight" cannot be negative.`);
  }

  expectArray(entry.conditions, source, `${field}.conditions`);
  const opens = expectRecord(entry.opens, source, `${field}.opens`);
  expectString(opens.eventFile, source, `${field}.opens.eventFile`);
  expectString(opens.nodeId, source, `${field}.opens.nodeId`);
}

function validateEventPool(
  value: unknown,
  source: string,
  field: string,
): void {
  const entries = expectArray(value, source, field);
  const entryIds = new Set<string>();

  entries.forEach((entry, index) => {
    const entryField = `${field}[${index}]`;
    validateEventPoolEntry(entry, source, entryField);
    const id = (entry as EventPoolEntry).id;

    if (entryIds.has(id)) {
      fail(source, `duplicate pool entry id "${id}" in "${field}".`);
    }

    entryIds.add(id);
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
    expectOptionalEnum(
      effects.lighting,
      LIGHTING_EFFECTS,
      source,
      "scene.effects.lighting",
    );
    expectOptionalEnum(
      effects.weather,
      WEATHER_EFFECTS,
      source,
      "scene.effects.weather",
    );
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
      const layerRecord = expectRecord(layer, source, field);
      expectString(layerRecord.id, source, `${field}.id`);
      expectString(layerRecord.image, source, `${field}.image`);
      expectOptionalString(layerRecord.focalPoint, source, `${field}.focalPoint`);

      if (layerRecord.opacity !== undefined) {
        expectFiniteNumber(layerRecord.opacity, source, `${field}.opacity`);
      }

      expectOptionalEnum(
        layerRecord.blendMode,
        BLEND_MODES,
        source,
        `${field}.blendMode`,
      );
    });
  }
}

function validateHubTags(value: unknown, source: string): void {
  expectArray(value, source, "tags").forEach((tag, index) => {
    const field = `tags[${index}]`;
    const tagRecord = expectRecord(tag, source, field);
    expectString(tagRecord.label, source, `${field}.label`);
    expectOptionalEnum(tagRecord.tone, HUB_TAG_TONES, source, `${field}.tone`);
  });
}

function validateHubStats(value: unknown, source: string): void {
  expectArray(value, source, "stats").forEach((stat, index) => {
    const field = `stats[${index}]`;
    const statRecord = expectRecord(stat, source, field);
    expectString(statRecord.label, source, `${field}.label`);
    expectString(statRecord.value, source, `${field}.value`);
    expectFiniteNumber(statRecord.percent, source, `${field}.percent`);
    expectOptionalEnum(
      statRecord.tone,
      HUB_STAT_TONES,
      source,
      `${field}.tone`,
    );
  });
}

export function parseHub(value: unknown, source: string): Hub {
  const hub = expectRecord(value, source, "document");
  const schemaVersion = expectFiniteNumber(
    hub.schemaVersion,
    source,
    "schemaVersion",
  );

  if (!HUB_SCHEMA_VERSIONS.has(schemaVersion)) {
    fail(source, `unsupported hub schema version ${schemaVersion}.`);
  }

  if (hub.type !== "hub") {
    fail(source, '"type" must be "hub".');
  }

  expectString(hub.id, source, "id");
  expectString(hub.name, source, "name");
  expectString(hub.image, source, "image");
  expectOptionalString(hub.background, source, "background");
  expectOptionalString(hub.description, source, "description");

  if (hub.ambient !== undefined) {
    validateStringArray(hub.ambient, source, "ambient");
  }

  if (hub.tags !== undefined) {
    validateHubTags(hub.tags, source);
  }

  if (hub.stats !== undefined) {
    validateHubStats(hub.stats, source);
  }

  if (hub.scene !== undefined) {
    validateHubScene(hub.scene, source);
  }

  const eventPools = expectRecord(hub.eventPools, source, "eventPools");
  validateEventPool(eventPools.life, source, "eventPools.life");
  validateEventPool(eventPools.explore, source, "eventPools.explore");
  validateEventPool(eventPools.special, source, "eventPools.special");

  return hub as Hub;
}

function getChoiceTargets(choice: EventChoice): string[] {
  const targets = choice.next ? [choice.next] : [];

  if (choice.type === "checked") {
    targets.push(
      ...(choice.weighted?.buckets.map((bucket) => bucket.next) ?? []),
    );
  }

  return targets;
}

export function assertLoadedHubContent(content: LoadedHub): void {
  const { hub, events } = content;

  Object.values(hub.eventPools)
    .flat()
    .forEach((entry) => {
      const event = events[entry.opens.eventFile];

      if (!event) {
        fail(hub.id, `event file "${entry.opens.eventFile}" was not loaded.`);
      }

      if (!event.nodes[entry.opens.nodeId]) {
        fail(
          hub.id,
          `event "${event.id}" has no opening node "${entry.opens.nodeId}".`,
        );
      }
    });

  Object.values(events).forEach((event) => {
    Object.values(event.nodes).forEach((node) => {
      node.choices.flatMap(getChoiceTargets).forEach((target) => {
        if (!event.nodes[target]) {
          fail(
            event.id,
            `node "${node.id}" targets missing node "${target}".`,
          );
        }
      });
    });
  });
}
