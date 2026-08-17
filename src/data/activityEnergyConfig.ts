export const ACTIVITY_ENERGY_CONFIG = {
  max: 60,
  actionCost: 1,
  rechargeMinutes: 0.2,
  storageKey: "project-exile:activity-energy:v2",
} as const;

export const ACTIVITY_ENERGY_RECHARGE_MS =
  ACTIVITY_ENERGY_CONFIG.rechargeMinutes * 60 * 1000;
