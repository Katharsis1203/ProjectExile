import type { GameEvent } from "../../types/event";
import type { LoadedHub } from "../../types/hub";
import {
  assertLoadedHubContent,
  parseGameEvent,
  parseHub,
} from "./contentValidation";
import { fetchJson } from "./fetchJson";

const eventCache = new Map<string, Promise<GameEvent>>();
const hubCache = new Map<string, Promise<LoadedHub>>();

function getPublicUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${baseUrl}${path.replace(/^\/+/, "")}`;
}

function normaliseContentFile(file: string): string {
  const normalisedFile = file
    .trim()
    .replace(/^\/+/, "")
    .replace(/^data\/events\//, "");

  if (!normalisedFile || normalisedFile.split("/").includes("..")) {
    throw new Error(`Invalid event file name: "${file}".`);
  }

  return normalisedFile.endsWith(".json")
    ? normalisedFile
    : `${normalisedFile}.json`;
}

function getCached<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  const cachedRequest = cache.get(key);

  if (cachedRequest) {
    return cachedRequest;
  }

  const request = load();
  cache.set(key, request);

  void request.catch(() => {
    if (cache.get(key) === request) {
      cache.delete(key);
    }
  });

  return request;
}

export function loadEvent(eventFile: string): Promise<GameEvent> {
  const file = normaliseContentFile(eventFile);
  const path = getPublicUrl(`data/events/${file}`);

  return getCached(eventCache, file, async () => {
    const event = parseGameEvent(await fetchJson(path), path);
    return event;
  });
}

export function loadHub(hubId: string): Promise<LoadedHub> {
  const normalisedHubId = hubId.trim();

  if (!/^[a-z0-9_-]+$/i.test(normalisedHubId)) {
    return Promise.reject(new Error(`Invalid hub id: "${hubId}".`));
  }

  return getCached(hubCache, normalisedHubId, async () => {
    const path = getPublicUrl(`data/hubs/${normalisedHubId}.json`);
    const hub = parseHub(await fetchJson(path), path);
    const eventFiles = new Set(
      Object.values(hub.eventPools)
        .flat()
        .map((entry) => entry.opens.eventFile),
    );
    const eventEntries = await Promise.all(
      [...eventFiles].map(async (eventFile) => {
        const event = await loadEvent(eventFile);
        return [eventFile, event] as const;
      }),
    );
    const content: LoadedHub = {
      hub,
      events: Object.fromEntries(eventEntries),
    };

    assertLoadedHubContent(content);
    return content;
  });
}
