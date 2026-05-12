import { useEffect, useState } from "react";
import HubAreaPanel from "./HubAreaPanel";
import HubMainContent from "./HubMainContent";
import HubSideBar from "./HubSideBar";
import HubEventRow from "./HubEventRow";
import { loadHub } from "../../engine/loadHub";
import type { LoadedHub } from "../../types/hub";
import type { EventPoolEntry } from "../../types/event";
import type { HubEventSlot } from "../../types/event";

function getRandomUniqueEvents(pool: EventPoolEntry[], amount: number) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, amount);
}

export default function HubLayout() {
  const [loadedHub, setLoadedHub] = useState<LoadedHub | null>(null);

  const [eventSlots, setEventSlots] = useState<HubEventSlot[]>([
    { id: "slot_1", event: null },
    { id: "slot_2", event: null },
    { id: "slot_3", event: null },
  ]);

  useEffect(() => {
    loadHub("snowlands_hub")
      .then(setLoadedHub)
      .catch(console.error);
  }, []);

  function handleExplore() {
    if (!loadedHub) return;

    const selectedEvents = getRandomUniqueEvents(
      loadedHub.hub.eventPools.explore,
      3
    );

    setEventSlots((slots) =>
      slots.map((slot, index) => ({
        ...slot,
        event: selectedEvents[index] ?? null,
      }))
    );
  }

  return (
    <div className="min-h-screen overflow-auto bg-[url('/images/snowy-oiled.png')] bg-size-[100%_100%]  text-white">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-225 w-337.5 shrink-0   p-4">
          <div className="grid h-full grid-rows-[4fr_1fr] gap-1">
            <div className="flex gap-2 overflow-hidden">
              <HubAreaPanel 
                onExplore={handleExplore}
                backgroundImage={loadedHub?.hub.image ?? null} />
              <HubMainContent />
              <HubSideBar />
            </div>

            <HubEventRow eventSlots={eventSlots} loadedHub={loadedHub} />          </div>
        </div>
      </div>
    </div>
  );
}