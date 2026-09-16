import { useEffect, useState } from "react";
import { ACTIVITY_ENERGY_CONFIG } from "../../../data/activityEnergyConfig";
import { getActivityEnergyRemainingMs } from "../../../engine/activityEnergy";
import type { ActivityEnergyState } from "../../../types/activityEnergy";

type HubActivityEnergyProps = {
  energy: ActivityEnergyState;
};

function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null) return "Full";

  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `+1 in ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function HubActivityEnergy({ energy }: HubActivityEnergyProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingMs = getActivityEnergyRemainingMs(energy, now);
  const countdown = formatCountdown(remainingMs);
  const percentage = Math.max(
    0,
    Math.min(100, (energy.value / ACTIVITY_ENERGY_CONFIG.max) * 100),
  );

  return (
    <div
      className="shrink-0 border-b border-[rgba(70,58,44,0.15)] bg-[rgba(238,226,202,0.42)] px-3 py-2 text-[#493c2f]"
      title={`Explore and Life cost ${ACTIVITY_ENERGY_CONFIG.actionCost} Energy. One Energy recovers every ${ACTIVITY_ENERGY_CONFIG.rechargeMinutes} minutes.`}
      aria-label={`Activity Energy ${energy.value} of ${ACTIVITY_ENERGY_CONFIG.max}. ${countdown}. Explore and Life cost ${ACTIVITY_ENERGY_CONFIG.actionCost} Energy.`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#5d4d3c]/72">
          Activity Energy
        </span>
        <span className="font-mono text-[10px] font-semibold text-[#514332]/82">
          {energy.value}/{ACTIVITY_ENERGY_CONFIG.max}
        </span>
      </div>

      <div
        className="mt-1.5 h-[6px] overflow-hidden rounded-full border border-[#75634d]/18 bg-[#75634d]/10"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[#9f814f]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 text-[8px] tracking-[0.02em] text-[#665542]/58">
        <span>Explore / Life cost 1</span>
        <span>{countdown}</span>
      </div>
    </div>
  );
}
