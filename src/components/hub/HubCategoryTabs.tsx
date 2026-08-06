
// HubCategoryTabs.tsx

type HubCategory = {
  title: string;
  image: string;
};

const categories: HubCategory[] = [
  { title: "Travel", image: "/images/alt/character-btn4.png" },
  { title: "Inventory", image: "/images/alt/inventory-btn3.png" },
  { title: "Characters", image: "/images/alt/status-btn3.png" },
];

export default function HubCategoryTabs() {
  return (
    <div className="relative z-20 flex flex-col overflow-hidden border border-b-0 border-[rgba(70,58,44,0.15)] bg-[#f2e4c5]">
      {categories.map(({ title, image }) => (
        <button
          key={title}
          type="button"
          title={title}
          aria-label={title}
          className="group relative flex h-[100px] w-full items-center justify-center overflow-hidden border-b border-[rgba(70,58,44,0.15)] bg-[#f2e4c5] transition hover:brightness-105"
        >
          <img
            src={image}
            alt=""
            className="event-mask pointer-events-none h-full w-full object-cover object-left"
          />

          <span className="pointer-events-none absolute right-4 translate-x-6 text-[28px] font-bold tracking-wide text-[#e6d8b5] opacity-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100">
            {title}
          </span>
        </button>
      ))}
    </div>
  );
}