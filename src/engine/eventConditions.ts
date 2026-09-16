import type { PlayerState } from "../types/player";
import type {
  EventCondition,
  Hub,
  NumericConditionOperator,
} from "../types/hub";
import { normaliseLighting } from "./sceneEffects.ts";

type ConditionContext = {
  player: PlayerState;
  hub: Hub;
};

function compareNumber(
  actual: number,
  operator: NumericConditionOperator,
  expected: number,
): boolean {
  switch (operator) {
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
    case "eq":
      return actual === expected;
    case "gte":
      return actual >= expected;
    case "gt":
      return actual > expected;
  }
}

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

function getResourceValue(player: PlayerState, resource: string): number | null {
  const key = normaliseKey(resource);
  return player.resources.find((candidate) => normaliseKey(candidate.id) === key)?.value ?? null;
}

function getHubStatPercent(hub: Hub, stat: string): number | null {
  const key = normaliseKey(stat);
  return hub.stats?.find((candidate) => normaliseKey(candidate.label) === key)?.percent ?? null;
}

function getSceneValue(hub: Hub, field: Extract<EventCondition, { type: "scene" }>['field']): string | null {
  const scene = hub.scene;

  if (!scene) {
    return null;
  }

  if (field === "lighting") {
    return normaliseLighting(scene.effects?.lighting ?? scene.tone);
  }

  if (field === "weather") {
    return scene.effects?.weather ?? "none";
  }

  return scene.effects?.weatherIntensity ?? "medium";
}

export function isEventConditionMet(
  condition: EventCondition,
  { player, hub }: ConditionContext,
): boolean {
  switch (condition.type) {
    case "playerResource": {
      const actual = getResourceValue(player, condition.resource);
      return actual !== null && compareNumber(actual, condition.operator, condition.value);
    }

    case "playerStat": {
      const actual = player.stats[normaliseKey(condition.stat)];
      return typeof actual === "number" && compareNumber(actual, condition.operator, condition.value);
    }

    case "statusEffect": {
      const key = normaliseKey(condition.effect);
      const present = player.effects.some(
        (effect) => normaliseKey(effect.id) === key || normaliseKey(effect.name) === key,
      );
      return present === (condition.present ?? true);
    }

    case "inventoryItem": {
      const quantity = player.inventory[normaliseKey(condition.item)] ?? 0;
      const present = quantity >= Math.max(1, condition.quantity ?? 1);
      return present === (condition.present ?? true);
    }

    case "hubStat": {
      const actual = getHubStatPercent(hub, condition.stat);
      return actual !== null && compareNumber(actual, condition.operator, condition.value);
    }

    case "scene": {
      const actual = getSceneValue(hub, condition.field);
      return actual !== null && normaliseKey(actual) === normaliseKey(condition.equals);
    }
  }
}

export function areEventConditionsMet(
  conditions: readonly EventCondition[],
  context: ConditionContext,
): boolean {
  return conditions.every((condition) => isEventConditionMet(condition, context));
}
