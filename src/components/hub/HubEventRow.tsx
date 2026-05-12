import HubEventCard from "./HubEventCard";
import type { HubEventSlot } from "../../types/event";
import type { LoadedHub } from "../../types/hub";

type HubEventRowProps = {
  eventSlots: HubEventSlot[];
  loadedHub: LoadedHub | null;
};

export default function HubEventRow({
  eventSlots,
  loadedHub,
}: HubEventRowProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex h-full w-full gap-4">
        {eventSlots.map((slot) => {
          const event = slot.event
            ? loadedHub?.events[slot.event.opens.eventFile]
            : null;

          return (
            <div key={slot.id} className="flex flex-1 items-center justify-center">
              {slot.event && event ? (
                <HubEventCard
                  eventId={event.name}
                  eventImage={event.cardImage ?? null}
                />
              ) : (
                <div
                  className="
                    relative h-full w-full
                    bg-center bg-no-repeat
                    opacity-80
                    drop-shadow-[0_8px_4px_rgba(0,0,0,0.28)]
                  "
                  style={{
                    backgroundImage: "url('/images/parchment.png')",
                    backgroundSize: "100% 100%",
                  }}
                >
                  <div className="absolute inset-2.5 rounded-lg bg-black/45" />
                  <span className="absolute inset-0 grid place-items-center text-sm text-[#faeed2]/55">
                    Empty
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}