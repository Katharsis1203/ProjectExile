import type { PlayerState } from "../../types/player";

export const SAVE_SLOT_IDS = [1, 2, 3] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];
export type SaveLocation = "intro" | "hub";

export type SaveResumePoint = {
  screen: SaveLocation;
  introNodeId?: string;
  introComplete?: boolean;
};

export type GameSave = {
  version: 1;
  slotId: SaveSlotId;
  saveName: string;
  player: PlayerState;
  resume: SaveResumePoint;
  createdAt: string;
  updatedAt: string;
};

export type TextSizeSetting = "small" | "standard" | "large";
export type InterfaceScaleSetting = "compact" | "standard" | "large";

export type GameSettings = {
  textSize: TextSizeSetting;
  interfaceScale: InterfaceScaleSetting;
  reducedMotion: boolean;
  snowEffects: boolean;
  highContrast: boolean;
};

const SAVE_PREFIX = "project-exile.save.v1.slot.";
const SETTINGS_KEY = "project-exile.settings.v1";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  textSize: "standard",
  interfaceScale: "standard",
  reducedMotion: false,
  snowEffects: true,
  highContrast: false,
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    stats: { ...player.stats },
    resources: player.resources.map((resource) => ({ ...resource })),
    effects: player.effects.map((effect) => ({ ...effect })),
    inventory: { ...player.inventory },
  };
}

function isSaveSlotId(value: unknown): value is SaveSlotId {
  return SAVE_SLOT_IDS.includes(value as SaveSlotId);
}

function isGameSave(value: unknown): value is GameSave {
  if (!value || typeof value !== "object") return false;

  const save = value as Partial<GameSave>;
  return (
    save.version === 1 &&
    isSaveSlotId(save.slotId) &&
    typeof save.saveName === "string" &&
    Boolean(save.player) &&
    Boolean(save.resume) &&
    (save.resume?.screen === "intro" || save.resume?.screen === "hub") &&
    typeof save.createdAt === "string" &&
    typeof save.updatedAt === "string"
  );
}

export function readSaveSlot(slotId: SaveSlotId): GameSave | null {
  if (!hasStorage()) return null;

  try {
    const raw = window.localStorage.getItem(`${SAVE_PREFIX}${slotId}`);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isGameSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function listSaveSlots(): Array<GameSave | null> {
  return SAVE_SLOT_IDS.map(readSaveSlot);
}

export function getMostRecentSave(): GameSave | null {
  return listSaveSlots()
    .filter((save): save is GameSave => save !== null)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )[0] ?? null;
}

export function writeSaveSlot(
  slotId: SaveSlotId,
  saveName: string,
  player: PlayerState,
  resume: SaveResumePoint,
): GameSave {
  const existing = readSaveSlot(slotId);
  const now = new Date().toISOString();
  const save: GameSave = {
    version: 1,
    slotId,
    saveName: saveName.trim() || `Journey ${slotId}`,
    player: clonePlayer(player),
    resume: { ...resume },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (hasStorage()) {
    try {
      window.localStorage.setItem(`${SAVE_PREFIX}${slotId}`, JSON.stringify(save));
    } catch {
      // The game can still run if storage is unavailable or full.
    }
  }

  return save;
}

export function deleteSaveSlot(slotId: SaveSlotId): void {
  if (!hasStorage()) return;

  try {
    window.localStorage.removeItem(`${SAVE_PREFIX}${slotId}`);
  } catch {
    // Ignore storage failures; the title screen will simply show the old slot.
  }
}

export function renameSaveSlot(slotId: SaveSlotId, saveName: string): GameSave | null {
  const existing = readSaveSlot(slotId);
  if (!existing) return null;

  return writeSaveSlot(slotId, saveName, existing.player, existing.resume);
}

function normaliseSettings(value: unknown): GameSettings {
  if (!value || typeof value !== "object") return DEFAULT_GAME_SETTINGS;

  const settings = value as Partial<GameSettings>;
  return {
    textSize:
      settings.textSize === "small" ||
      settings.textSize === "large" ||
      settings.textSize === "standard"
        ? settings.textSize
        : DEFAULT_GAME_SETTINGS.textSize,
    interfaceScale:
      settings.interfaceScale === "compact" ||
      settings.interfaceScale === "large" ||
      settings.interfaceScale === "standard"
        ? settings.interfaceScale
        : DEFAULT_GAME_SETTINGS.interfaceScale,
    reducedMotion:
      typeof settings.reducedMotion === "boolean"
        ? settings.reducedMotion
        : DEFAULT_GAME_SETTINGS.reducedMotion,
    snowEffects:
      typeof settings.snowEffects === "boolean"
        ? settings.snowEffects
        : DEFAULT_GAME_SETTINGS.snowEffects,
    highContrast:
      typeof settings.highContrast === "boolean"
        ? settings.highContrast
        : DEFAULT_GAME_SETTINGS.highContrast,
  };
}

export function loadGameSettings(): GameSettings {
  if (!hasStorage()) return DEFAULT_GAME_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? normaliseSettings(JSON.parse(raw) as unknown) : DEFAULT_GAME_SETTINGS;
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function applyGameSettings(settings: GameSettings): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.exileTextSize = settings.textSize;
  root.dataset.exileInterfaceScale = settings.interfaceScale;
  root.dataset.exileMotion = settings.reducedMotion ? "reduced" : "full";
  root.dataset.exileSnow = settings.snowEffects ? "on" : "off";
  root.dataset.exileContrast = settings.highContrast ? "high" : "standard";
}

export function saveGameSettings(settings: GameSettings): void {
  applyGameSettings(settings);

  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings remain active for this session even if persistence fails.
  }
}
