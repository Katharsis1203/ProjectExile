import "./HubImageButtonLabel.css";

type HubSection = {
  title: string;
  image: string;
};

const hubSections: HubSection[] = [
  { title: "Travel", image: "/images/alt/character-btn4.png" },
  { title: "Inventory", image: "/images/alt/inventory-btn3.png" },
  { title: "Characters", image: "/images/alt/status-btn3.png" },
];

export default function HubSectionTiles() {
  return (
    <div
      role="group"
      aria-label="Upcoming hub sections"
      className="relative z-20 grid grid-cols-3 overflow-hidden border border-b-0 border-[rgba(70,58,44,0.15)] bg-transparent xl:flex xl:flex-col"
    >
      {hubSections.map(({ title, image }) => (
        <div
          key={title}
          aria-disabled="true"
          title={`${title} (coming soon)`}
          className="group relative flex h-[88px] w-full items-center justify-center overflow-hidden border-b border-[rgba(70,58,44,0.15)] bg-transparent xl:h-[100px]"
        >
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="event-mask hub-image-button-art pointer-events-none h-full w-full object-cover object-left"
          />

          <span className="hub-image-button-label pointer-events-none absolute right-3 translate-x-6 text-lg font-bold tracking-wide opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 sm:text-[24px] xl:right-4 xl:text-[28px]">
            {title}
          </span>
          <span className="sr-only">Coming soon</span>
        </div>
      ))}
    </div>
  );
}
