import type { PlayerState } from "../types/player";

import { createCharacterData, createStatus } from "../engine/character.ts";

/** Starting template; each new game receives an independent copy. */
export const DEFAULT_PLAYER: PlayerState = {
  name: "The Exile",
  character: createCharacterData(),
  title: "the Wayfarer",
  stats: {
    strength: 7,
    endurance: 8,
    perception: 8,
    survival: 6,
  },
  resources: [
    { id: "health", label: "Health", value: 82, max: 100, tone: "health" },
    { id: "mana", label: "Mana", value: 58, max: 100, tone: "mana" },
    { id: "stamina", label: "Stamina", value: 71, max: 100, tone: "stamina" },
    { id: "hunger", label: "Hunger", value: 34, max: 100, tone: "hunger" },
  ],
  effects: [createStatus("chilled"), createStatus("focused"), createStatus("minor_wound")],
  inventory: {
    rope: 1,
    bandage: 1,
  },
};

export function createDefaultPlayer(): PlayerState {
  return {
    ...DEFAULT_PLAYER,
    character: { ...createCharacterData(), id: crypto.randomUUID() },
    stats: { ...DEFAULT_PLAYER.stats },
    resources: DEFAULT_PLAYER.resources.map((resource) => ({ ...resource })),
    effects: DEFAULT_PLAYER.effects.map((effect) => ({ ...effect })),
    inventory: { ...DEFAULT_PLAYER.inventory },
  };
}
