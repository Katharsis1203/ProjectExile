import {
  ACTIVITY_ENERGY_CONFIG,
  ACTIVITY_ENERGY_RECHARGE_MS,
} from "../data/activityEnergyConfig.ts";
import type { ActivityEnergyState } from "../types/activityEnergy";

type StoredActivityEnergy = {
  value?: unknown;
  nextRechargeAt?: unknown;
};

function clampValue(value: number): number {
  return Math.max(0, Math.min(ACTIVITY_ENERGY_CONFIG.max, Math.floor(value)));
}

export function createFullActivityEnergy(): ActivityEnergyState {
  return {
    value: ACTIVITY_ENERGY_CONFIG.max,
    nextRechargeAt: null,
  };
}

export function recoverActivityEnergy(
  state: ActivityEnergyState,
  now = Date.now(),
): ActivityEnergyState {
  if (state.value >= ACTIVITY_ENERGY_CONFIG.max) {
    if (state.nextRechargeAt === null) return state;
    return { value: ACTIVITY_ENERGY_CONFIG.max, nextRechargeAt: null };
  }

  const firstRechargeAt = state.nextRechargeAt ?? now + ACTIVITY_ENERGY_RECHARGE_MS;

  if (now < firstRechargeAt) {
    if (state.nextRechargeAt === firstRechargeAt) return state;
    return { ...state, nextRechargeAt: firstRechargeAt };
  }

  const elapsedIntervals =
    Math.floor((now - firstRechargeAt) / ACTIVITY_ENERGY_RECHARGE_MS) + 1;
  const recoveredValue = clampValue(state.value + elapsedIntervals);

  if (recoveredValue >= ACTIVITY_ENERGY_CONFIG.max) {
    return {
      value: ACTIVITY_ENERGY_CONFIG.max,
      nextRechargeAt: null,
    };
  }

  return {
    value: recoveredValue,
    nextRechargeAt:
      firstRechargeAt + elapsedIntervals * ACTIVITY_ENERGY_RECHARGE_MS,
  };
}

export function canSpendActivityEnergy(
  state: ActivityEnergyState,
  amount: number = ACTIVITY_ENERGY_CONFIG.actionCost,
): boolean {
  return state.value >= Math.max(1, Math.floor(amount));
}

export function spendActivityEnergy(
  state: ActivityEnergyState,
  amount: number = ACTIVITY_ENERGY_CONFIG.actionCost,
  now = Date.now(),
): { state: ActivityEnergyState; spent: boolean } {
  const recovered = recoverActivityEnergy(state, now);
  const cost = Math.max(1, Math.floor(amount));

  if (!canSpendActivityEnergy(recovered, cost)) {
    return { state: recovered, spent: false };
  }

  const nextValue = recovered.value - cost;

  return {
    spent: true,
    state: {
      value: nextValue,
      nextRechargeAt:
        recovered.nextRechargeAt ?? now + ACTIVITY_ENERGY_RECHARGE_MS,
    },
  };
}

export function getActivityEnergyRemainingMs(
  state: ActivityEnergyState,
  now = Date.now(),
): number | null {
  if (state.value >= ACTIVITY_ENERGY_CONFIG.max || state.nextRechargeAt === null) {
    return null;
  }

  return Math.max(0, state.nextRechargeAt - now);
}

export function loadActivityEnergy(now = Date.now()): ActivityEnergyState {
  if (typeof window === "undefined") {
    return createFullActivityEnergy();
  }

  try {
    const raw = window.localStorage.getItem(ACTIVITY_ENERGY_CONFIG.storageKey);
    if (!raw) return createFullActivityEnergy();

    const parsed = JSON.parse(raw) as StoredActivityEnergy;
    const rawValue = typeof parsed.value === "number" ? parsed.value : ACTIVITY_ENERGY_CONFIG.max;
    const rawNextRechargeAt =
      typeof parsed.nextRechargeAt === "number" && Number.isFinite(parsed.nextRechargeAt)
        ? parsed.nextRechargeAt
        : null;

    return recoverActivityEnergy(
      {
        value: clampValue(rawValue),
        nextRechargeAt: rawNextRechargeAt,
      },
      now,
    );
  } catch {
    return createFullActivityEnergy();
  }
}

export function saveActivityEnergy(state: ActivityEnergyState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ACTIVITY_ENERGY_CONFIG.storageKey,
      JSON.stringify(state),
    );
  } catch {
    // The cooldown still works for this session if storage is unavailable.
  }
}
