// HubSideBar.tsx

import HubCategoryTabs from "./HubCategoryTabs";

export default function HubSideBar() {
  return (
    <aside className="relative flex h-full flex-[1.25] flex-col pt-[10px]">
      <div className="pointer-events-none absolute inset-0 z-0 scale-[0.98] bg-[rgba(35,25,15,0.22)] blur-[22px]" />

      <div className="relative z-10 flex h-full flex-col">
        <HubCategoryTabs />

        <div className="relative z-[-10] -mt-[30px] flex flex-1 flex-col justify-between bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-5 pb-5 pt-[42px] text-[#2b2b2b]">
          <p className="relative z-10 text-sm leading-6 text-[#2b2b2b]/80">
            Choose a category to reveal available actions, notes, and local
            options for the current hub.
          </p>

          <div className="relative z-10 mt-4 border border-dashed border-black/10 bg-white/10 p-3 font-mono text-xs leading-6 text-[#2b2b2b]/75">
            <div className="border-b border-dashed border-black/10 pb-1">
              [Panel] Awaiting selection.
            </div>

            <div className="pt-1">[Hint] Travel reveals nearby routes.</div>
          </div>
        </div>
      </div>
    </aside>
  );
}