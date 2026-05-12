type HubEventCardProps = {
  eventId: string;
  eventImage: string | null;
};

export default function HubEventCard({
  eventId,
  eventImage,
}: HubEventCardProps) {
  return (
    <button
      type="button"
      className="group relative h-full w-full bg-transparent focus:outline-none focus:ring-0"
    >
      <div
        className="
          relative h-full w-full
          bg-center bg-no-repeat
          transition-[transform,filter] duration-200
          group-hover:scale-[1.04]
          group-hover:drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]
        "
        style={{
          backgroundImage: "url('/images/parchment.png')",
          backgroundSize: "100% 100%",
          filter: "drop-shadow(0 8px 4px rgba(0,0,0,0.35))",
        }}
      >
        <div
          className="
            absolute inset-2.5
            overflow-hidden rounded-lg
            bg-[rgba(250,238,210,0.92)]
          "
        >
          <div
            className="
              event-mask
              absolute inset-0
              bg-cover bg-center
              opacity-95
            "
            style={{
              backgroundImage: eventImage
                ? `url('/images/events/${eventImage}')`
                : undefined,
            }}
          />

          <div className="absolute inset-0 " />
        </div>

        <div
          className="
            pointer-events-none absolute bottom-4 left-1/2 z-10
            -translate-x-1/2 translate-y-2
            rounded-md border border-black/15
            bg-[rgba(250,238,210,0.82)]
            px-3 py-1
            text-sm font-bold text-[#2b2b2b]
            opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)]
            backdrop-blur-sm
            transition-all duration-200
            group-hover:translate-y-0 group-hover:opacity-100
          "
        >
          {eventId}
        </div>
      </div>
    </button>
  );
}