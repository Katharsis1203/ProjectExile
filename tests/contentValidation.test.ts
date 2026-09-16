import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { DEFAULT_EXILE_AVATAR } from "../src/data/defaultAvatar.ts";
import { DEFAULT_PLAYER } from "../src/data/defaultPlayer.ts";
import { DEFAULT_EXILE_PORTRAIT } from "../src/data/defaultPortrait.ts";
import {
  assertLoadedHubContent,
  ContentValidationError,
  parseGameEvent,
  parseHub,
} from "../src/infrastructure/content/contentValidation.ts";
import type { GameEvent } from "../src/types/event.ts";

const PUBLIC_DIRECTORY = fileURLToPath(new URL("../public", import.meta.url));
const EVENTS_DIRECTORY = join(PUBLIC_DIRECTORY, "data", "events");

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function assertFileExists(path: string): Promise<void> {
  await assert.doesNotReject(access(path));
}

test("all bundled hub and event content is valid and internally connected", async () => {
  const hubPath = join(PUBLIC_DIRECTORY, "data", "hubs", "snowlands_hub.json");
  const hub = parseHub(await readJson(hubPath), hubPath);
  const eventFiles = (await readdir(EVENTS_DIRECTORY)).filter((file) =>
    file.endsWith(".json"),
  );
  const eventEntries = await Promise.all(
    eventFiles.map(async (file) => {
      const path = join(EVENTS_DIRECTORY, file);
      const event = parseGameEvent(await readJson(path), path);
      assert.equal(event.id, basename(file, extname(file)));
      return [event.id, event] as const;
    }),
  );
  const events: Record<string, GameEvent> = Object.fromEntries(eventEntries);

  assertLoadedHubContent({ hub, events });

  await assertFileExists(join(PUBLIC_DIRECTORY, "images", hub.image));

  if (hub.scene?.image) {
    await assertFileExists(join(PUBLIC_DIRECTORY, "images", hub.scene.image));
  }

  if (hub.background) {
    await assertFileExists(join(PUBLIC_DIRECTORY, hub.background));
  }

  await Promise.all(
    (hub.scene?.layers ?? []).map((layer) =>
      assertFileExists(join(PUBLIC_DIRECTORY, "images", layer.image)),
    ),
  );

  await Promise.all(
    Object.values(events).flatMap((event) => {
      const eventImages = [event.cardImage, event.cardColourImage].filter(
        (image): image is string => Boolean(image),
      );
      const nodeImages = Object.values(event.nodes)
        .map((node) => node.image)
        .filter((image): image is string => Boolean(image));

      return [...eventImages, ...nodeImages].map((image) =>
        assertFileExists(join(PUBLIC_DIRECTORY, "images", "events", image)),
      );
    }),
  );

  const interfaceAssets = [
    "favicon.svg",
    "images/parchment.png",
    "images/parch2.png",
    "images/sky.png",
    "images/night.png",
    "images/backy.png",
    "images/alt/character-btn4.png",
    "images/alt/inventory-btn3.png",
    "images/alt/journal-btn4.png",
    "images/alt/status-btn3.png",
    `images/avatar/${DEFAULT_EXILE_PORTRAIT.image}`,
    ...DEFAULT_EXILE_AVATAR.layers.map(
      (layer) => `images/avatar/${layer.image}`,
    ),
    ...DEFAULT_PLAYER.effects.map(
      (effect) => `images/status-effects/${effect.icon}`,
    ),
  ];

  await Promise.all(
    interfaceAssets.map((asset) =>
      assertFileExists(join(PUBLIC_DIRECTORY, asset)),
    ),
  );
});

test("invalid content fails with a contextual error", () => {
  assert.throws(
    () => parseGameEvent({ schemaVersion: 1 }, "broken-event.json"),
    (error: unknown) =>
      error instanceof ContentValidationError &&
      error.message.includes("broken-event.json"),
  );
});
