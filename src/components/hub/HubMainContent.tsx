// src/components/hub/HubMainContent.tsx

const tags = [
  {
    label: "Nightfall",
    className: "border-indigo-900/30 bg-indigo-900/15 text-indigo-950",
  },
  {
    label: "Heavy Snow",
    className: "border-sky-900/25 bg-sky-700/15 text-sky-950",
  },
  {
    label: "-12°C",
    className: "border-cyan-900/25 bg-cyan-600/15 text-cyan-950",
  },
];

const stats = [
  {
    label: "Visibility",
    value: "Poor",
    width: "35%",
    barClass: "bg-[#6f776f]",
  },
  {
    label: "Familiarity",
    value: "18%",
    width: "18%",
    barClass: "bg-[#5f7b62]",
  },
  {
    label: "Danger",
    value: "Rising",
    width: "62%",
    barClass: "bg-[#8b4a3f]",
  },
  {
    label: "Cold Exposure",
    value: "Severe",
    width: "78%",
    barClass: "bg-[#4c5f78]",
  },
];

export default function HubMainContent() {
  return (
    <div className="flex flex-3 items-center justify-center">
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-0 scale-[0.98] bg-[rgba(35,25,15,0.22)] blur-[22px]" />

        <div className="relative flex h-full w-full min-h-135 flex-col bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat p-8 text-[#2b2b2b]">
          <h2 className="mb-2 text-3xl font-bold">Frostbound Gate</h2>

          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`rounded-full border px-3 py-1 text-sm font-bold shadow-sm ${tag.className}`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          

          

          <div className="grid flex-1 grid-cols-2 gap-4">
            <p className="mb-4 leading-7 text-[#2b2b2b]/90 mt-8">
            Ancient ice-choked gate. Patrol tracks vanish near the cliffs. The
            air bites; torches gutter in the wind. Ancient ice-choked gate. Patrol tracks vanish near the cliffs. The
            air bites; torches gutter in the wind. Ancient ice-choked gate. Patrol tracks vanish near the cliffs. The
            air bites; torches gutter in the wind.
          </p>

            <section className=" bg-white/15 p-4">
              <h3 className="mb-3 text-lg font-bold tracking-wide">
                Area Stats
              </h3>

              <div className="space-y-3 text-sm text-[#2b2b2b]/80">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="mb-1 flex justify-between">
                      <span>{stat.label}</span>
                      <span className="font-semibold">{stat.value}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={`h-full rounded-full ${stat.barClass}`}
                        style={{ width: stat.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            
          </div>
        </div>
      </div>
    </div>
  );
}