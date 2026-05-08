import HubEventCard from "./HubEventCard";

type HubEventSlot = {
  id: string;
  eventId?: string | null;
};

const eventSlots: HubEventSlot[] = [
  { id: "slot_1", eventId: "event_one" },
  { id: "slot_2", eventId: null },
  { id: "slot_3", eventId: "event_three" },
];

export default function HubEventRow() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex h-full w-full gap-4 border border-neutral-700 bg-neutral-900 p-4">

        {eventSlots.map((slot) => (
          <div
            key={slot.id}
            className="flex flex-1 items-center justify-center border border-neutral-700 bg-neutral-800"
          >
            {slot.eventId ? (
              <HubEventCard eventId={slot.eventId} />
            ) : (
              <span className="text-neutral-500 text-sm">Empty</span>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}