import data from "./characterCatalog.json" with { type: "json" };
import type { FactValue, Modifier } from "../types/character";

type StatDefinition = { name: string; description: string; kind: string; category: string };
type FeatDefinition = { name: string; description: string; cost: number; maxRank: number; prerequisites: Record<string, number>; modifiers: Modifier[] };
type StatusDefinition = { name: string; description: string; icon: string; tone: "cold" | "arcane" | "wound" | "neutral"; turns: number | null; modifiers: Modifier[] };
type QuestDefinition = { name: string; stages: Record<string, string>; objectives: Record<string, string>; decisions: Record<string, { label: string; values: Record<string, string> }> };
type FlagDefinition = { name: string; type: string; default: FactValue; values?: string[] };
type EquipmentDefinition = { name: string; description: string; slot: string; twoHanded?: boolean; requirements?: Record<string, number>; maxDurability: number; modifiers: Modifier[] };
export const CHARACTER_CATALOG = data as {
  statCategories: Record<string, string>;
  stats: Record<string, StatDefinition>;
  feats: Record<string, FeatDefinition>;
  statuses: Record<string, StatusDefinition>;
  quests: Record<string, QuestDefinition>;
  flags: Record<string, FlagDefinition>;
  factions: Record<string, { name: string; min: number; max: number }>;
  people: Record<string, { name: string; min: number; max: number }>;
  discoveries: Record<string, { name: string; description: string }>;
  equipmentSlots: Record<string, string>;
  equipment: Record<string, EquipmentDefinition>;
};
