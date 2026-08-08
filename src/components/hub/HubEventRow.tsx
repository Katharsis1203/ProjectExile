// src/components/hub/HubEventRow.tsx

import HubEventCard from "./HubEventCard";
import type { Event, HubEventSlot } from "../../types/event";
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

type RuntimeChoice = {
  type?: string;
  statChecks?: Array<{ stat?: string; difficulty?: number }>;
};

type RuntimeNode = {
  text?: string;
  choices?: RuntimeChoice[];
};

function getStartNode(event: Event): RuntimeNode | null {
  const nodes = (event as unknown as {
    nodes?: RuntimeNode[] | Record<string, RuntimeNode>;
  }).nodes;

  if (!nodes) return null;

  if (Array.isArray(nodes)) {
    return (
      nodes.find((node) => (node as RuntimeNode & { id?: string }).id === "start") ??
      nodes[0] ??
      null
    );
  }

  return nodes.start ?? Object.values(nodes)[0] ?? null;
}

function getEventDetail(event: Event) {
  const startNode = getStartNode(event);
  const checkedChoice = startNode?.choices?.find(
    (choice) => choice.type === "checked" && choice.statChecks?.length
  );
  const firstCheck = checkedChoice?.statChecks?.[0];

  if (!firstCheck?.stat) return "Uncertain";

  const stat = firstCheck.stat.charAt(0).toUpperCase() + firstCheck.stat.slice(1);
  return typeof firstCheck.difficulty === "number"
    ? `${stat} · ${firstCheck.difficulty}`
    : stat;
}

export default function HubEventRow({
  eventSlots,
  loadedHub,
  onPlayEvent,
}: HubEventRowProps) {
  return (
    <div className="flex h-full min-h-0 items-stretch justify-center">
      <style>{`
        @keyframes hub-event-deal-in {
          0% {
            opacity: 0;
            transform: translate3d(42px, -110px, 0) scale(0.86);
            filter: drop-shadow(0 24px 26px rgba(0, 0, 0, 0.45));
          }

          58% {
            opacity: 1;
            transform: translate3d(-4px, 6px, 0) scale(1.012);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
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
          transform: translateY(0) scale(1);
        }

        .group:hover .hub-event-card-layer,
        .group:focus-visible .hub-event-card-layer {
          transform: translateY(-7px) scale(1.018);
          box-shadow:
            0 16px 28px rgba(34, 40, 48, 0.24),
            inset 0 0 0 1px rgba(255, 250, 237, 0.48);
        }

        .hub-event-image-base {
          filter: grayscale(0.82) saturate(0.42) brightness(1.02) contrast(0.98);
          transition: filter 220ms ease;
        }

        .hub-event-ink-reveal {
          overflow: visible;
        }

        .hub-event-image-colour-svg {
          opacity: 0.98;
        }

        .hub-event-ink-blobs {
          isolation: isolate;
        }

        .hub-event-blob {
          transform-box: fill-box;
          transform-origin: center;
          transform: scale(0.04);
          transition-property: transform;
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }

        .hub-event-blob--1 {
          transition-duration: 980ms;
          transition-delay: 20ms;
        }

        .hub-event-blob--2 {
          transition-duration: 1180ms;
          transition-delay: 90ms;
        }

        .hub-event-blob--3 {
          transition-duration: 1080ms;
          transition-delay: 150ms;
        }

        .hub-event-blob--4 {
          transition-duration: 1240ms;
          transition-delay: 70ms;
        }

        .hub-event-blob--5 {
          transition-duration: 1320ms;
          transition-delay: 180ms;
        }

        .group:hover .hub-event-image-base,
        .group:focus-visible .hub-event-image-base {
          filter: grayscale(0.44) saturate(0.66) brightness(1.04) contrast(1);
        }

        .group:hover .hub-event-blob--1,
        .group:focus-visible .hub-event-blob--1 {
          transform: scale(8.2);
        }

        .group:hover .hub-event-blob--2,
        .group:focus-visible .hub-event-blob--2 {
          transform: scale(10.5);
        }

        .group:hover .hub-event-blob--3,
        .group:focus-visible .hub-event-blob--3 {
          transform: scale(9.2);
        }

        .group:hover .hub-event-blob--4,
        .group:focus-visible .hub-event-blob--4 {
          transform: scale(11);
        }

        .group:hover .hub-event-blob--5,
        .group:focus-visible .hub-event-blob--5 {
          transform: scale(12);
        }

        @media (prefers-reduced-motion: reduce) {
          .hub-event-blob {
            transition: none;
            transform: scale(12);
          }

          .group:hover .hub-event-card-layer,
          .group:focus-visible .hub-event-card-layer {
            transform: none;
          }
        }
      `}</style>

      <div className="flex h-full min-h-0 w-full gap-4 px-1 py-1">
        {eventSlots.map((slot, index) => {
          const event = slot.event
            ? loadedHub?.events[slot.event.opens.eventFile]
            : null;
          const startNode = event ? getStartNode(event) : null;

          return (
            <div
              key={slot.id}
              className="flex min-h-0 flex-1 items-stretch justify-center"
            >
              {slot.event && event ? (
                <HubEventCard
                  key={`${slot.id}-${event.name}-${event.cardImage ?? "no-image"}`}
                  eventTitle={event.name}
                  eventImage={event.cardImage ?? null}
                  categoryLabel={event.tags?.[0] ?? "Local lead"}
                  hook={startNode?.text}
                  detail={getEventDetail(event)}
                  animationDelay={index * 140}
                  onClick={(element) =>
                    onPlayEvent(slot.event!.opens.eventFile, element, slot.id)
                  }
                />
              ) : (
                <div className="relative h-full w-full bg-[url('/images/parch2.png')] bg-[length:100%_100%] bg-center bg-no-repeat p-2.5 opacity-55">
                  <div className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-[#68563e]/30 bg-[rgba(236,222,190,0.42)] shadow-[inset_0_0_20px_rgba(78,60,37,0.08)]">
                    <div className="text-center text-[#5f513f]/55">
                      <div className="mx-auto mb-2 h-5 w-5 rounded-full border border-current opacity-60" />
                      <p className="font-serif text-sm font-semibold">Undrawn lead</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
