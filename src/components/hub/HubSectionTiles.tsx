import "./HubImageButtonLabel.css";

type HubSection = {
  title: string;
  image: string;
  enabled: boolean;
};

type HubSectionTilesProps = {
  onInventory: () => void;
};

const hubSections: HubSection[] = [
  { title: "Travel", image: "/images/alt/character-btn4.png", enabled: false },
  { title: "Inventory", image: "/images/alt/inventory-btn3.png", enabled: true },
  { title: "Characters", image: "/images/alt/status-btn3.png", enabled: false },
];

export default function HubSectionTiles({ onInventory }: HubSectionTilesProps) {
  return (
    <div
      role="group"
      aria-label="Hub sections"
      className="relative z-20 grid grid-cols-3 overflow-hidden border border-b-0 border-[rgba(70,58,44,0.15)] bg-transparent xl:flex xl:flex-col"
    >
      {hubSections.map(({ title, image, enabled }) => (
        <button
          key={title}
          type="button"
          disabled={!enabled}
          onClick={title === "Inventory" ? onInventory : undefined}
          title={enabled ? `Open ${title}` : `${title} (coming soon)`}
          className="group relative flex h-[80px] w-full items-center justify-center overflow-hidden border-b border-[rgba(70,58,44,0.15)] bg-transparent text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#725d44]/60 disabled:cursor-default xl:h-[80px]"
        >
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className={`event-mask hub-image-button-art pointer-events-none h-full w-full object-cover object-left transition ${
              enabled ? "group-hover:saturate-[1.08]" : "opacity-75"
            }`}
          />

          <span className="hub-image-button-label pointer-events-none absolute right-3 translate-x-6 text-lg font-bold tracking-wide opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:text-[22px] xl:right-4 xl:text-[24px]">
            {title}
          </span>
          {!enabled ? <span className="sr-only">Coming soon</span> : null}
        </button>
      ))}
    </div>
  );
}
