import type { SavedHub, SavedPassage } from "../../types/session";
function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
export function isSavedPassage(value: unknown): value is SavedPassage {
  if (!isRecord(value) || typeof value.nodeId !== "string" || (value.lastKnownImage !== null && typeof value.lastKnownImage !== "string") || typeof value.isComplete !== "boolean" || typeof value.canReturn !== "boolean" || !Array.isArray(value.appliedEffects)) return false;
  if (!value.appliedEffects.every((e: unknown) => isRecord(e) && ["resource", "item", "character"].includes(String(e.type)) && finite(e.amount) && finite(e.before) && finite(e.after) && (e.type === "resource" ? typeof e.resource === "string" && typeof e.label === "string" && finite(e.max) : typeof e.name === "string"))) return false;
  if (value.resolution === null) return true;
  const resolution = value.resolution;
  return isRecord(resolution) && (resolution.flavourText === undefined || typeof resolution.flavourText === "string") && Array.isArray(resolution.checks) && resolution.checks.every((c: unknown) => isRecord(c) && typeof c.stat === "string" && finite(c.statValue) && finite(c.difficulty) && finite(c.roll) && typeof c.success === "boolean");
}
export function isSavedHub(value: unknown): value is SavedHub {
  if (!isRecord(value) || !Array.isArray(value.slots) || value.slots.length !== 3 || !value.slots.every((id: unknown) => id === null || typeof id === "string")) return false;
  if (value.active === null) return true;
  const active = value.active;
  return isRecord(active) && typeof active.eventFile === "string" && finite(active.slotIndex) && Number.isInteger(active.slotIndex) && active.slotIndex >= 0 && active.slotIndex < 3 && isSavedPassage(active);
}
