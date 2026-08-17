import { getItemDefinition } from "../data/itemCatalog";
import type {
  ChoiceRequirement,
  EventChoice,
  EventEffect,
} from "../types/event";
import type {
  AppliedEventEffect,
  PlayerInventory,
  PlayerState,
} from "../types/player";

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

function normaliseResourceId(resource: string): string {
  return normaliseKey(resource);
}

export function getInventoryQuantity(
  inventory: PlayerInventory,
  itemId: string,
): number {
  return Math.max(0, inventory[normaliseKey(itemId)] ?? 0);
}

export function getRequiredQuantity(requirement: ChoiceRequirement): number {
  return Math.max(1, Math.floor(requirement.quantity ?? 1));
}

export function isChoiceRequirementMet(
  requirement: ChoiceRequirement,
  inventory: PlayerInventory,
): boolean {
  if (requirement.type === "item") {
    return (
      getInventoryQuantity(inventory, requirement.item) >=
      getRequiredQuantity(requirement)
    );
  }

  return false;
}

export function getUnmetChoiceRequirements(
  choice: EventChoice,
  inventory: PlayerInventory,
): ChoiceRequirement[] {
  return (choice.requirements ?? []).filter(
    (requirement) => !isChoiceRequirementMet(requirement, inventory),
  );
}

export function areChoiceRequirementsMet(
  choice: EventChoice,
  inventory: PlayerInventory,
): boolean {
  return getUnmetChoiceRequirements(choice, inventory).length === 0;
}

export function describeChoiceRequirement(
  requirement: ChoiceRequirement,
): string {
  const definition = getItemDefinition(requirement.item);
  const quantity = getRequiredQuantity(requirement);
  return quantity > 1 ? `${definition.name} ×${quantity}` : definition.name;
}

export function applyEventEffects(
  player: PlayerState,
  effects: readonly EventEffect[] = [],
): { player: PlayerState; appliedEffects: AppliedEventEffect[] } {
  if (effects.length === 0) {
    return { player, appliedEffects: [] };
  }

  let nextResources = player.resources.map((resource) => ({ ...resource }));
  const nextInventory: PlayerInventory = { ...player.inventory };
  const appliedEffects: AppliedEventEffect[] = [];

  for (const effect of effects) {
    if (effect.type === "resource") {
      const resourceId = normaliseResourceId(effect.resource);
      const index = nextResources.findIndex(
        (resource) => normaliseResourceId(resource.id) === resourceId,
      );

      if (index < 0) {
        continue;
      }

      const resource = nextResources[index];
      if (!resource) {
        continue;
      }

      const before = resource.value;
      const after = Math.max(0, Math.min(resource.max, before + effect.amount));
      const actualAmount = after - before;

      nextResources[index] = { ...resource, value: after };

      if (actualAmount !== 0) {
        appliedEffects.push({
          type: "resource",
          resource: resource.id,
          label: resource.label,
          amount: actualAmount,
          before,
          after,
          max: resource.max,
        });
      }

      continue;
    }

    const itemId = normaliseKey(effect.item);
    const before = getInventoryQuantity(nextInventory, itemId);
    const after = Math.max(0, before + effect.amount);
    const actualAmount = after - before;

    if (after === 0) {
      delete nextInventory[itemId];
    } else {
      nextInventory[itemId] = after;
    }

    if (actualAmount !== 0) {
      appliedEffects.push({
        type: "item",
        item: itemId,
        name: getItemDefinition(itemId).name,
        amount: actualAmount,
        before,
        after,
      });
    }
  }

  return {
    player: {
      ...player,
      resources: nextResources,
      inventory: nextInventory,
    },
    appliedEffects,
  };
}

export function formatAppliedEffect(effect: AppliedEventEffect): string {
  const sign = effect.amount > 0 ? "+" : "";

  if (effect.type === "resource") {
    return `${effect.label} ${sign}${effect.amount}`;
  }

  return `${effect.name} ${sign}${effect.amount}`;
}

export function useInventoryItem(
  player: PlayerState,
  itemId: string,
): { player: PlayerState; appliedEffects: AppliedEventEffect[] } {
  const definition = getItemDefinition(itemId);
  const quantity = getInventoryQuantity(player.inventory, itemId);

  if (!definition.use || quantity <= 0) {
    return { player, appliedEffects: [] };
  }

  return applyEventEffects(player, [
    { type: "item", item: itemId, amount: -1 },
    ...definition.use.effects,
  ]);
}

export function discardInventoryItem(
  player: PlayerState,
  itemId: string,
): { player: PlayerState; appliedEffects: AppliedEventEffect[] } {
  const definition = getItemDefinition(itemId);
  const quantity = getInventoryQuantity(player.inventory, itemId);

  if (definition.discardable === false || quantity <= 0) {
    return { player, appliedEffects: [] };
  }

  return applyEventEffects(player, [
    { type: "item", item: itemId, amount: -1 },
  ]);
}
