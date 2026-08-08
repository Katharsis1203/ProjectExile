import type { PlayerResource, PlayerResourceTone } from "../../types/player";

type PlayerResourceBarsProps = {
  resources: PlayerResource[];
};

const toneClasses: Record<PlayerResourceTone, string> = {
  health: "bg-[#8b4a45]",
  mana: "bg-[#536786]",
  energy: "bg-[#6f7752]",
  hunger: "bg-[#9a7544]",
};

export default function PlayerResourceBars({ resources }: PlayerResourceBarsProps) {
  return (
    <div className="space-y-2.5">
      {resources.map((resource) => {
        const percent = resource.max > 0
          ? Math.max(0, Math.min(100, (resource.value / resource.max) * 100))
          : 0;

        return (
          <div key={resource.id}>
            <div className="mb-1 flex items-end justify-between gap-3 text-[10px] text-[#463a2e]/78">
              <span className="font-semibold tracking-[0.02em]">{resource.label}</span>
              <span className="font-mono text-[9px] font-semibold text-[#554536]/72">
                {resource.value}/{resource.max}
              </span>
            </div>

            <div className="relative h-[7px] overflow-hidden rounded-full border border-[#6a5945]/12 bg-[#75634d]/12 shadow-[inset_0_1px_2px_rgba(71,54,37,0.12)]">
              <div
                className={`h-full rounded-full ${toneClasses[resource.tone]} shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[width] duration-300`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
