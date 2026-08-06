// src/components/hub/HubEventRow.tsx

import HubEventCard from "./HubEventCard";
import type { HubEventSlot } from "../../types/event";
import type { LoadedHub } from "../../types/hub";

type HubEventRowProps = {
  eventSlots: HubEventSlot[];
  loadedHub: LoadedHub | null;
  onPlayEvent: (
    eventFile: string,
    cardElement: HTMLElement,
    slotId: string
  ) => void;
};

function getStableTilt(seed: string, index: number) {
  let hash = 0;

  for (const char of seed) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  return `${((Math.abs(hash) + index * 17) % 11) - 5}deg`;
}

export default function HubEventRow({
  eventSlots,
  loadedHub,
  onPlayEvent,
}: HubEventRowProps) {
  return (
    <div className="flex h-full items-center justify-center mt-4">
      <style>{`
        @keyframes hub-event-deal-in {
          0% {
            opacity: 0;
            transform: translate3d(60px, -180px, 0) rotate(-18deg) scale(0.72);
            filter: drop-shadow(0 24px 26px rgba(0, 0, 0, 0.45));
          }

          58% {
            opacity: 1;
            transform: translate3d(-6px, 10px, 0) rotate(calc(var(--slot-tilt) + 3deg)) scale(1.03);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            filter: none;
          }
        }

        .hub-event-deal-in {
          opacity: 0;
          animation: hub-event-deal-in 540ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          transform-origin: 50% 45%;
          will-change: transform, opacity, filter;
        }

        .hub-event-card-layer {
          transform: rotate(var(--slot-tilt)) scale(1);
        }

        .group:hover .hub-event-card-layer {
          transform: rotate(0deg) scale(1.04);
          filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.45));
        }
      `}</style>

      <div className="mt-4 flex h-full w-full gap-4">
        {eventSlots.map((slot, index) => {
          const event = slot.event
            ? loadedHub?.events[slot.event.opens.eventFile]
            : null;

          const tilt = getStableTilt(
            `${slot.id}-${event?.name ?? "empty"}`,
            index
          );

          return (
            <div key={slot.id} className="flex flex-1 items-center justify-center">
              {slot.event && event ? (
                <HubEventCard
                  key={`${slot.id}-${event.name}-${event.cardImage ?? "no-image"}`}
                  eventId={event.name}
                  eventImage={event.cardImage ?? null}
                  tilt={tilt}
                  animationDelay={index * 140}
                  onClick={(element) =>
                    onPlayEvent(slot.event!.opens.eventFile, element, slot.id)
                  }
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}