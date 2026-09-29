import type { NodeResolution } from "./event";
import type { AppliedEventEffect } from "./player";
export type SavedPassage = {
  nodeId: string;
  lastKnownImage: string | null;
  resolution: NodeResolution | null;
  appliedEffects: AppliedEventEffect[];
  isComplete: boolean;
  canReturn: boolean;
};
export type SavedHub = {
  slots: Array<string | null>;
  active: (SavedPassage & { eventFile: string; slotIndex: number }) | null;
};
