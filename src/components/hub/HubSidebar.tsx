import type { Hub, HubStatTone } from "../../types/hub";
import HubSectionTiles from "./HubSectionTiles";

type HubSidebarProps = {
  hub: Hub | null;
};

const statToneClasses: Record<HubStatTone, string> = {
  safe: "bg-[#61745f]",
  warning: "bg-[#8a7148]",
  danger: "bg-[#8b4a3f]",
  cold: "bg-[#4c6078]",
  neutral: "bg-[#6f6d67]",
};

export default function HubSidebar({ hub }: HubSidebarProps) {
  const stats = hub?.stats ?? [];

  return (
    <aside
      aria-label="Hub navigation and field status"
      className="relative flex h-full min-w-0 flex-col pt-[10px] xl:col-start-3 xl:row-start-1"
    >
      <div className="pointer-events-none absolute inset-0 z-0 scale-[0.98] bg-[rgba(35,25,15,0.22)] blur-[22px]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
        <HubSectionTiles />

        <section className="relative -mt-[30px] flex min-h-0 flex-1 flex-col bg-transparent px-5 pb-5 pt-[44px] text-[#2b2b2b]">
          <div className="border-b border-black/10 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#584a3b]/70">
              Field status
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold">The Exile</h2>
          </div>

          <div className="mt-4 space-y-3 text-xs text-[#2b2b2b]/80">
            {stats.map((stat) => {
              const percent = Math.max(0, Math.min(100, stat.percent));

              return (
                <div key={stat.label}>
                  <div className="mb-1 flex justify-between gap-3">
                    <span>{stat.label}</span>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={stat.label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-valuetext={stat.value}
                    className="h-1.5 overflow-hidden rounded-full bg-black/10"
                  >
                    <div
                      className={`h-full rounded-full ${statToneClasses[stat.tone ?? "neutral"]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
