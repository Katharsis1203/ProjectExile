export type PlayerResourceTone = "health" | "mana" | "energy" | "hunger";

export type PlayerResource = {
  id: string;
  label: string;
  value: number;
  max: number;
  tone: PlayerResourceTone;
};

export type PlayerStatusEffect = {
  id: string;
  name: string;
  icon: string;
  duration: string;
  effect: string;
  tone?: "cold" | "arcane" | "wound" | "neutral";
};

export type PlayerPanelState = {
  name: string;
  title: string;
  resources: PlayerResource[];
  effects: PlayerStatusEffect[];
};
