import type { Event, EventPoolEntry } from "./event";

export type HubTagTone = "cold" | "danger" | "neutral" | "night";

export type HubTag = {
  label: string;
  tone?: HubTagTone;
};

export type HubStatTone = "safe" | "warning" | "danger" | "cold" | "neutral";

export type HubStat = {
  label: string;
  value: string;
  percent: number;
  tone?: HubStatTone;
};

export type HubSceneLayer = {
  id: string;
  image: string;
  opacity?: number;
  blendMode?: "normal" | "multiply" | "screen" | "overlay";
  focalPoint?: string;
};

export type HubLightingEffect =
  | "day"
  | "dawn"
  | "dusk"
  | "night"
  | "overcast";

export type HubWeatherEffect = "none" | "snow" | "fog";

export type HubWeatherIntensity = "light" | "medium" | "heavy";

export type HubSceneLabels = {
  time?: string;
  weather?: string;
  temperature?: string;
};

export type HubSceneEffects = {
  lighting?: HubLightingEffect;
  weather?: HubWeatherEffect;
  weatherIntensity?: HubWeatherIntensity;
};

export type HubScene = {
  image?: string;
  focalPoint?: string;

  /**
   * Text shown in the sidebar and scene badges.
   * These labels do not control visual effects.
   */
  labels?: HubSceneLabels;

  /**
   * Visual presets applied to the scene.
   * Change these independently from the displayed labels.
   */
  effects?: HubSceneEffects;

  layers?: HubSceneLayer[];

  /** Legacy fields remain supported for older hub JSON files. */
  timeOfDay?: string;
  weather?: string;
  temperature?: string;
  tone?: "day" | "dusk" | "night";
};

export type Hub = {
  schemaVersion: number;
  id: string;
  name: string;
  type: "hub";
  image: string;
  background?: string;
  description?: string;
  ambient?: string[];
  tags?: HubTag[];
  stats?: HubStat[];
  scene?: HubScene;
  eventPools: {
    life: EventPoolEntry[];
    explore: EventPoolEntry[];
    special: EventPoolEntry[];
  };
};

export type LoadedHub = {
  hub: Hub;
  events: Record<string, Event>;
};
