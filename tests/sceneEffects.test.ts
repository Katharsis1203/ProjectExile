import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseLighting,
  normaliseWeather,
  normaliseWeatherIntensity,
} from "../src/engine/sceneEffects.ts";

test("scene effects normalise supported values case-insensitively", () => {
  assert.equal(normaliseLighting("NIGHT"), "night");
  assert.equal(normaliseWeather("Snow"), "snow");
  assert.equal(normaliseWeatherIntensity("HEAVY"), "heavy");
});

test("scene effects use safe fallbacks for unknown input", () => {
  assert.equal(normaliseLighting("midday"), "day");
  assert.equal(normaliseWeather(null), "none");
  assert.equal(normaliseWeatherIntensity(undefined), "medium");
});
