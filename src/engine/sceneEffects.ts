import type {
  HubLightingEffect,
  HubWeatherEffect,
  HubWeatherIntensity,
} from "../types/hub";

const LIGHTING_EFFECTS: readonly HubLightingEffect[] = [
  "day",
  "dawn",
  "dusk",
  "night",
  "overcast",
];
const WEATHER_EFFECTS: readonly HubWeatherEffect[] = ["none", "snow", "fog"];
const WEATHER_INTENSITIES: readonly HubWeatherIntensity[] = [
  "light",
  "medium",
  "heavy",
];

function normaliseValue<T extends string>(
  value: unknown,
  supportedValues: readonly T[],
  fallback: T,
): T {
  const normalisedValue = typeof value === "string" ? value.toLowerCase() : "";
  return supportedValues.includes(normalisedValue as T)
    ? (normalisedValue as T)
    : fallback;
}

export function normaliseLighting(value: unknown): HubLightingEffect {
  return normaliseValue(value, LIGHTING_EFFECTS, "day");
}

export function normaliseWeather(value: unknown): HubWeatherEffect {
  return normaliseValue(value, WEATHER_EFFECTS, "none");
}

export function normaliseWeatherIntensity(
  value: unknown,
): HubWeatherIntensity {
  return normaliseValue(value, WEATHER_INTENSITIES, "medium");
}
