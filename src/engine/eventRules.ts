import type {
  CheckResult,
  EventChoice,
  EventEffect,
  NodeResolution,
  StatCheck,
} from "../types/event";

const DIE_SIDES = 6;
const DEFAULT_STAT_VALUE = 5;

export type PlayerStats = Readonly<Record<string, number>>;
export type RandomSource = () => number;

export type ChoiceResolution = NodeResolution & {
  next?: string;
  effects: EventEffect[];
};

export type StatPalette = {
  tint: string;
  tintStrong: string;
  border: string;
  text: string;
  accent: string;
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

export function describeCheckChance(
  check: StatCheck,
  stats: PlayerStats,
): string {
  const statValue = getStatValue(stats, check.stat);
  const chance = getCheckChance(check, stats);
  return `${chance}% success chance · ${formatStatName(check.stat)} ${statValue} + d6 vs difficulty ${check.difficulty}`;
}

export function getStatPalette(stat: string): StatPalette {
  switch (stat.trim().toLowerCase()) {
    case "perception":
      return {
        tint: "rgba(96, 132, 162, 0.12)",
        tintStrong: "rgba(96, 132, 162, 0.18)",
        border: "rgba(96, 132, 162, 0.38)",
        text: "#425d73",
        accent: "#6c94b2",
      };
    case "survival":
      return {
        tint: "rgba(104, 129, 92, 0.12)",
        tintStrong: "rgba(104, 129, 92, 0.18)",
        border: "rgba(104, 129, 92, 0.36)",
        text: "#4f6547",
        accent: "#779167",
      };
    case "endurance":
      return {
        tint: "rgba(162, 130, 88, 0.12)",
        tintStrong: "rgba(162, 130, 88, 0.18)",
        border: "rgba(162, 130, 88, 0.36)",
        text: "#77583c",
        accent: "#a27b50",
      };
    case "strength":
      return {
        tint: "rgba(149, 97, 86, 0.12)",
        tintStrong: "rgba(149, 97, 86, 0.18)",
        border: "rgba(149, 97, 86, 0.36)",
        text: "#7c4f47",
        accent: "#af6a5d",
      };
    case "agility":
    case "dexterity":
      return {
        tint: "rgba(80, 143, 132, 0.12)",
        tintStrong: "rgba(80, 143, 132, 0.18)",
        border: "rgba(80, 143, 132, 0.34)",
        text: "#3f6f69",
        accent: "#5d9b93",
      };
    case "charisma":
    case "presence":
      return {
        tint: "rgba(165, 113, 130, 0.12)",
        tintStrong: "rgba(165, 113, 130, 0.18)",
        border: "rgba(165, 113, 130, 0.34)",
        text: "#815768",
        accent: "#b67d92",
      };
    case "lore":
    case "knowledge":
      return {
        tint: "rgba(122, 107, 160, 0.12)",
        tintStrong: "rgba(122, 107, 160, 0.18)",
        border: "rgba(122, 107, 160, 0.34)",
        text: "#5f5883",
        accent: "#897eb7",
      };
    case "mana":
    case "arcana":
      return {
        tint: "rgba(117, 102, 170, 0.12)",
        tintStrong: "rgba(117, 102, 170, 0.18)",
        border: "rgba(117, 102, 170, 0.34)",
        text: "#5f518c",
        accent: "#8a78c9",
      };
    default:
      return {
        tint: "rgba(132, 116, 94, 0.1)",
        tintStrong: "rgba(132, 116, 94, 0.16)",
        border: "rgba(132, 116, 94, 0.28)",
        text: "#665748",
        accent: "#9b8467",
      };
  }
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
    return {
      checks: [],
      effects: [...(choice.effects ?? [])],
      ...(choice.flavourText ? { flavourText: choice.flavourText } : {}),
      ...(choice.next ? { next: choice.next } : {}),
    };
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
    effects: [
      ...(choice.effects ?? []),
      ...(bucket?.effects ?? []),
    ],
    ...((bucket?.flavourText ?? choice.flavourText)
      ? { flavourText: bucket?.flavourText ?? choice.flavourText }
      : {}),
    ...(next ? { next } : {}),
  };
}
