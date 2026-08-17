import type { PlayerState } from "../types/player";

/** Temporary local state until the save-game layer is introduced. */
export const DEFAULT_PLAYER: PlayerState = {
  name: "The Exile",
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
  effects: [
    {
      id: "chilled",
      name: "Chilled",
      icon: "chilled.svg",
      duration: "1h 45m remaining",
      effect: "Stamina recovery reduced by 15%.",
      tone: "cold",
    },
    {
      id: "focused",
      name: "Focused",
      icon: "focused.svg",
      duration: "36m remaining",
      effect: "Mana recovery increased by 10%.",
      tone: "arcane",
    },
    {
      id: "minor_wound",
      name: "Minor Wound",
      icon: "minor_wound.svg",
      duration: "Until treated",
      effect: "Maximum Health reduced slightly.",
      tone: "wound",
    },
  ],
  inventory: {
    rope: 1,
    bandage: 1,
  },
};

export function createDefaultPlayer(): PlayerState {
  return {
    ...DEFAULT_PLAYER,
    stats: { ...DEFAULT_PLAYER.stats },
    resources: DEFAULT_PLAYER.resources.map((resource) => ({ ...resource })),
    effects: DEFAULT_PLAYER.effects.map((effect) => ({ ...effect })),
    inventory: { ...DEFAULT_PLAYER.inventory },
  };
}
