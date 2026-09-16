import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultPlayer } from "../src/data/defaultPlayer.ts";
import {
  deleteSaveSlot,
  readSaveSlot,
  renameSaveSlot,
  writeSaveSlot,
} from "../src/infrastructure/persistence/gamePersistence.ts";

type StorageStub = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function installStorage(): { storage: StorageStub; restore: () => void } {
  const values = new Map<string, string>();
  const storage: StorageStub = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });

  return {
    storage,
    restore: () => {
      Reflect.deleteProperty(globalThis, "window");
    },
  };
}

test("save slots clone player state and support rename and deletion", () => {
  const { restore } = installStorage();

  try {
    const player = createDefaultPlayer();
    writeSaveSlot(1, "First Journey", player, {
      screen: "intro",
      introNodeId: "start",
    });
    player.inventory.rope = 99;

    assert.equal(readSaveSlot(1)?.player.inventory.rope, 1);
    assert.equal(renameSaveSlot(1, "Renamed")?.saveName, "Renamed");

    deleteSaveSlot(1);
    assert.equal(readSaveSlot(1), null);
  } finally {
    restore();
  }
});

test("invalid save envelopes are ignored", () => {
  const { storage, restore } = installStorage();

  try {
    storage.setItem("project-exile.save.v1.slot.1", JSON.stringify({ version: 99 }));
    assert.equal(readSaveSlot(1), null);
  } finally {
    restore();
  }
});
