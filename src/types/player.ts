import type { CharacterData } from "./character";
export type PlayerResourceTone =
  | "health"
  | "mana"
  | "stamina"
  | "hunger";

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
  remainingTurns?: number | null;
  effect: string;
  tone?: "cold" | "arcane" | "wound" | "neutral";
};

export type PlayerInventory = Record<string, number>;

export type PlayerState = {
  name: string;
  title: string;
  character: CharacterData;
  stats: Record<string, number>;
  resources: PlayerResource[];
  effects: PlayerStatusEffect[];
  inventory: PlayerInventory;
};

export type AppliedResourceEffect = {
  type: "resource";
  resource: string;
  label: string;
  amount: number;
  before: number;
  after: number;
  max: number;
};

export type AppliedItemEffect = {
  type: "item";
  item: string;
  name: string;
  amount: number;
  before: number;
  after: number;
};

export type AppliedCharacterEffect = { type: "character"; name: string; amount: number; before: number; after: number };

export type AppliedEventEffect = AppliedResourceEffect | AppliedItemEffect | AppliedCharacterEffect;
