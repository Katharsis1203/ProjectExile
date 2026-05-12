export default function HubSideBar() {
  const categories = [
    { title: "Travel", image: "/images/alt/character-btn2.png" },
    { title: "Inventory", image: "/images/alt/inventory-btn2.png" },
    { title: "Characters", image: "/images/alt/status-btn2.png" },
  ];

  return (
    <aside className="flex flex-[1.25] flex-col">
      {/* Category buttons */}
      <div className="flex flex-col overflow-hidden border border-b-0 border-[rgba(70,58,44,0.35)]">
        {categories.map((category) => (
          <button
            key={category.title}
            type="button"
            title={category.title}
            aria-label={category.title}
            className="
              group relative flex h-[100px] w-full items-center justify-center
              overflow-hidden
              border-b border-[rgba(70,58,44,0.35)]
              bg-[rgba(250,238,210,0.9)]
              p-0
              transition
              last:border-b-0
              hover:brightness-105
            "
          >
            <img
              src={category.image}
              alt={category.title}
              className="pointer-events-none h-full w-full object-cover object-left"
            />

            <span
              className="
                pointer-events-none absolute right-4
                translate-x-6
                text-[28px] font-bold tracking-wide
                text-[#e6d8b5]
                opacity-0
                drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]
                transition-all duration-200 ease-out
                group-hover:translate-x-0
                group-hover:opacity-100
              "
            >
              {category.title}
            </span>
          </button>
        ))}
      </div>

      {/* Parchment content panel */}
      <div
        className="
          flex flex-1 flex-col justify-between
          bg-[url('/images/parchment.png')]
          bg-size-[100%_100%]
          bg-center bg-no-repeat
          p-5
          text-[#2b2b2b]
        "
      >
        <p className="text-sm leading-6 text-[#2b2b2b]/80">
          Choose a category to reveal available actions, notes, and local
          options for the current hub.
        </p>

        <div
          className="
            mt-4
            border border-dashed border-black/10
            bg-white/10
            p-3
            font-mono text-xs leading-6
            text-[#2b2b2b]/75
          "
        >
          <div className="border-b border-dashed border-black/10 pb-1">
            [Panel] Awaiting selection.
          </div>

          <div className="pt-1">
            [Hint] Travel reveals nearby routes.
          </div>
        </div>
      </div>
    </aside>
  );
}