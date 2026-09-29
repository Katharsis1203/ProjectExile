export type FactValue = boolean | string | number;
export type Modifier = { stat: string; amount: number };
export type QuestProgress = {
  stage: string;
  decisions: Record<string, string>;
  objectives: Record<string, boolean>;
};
export type ItemInstance = { id: string; definitionId: string; durability: number; name?: string };
export type CharacterData = {
  id: string;
  background: string;
  appearance: { portrait: string; description: string };
  skills: Record<string, number>;
  feats: Record<string, number>;
  progression: { experience: number; level: number; points: number };
  quests: Record<string, QuestProgress>;
  flags: Record<string, FactValue>;
  reputation: Record<string, number>;
  relationships: Record<string, number>;
  discoveries: string[];
  instances: Record<string, ItemInstance>;
  equipment: Record<string, string>;
  claimedRewards: string[];
  turns: number;
};
export type CharacterCondition =
  | { type: "feat"; feat: string; rank?: number; present?: boolean }
  | { type: "flag"; flag: string; equals: FactValue }
  | { type: "questStage"; quest: string; stage: string; present?: boolean }
  | { type: "questDecision"; quest: string; decision: string; equals: string };
export type CharacterEffect =
  | { type: "quest"; quest: string; stage?: string; decision?: string; value?: string; objective?: string }
  | { type: "flag"; flag: string; value: FactValue }
  | { type: "experience"; amount: number }
  | { type: "feat"; feat: string; rank: number }
  | { type: "status"; status: string; remove?: boolean; turns?: number }
  | { type: "reputation"; faction: string; amount: number }
  | { type: "relationship"; person: string; amount: number }
  | { type: "discovery"; discovery: string }
  | { type: "equipmentItem"; item: string; instanceId: string };
