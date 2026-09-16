import type { EventNode, GameEvent } from "../../types/event";
import {
  expectArray,
  expectFiniteNumber,
  expectOptionalBoolean,
  expectOptionalString,
  expectRecord,
  expectString,
  fail,
  validateStringArray,
} from "./validationPrimitives.ts";

const EVENT_SCHEMA_VERSIONS = new Set([1, 2]);

function validateStatChecks(value: unknown, source: string, field: string): void {
  expectArray(value, source, field).forEach((check, index) => {
    const checkField = `${field}[${index}]`;
    const record = expectRecord(check, source, checkField);
    expectString(record.stat, source, `${checkField}.stat`);
    expectFiniteNumber(record.difficulty, source, `${checkField}.difficulty`);
  });
}

function validateEventEffect(value: unknown, source: string, field: string): void {
  const effect = expectRecord(value, source, field);
  const type = expectString(effect.type, source, `${field}.type`);
  if (type === "resource") {
    expectString(effect.resource, source, `${field}.resource`);
    expectFiniteNumber(effect.amount, source, `${field}.amount`);
    return;
  }
  if (type === "item") {
    expectString(effect.item, source, `${field}.item`);
    const amount = expectFiniteNumber(effect.amount, source, `${field}.amount`);
    if (!Number.isInteger(amount) || amount === 0) {
      fail(source, `"${field}.amount" must be a non-zero integer for item effects.`);
    }
    return;
  }
  fail(source, `"${field}.type" must be "resource" or "item".`);
}

function validateThresholdOutcome(value: unknown, source: string, field: string): void {
  const outcome = expectRecord(value, source, field);
  const bucketIds = new Set<string>();
  expectArray(outcome.buckets, source, `${field}.buckets`).forEach((bucket, index) => {
    const bucketField = `${field}.buckets[${index}]`;
    const record = expectRecord(bucket, source, bucketField);
    const id = expectString(record.id, source, `${bucketField}.id`);
    if (bucketIds.has(id)) fail(source, `duplicate outcome bucket id "${id}" in "${field}".`);
    bucketIds.add(id);
    expectFiniteNumber(record.threshold, source, `${bucketField}.threshold`);
    expectOptionalString(record.flavourText, source, `${bucketField}.flavourText`);
    expectString(record.next, source, `${bucketField}.next`);
    if (record.effects !== undefined) {
      expectArray(record.effects, source, `${bucketField}.effects`).forEach(
        (effect, effectIndex) =>
          validateEventEffect(effect, source, `${bucketField}.effects[${effectIndex}]`),
      );
    }
  });
}

function validateChoiceRequirement(value: unknown, source: string, field: string): void {
  const requirement = expectRecord(value, source, field);
  if (expectString(requirement.type, source, `${field}.type`) !== "item") {
    fail(source, `"${field}.type" must be "item".`);
  }
  expectString(requirement.item, source, `${field}.item`);
  if (requirement.quantity !== undefined) {
    const quantity = expectFiniteNumber(requirement.quantity, source, `${field}.quantity`);
    if (!Number.isInteger(quantity) || quantity < 1) {
      fail(source, `"${field}.quantity" must be a positive integer.`);
    }
  }
}

function validateChoice(value: unknown, source: string, field: string): void {
  const choice = expectRecord(value, source, field);
  const type = expectString(choice.type, source, `${field}.type`);
  if (type !== "simple" && type !== "checked") {
    fail(source, `"${field}.type" must be "simple" or "checked".`);
  }
  expectString(choice.text, source, `${field}.text`);
  expectOptionalString(choice.flavourText, source, `${field}.flavourText`);
  expectOptionalString(choice.next, source, `${field}.next`);
  expectOptionalBoolean(choice.returnToHub, source, `${field}.returnToHub`);
  expectOptionalBoolean(choice.endEvent, source, `${field}.endEvent`);
  if (choice.requirements !== undefined) {
    expectArray(choice.requirements, source, `${field}.requirements`).forEach(
      (requirement, index) =>
        validateChoiceRequirement(requirement, source, `${field}.requirements[${index}]`),
    );
  }
  if (choice.effects !== undefined) {
    expectArray(choice.effects, source, `${field}.effects`).forEach((effect, index) =>
      validateEventEffect(effect, source, `${field}.effects[${index}]`),
    );
  }
  if (type === "checked") {
    validateStatChecks(choice.statChecks, source, `${field}.statChecks`);
    if (choice.weighted !== undefined) {
      validateThresholdOutcome(choice.weighted, source, `${field}.weighted`);
    }
  }
}

function validateNode(value: unknown, source: string, nodeKey: string): void {
  const field = `nodes.${nodeKey}`;
  const node = expectRecord(value, source, field);
  const id = expectString(node.id, source, `${field}.id`);
  if (id !== nodeKey) fail(source, `node key "${nodeKey}" does not match its id "${id}".`);
  expectString(node.title, source, `${field}.title`);
  expectString(node.text, source, `${field}.text`);
  expectOptionalString(node.image, source, `${field}.image`);
  expectOptionalString(node.background, source, `${field}.background`);
  expectOptionalString(node.miscText, source, `${field}.miscText`);
  expectArray(node.choices, source, `${field}.choices`).forEach((choice, index) =>
    validateChoice(choice, source, `${field}.choices[${index}]`),
  );
}

function normaliseNodes(value: unknown, source: string): Record<string, EventNode> {
  if (Array.isArray(value)) {
    const nodes: Record<string, EventNode> = {};
    value.forEach((node, index) => {
      const record = expectRecord(node, source, `nodes[${index}]`);
      const id = expectString(record.id, source, `nodes[${index}].id`);
      if (nodes[id]) fail(source, `duplicate node id "${id}".`);
      validateNode(node, source, id);
      nodes[id] = node as EventNode;
    });
    return nodes;
  }
  const record = expectRecord(value, source, "nodes");
  Object.entries(record).forEach(([key, node]) => validateNode(node, source, key));
  return record as Record<string, EventNode>;
}

export function parseGameEvent(value: unknown, source: string): GameEvent {
  const event = expectRecord(value, source, "document");
  const schemaVersion = expectFiniteNumber(event.schemaVersion, source, "schemaVersion");
  if (!EVENT_SCHEMA_VERSIONS.has(schemaVersion)) {
    fail(source, `unsupported event schema version ${schemaVersion}.`);
  }
  if (event.type !== "event") fail(source, '"type" must be "event".');
  expectString(event.id, source, "id");
  expectString(event.name, source, "name");
  expectOptionalString(event.cardImage, source, "cardImage");
  expectOptionalString(event.cardColourImage, source, "cardColourImage");
  if (event.tags !== undefined) validateStringArray(event.tags, source, "tags");
  return { ...event, nodes: normaliseNodes(event.nodes, source) } as GameEvent;
}
