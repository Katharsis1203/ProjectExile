import type {
  CheckResult,
  EventChoice,
  NodeResolution,
  StatCheck,
} from "../types/event";

const DIE_SIDES = 6;
const DEFAULT_STAT_VALUE = 5;

export type PlayerStats = Readonly<Record<string, number>>;
export type RandomSource = () => number;

export type ChoiceResolution = NodeResolution & {
  next?: string;
};

function getUnitRandom(random: RandomSource): number {
  const value = random();

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}

export function formatStatName(stat: string): string {
  const trimmedStat = stat.trim();
  return trimmedStat.charAt(0).toUpperCase() + trimmedStat.slice(1);
}

export function getStatValue(stats: PlayerStats, stat: string): number {
  return stats[stat.trim().toLowerCase()] ?? DEFAULT_STAT_VALUE;
}

export function getCheckChance(
  check: StatCheck,
  stats: PlayerStats,
): number {
  const statValue = getStatValue(stats, check.stat);
  let successfulRolls = 0;

  for (let roll = 1; roll <= DIE_SIDES; roll += 1) {
    if (statValue + roll >= check.difficulty) {
      successfulRolls += 1;
    }
  }

  return Math.round((successfulRolls / DIE_SIDES) * 100);
}

export function rollStatCheck(
  check: StatCheck,
  stats: PlayerStats,
  random: RandomSource = Math.random,
): CheckResult {
  const statValue = getStatValue(stats, check.stat);
  const roll = Math.floor(getUnitRandom(random) * DIE_SIDES) + 1;

  return {
    ...check,
    statValue,
    roll,
    success: statValue + roll >= check.difficulty,
  };
}

export function resolveChoice(
  choice: EventChoice,
  stats: PlayerStats,
  random: RandomSource = Math.random,
): ChoiceResolution {
  if (choice.type === "simple") {
    return choice.next ? { checks: [], next: choice.next } : { checks: [] };
  }

  const checks = choice.statChecks.map((check) =>
    rollStatCheck(check, stats, random),
  );
  const successCount = checks.filter((check) => check.success).length;
  const bucket = [...(choice.weighted?.buckets ?? [])]
    .sort((left, right) => right.threshold - left.threshold)
    .find((candidate) => successCount >= candidate.threshold);
  const next = bucket?.next ?? choice.next;

  return {
    checks,
    ...(bucket?.flavourText ? { flavourText: bucket.flavourText } : {}),
    ...(next ? { next } : {}),
  };
}
