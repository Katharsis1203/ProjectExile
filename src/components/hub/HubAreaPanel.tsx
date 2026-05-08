export default function HubAreaPanel() {
  return (
    <div className="flex flex-1 items-center justify-center">

      {/* Panel wrapper */}
      <div className="flex h-full w-full flex-col gap-3 bg-neutral-900">

        {/* Title */}
        <div className="text-center font-semibold text-neutral-200">
          Area Title
        </div>

        {/* Image */}
        <div className="flex flex-1 items-center justify-center bg-neutral-800">
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <h1 className=" p-2 text-med m-auto">
            Generate Events
          </h1>

          <button className="bg-neutral-800 p-2 text-sm hover:bg-neutral-700">
            Explore
          </button>

          <button className="bg-neutral-800 p-2 text-sm hover:bg-neutral-700">
            Life
          </button>
        </div>

      </div>
    </div>
  );
}