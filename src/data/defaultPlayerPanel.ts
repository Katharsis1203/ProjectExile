import type { PlayerPanelState } from "../types/player";

/**
 * Temporary presentation state for the hub player panel.
 * Later this can be replaced by the actual player/game-state store without
 * changing the sidebar components.
 */
export const DEFAULT_PLAYER_PANEL: PlayerPanelState = {
  name: "The Exile",
  title: "the Wayfarer",
  resources: [
    { id: "health", label: "Health", value: 82, max: 100, tone: "health" },
    { id: "mana", label: "Mana", value: 58, max: 100, tone: "mana" },
    { id: "energy", label: "Energy", value: 71, max: 100, tone: "energy" },
    { id: "hunger", label: "Hunger", value: 34, max: 100, tone: "hunger" },
  ],
  effects: [
    {
      id: "chilled",
      name: "Chilled",
      icon: "chilled.svg",
      duration: "1h 45m remaining",
      effect: "Energy recovery reduced by 15%.",
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
};
