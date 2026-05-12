export default function HubMainContent() {
  return (
    <div className="flex flex-[3] items-center justify-center">
      <div
        className="
          h-full w-full min-h-[540px]
          bg-[url('/images/parchment.png')]
          bg-[length:100%_100%]
          bg-center
          bg-no-repeat
          p-8
        "
      >
        <h2 className="mb-2 text-3xl font-bold text-[#2b2b2b]">
          Frostbound Gate
        </h2>

        <div className="mb-3 flex flex-wrap gap-2">
          {["Nightfall", "Heavy Snow", "-12°C"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-black/15 bg-white/45 px-3 py-1 text-sm font-semibold text-[#2b2b2b]"
            >
              {chip}
            </span>
          ))}
        </div>

        <p className="mb-4 leading-7 text-[#2b2b2b]/90">
          Ancient ice-choked gate. Patrol tracks vanish near the cliffs.
          The air bites; torches gutter in the wind.
        </p>

        <div className="rounded-md border border-black/15 bg-white/25 p-3 font-mono text-sm leading-6 text-[#2b2b2b]">
          <div className="border-b border-dashed border-black/10 py-1">
            [System] Area cold. Tracks diverge east.
          </div>

          <div className="py-1">
            [Note] Torches sputter in the wind.
          </div>
        </div>
      </div>
    </div>
  );
}