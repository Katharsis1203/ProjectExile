export default function HubSidebar() {
  return (
    <div className="flex flex-[1.25] items-center justify-center">
      <div className="flex h-full w-full flex-col gap-3 border border-neutral-700 bg-neutral-900 p-4">
        <div className="text-center font-semibold text-neutral-200">
          Category Buttons
        </div>

        <div className="flex flex-col gap-2">
          <button className="bg-neutral-800 p-2 text-sm hover:bg-neutral-700">
            Travel
          </button>

          <button className="bg-neutral-800 p-2 text-sm hover:bg-neutral-700">
            Inventory
          </button>

          <button className="bg-neutral-800 p-2 text-sm hover:bg-neutral-700">
            Characters
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center bg-neutral-800 p-4 text-sm text-neutral-300">
          Category Actions
        </div>
      </div>
    </div>
  );
}