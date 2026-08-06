import type { Hub } from "../../types/hub";
import HubActionButton from "./HubActionButton";

type HubAreaPanelProps = {
  hub: Hub | null;
  onExplore: () => void;
  onLife: () => void;
};

export default function HubAreaPanel({ hub, onExplore, onLife }: HubAreaPanelProps) {
  const scene = hub?.scene;
  const labels = {
    time: scene?.labels?.time ?? scene?.timeOfDay ?? "Unknown",
    weather: scene?.labels?.weather ?? scene?.weather ?? "Unknown",
    temperature: scene?.labels?.temperature ?? scene?.temperature ?? "—",
  };

  return (
    <aside className="relative flex min-w-0 flex-[1.15]">
      <div className="pointer-events-none absolute inset-[10px] scale-[1.03] rounded-[32px] bg-[rgba(55,42,28,0.24)] opacity-90 blur-[34px]" />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
        <section className="relative mb-[-28px] flex min-h-0 flex-1 flex-col bg-transparent px-6 pb-[44px] pt-7 text-[#2b2b2b]">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#584a3b]/65">
            Area conditions
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold">{hub?.name ?? "Loading…"}</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-[#493e32]/70">Time</span>
              <span className="font-bold">{labels.time}</span>
            </div>
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-[#493e32]/70">Weather</span>
              <span className="font-bold">{labels.weather}</span>
            </div>
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-[#493e32]/70">Temperature</span>
              <span className="font-bold">{labels.temperature}</span>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-[#493e32]/75">
            Draw local opportunities, then choose which leads are worth pursuing before leaving the hub.
          </p>

          <div className="mt-auto border-t border-dashed border-black/15 pt-4 font-mono text-[11px] leading-5 text-[#493e32]/65">
            <div>[Hub] Frequent return point</div>
            <div>[Scene] Environmental state visible</div>
          </div>
        </section>

        <div className="relative z-10 flex flex-col border-t border-[rgba(70,58,44,0.15)]">
          <HubActionButton title="Explore" image="/images/alt/journal-btn4.png" onClick={onExplore} />
          <HubActionButton title="Life" image="/images/alt/character-btn4.png" onClick={onLife} />
        </div>
      </div>
    </aside>
  );
}
