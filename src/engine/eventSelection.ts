import type { EventPoolEntry } from "../types/hub";
import type { RandomSource } from "./eventRules";

export type EventEligibility = (entry: EventPoolEntry) => boolean;

function getUnitRandom(random: RandomSource): number {
  const value = random();

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}

/**
 * Draws unique entries using their configured relative weights.
 * Conditions remain an application concern and can be supplied through
 * `isEligible` once game-state condition semantics are introduced.
 */
export function drawWeightedEvents(
  pool: readonly EventPoolEntry[],
  amount: number,
  random: RandomSource = Math.random,
  isEligible: EventEligibility = () => true,
): EventPoolEntry[] {
  const candidates = pool.filter(
    (entry) => entry.weight > 0 && isEligible(entry),
  );
  const selected: EventPoolEntry[] = [];
  const drawCount = Math.min(Math.max(0, Math.floor(amount)), candidates.length);

  while (selected.length < drawCount) {
    const totalWeight = candidates.reduce(
      (total, candidate) => total + candidate.weight,
      0,
    );
    let target = getUnitRandom(random) * totalWeight;
    let selectedIndex = candidates.length - 1;

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];

      if (!candidate) {
        continue;
      }

      target -= candidate.weight;

      if (target < 0) {
        selectedIndex = index;
        break;
      }
    }

    const [entry] = candidates.splice(selectedIndex, 1);

    if (entry) {
      selected.push(entry);
    }
  }

  return selected;
}
