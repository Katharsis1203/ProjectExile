import type {
  CheckedEventChoice,
  EventNode,
  GameEvent,
} from "../../../types/event";
import type { EventPoolEntry } from "../../../types/hub";
import { getImageUrl } from "../../../shared/lib/publicAssetUrl";
import HubEventCard from "./HubEventCard";

type HubEventRowProps = {
  eventSlots: readonly (EventPoolEntry | null)[];
  events: Readonly<Record<string, GameEvent>> | null;
  onPlayEvent: (
    entry: EventPoolEntry,
    cardElement: HTMLElement,
    slotIndex: number,
  ) => void;
};

function getOpeningNode(
  event: GameEvent,
  entry: EventPoolEntry,
): EventNode | null {
  return event.nodes[entry.opens.nodeId] ?? null;
}

function getEventDetail(node: EventNode | null): string {
  const checkedChoice = node?.choices.find(
    (choice): choice is CheckedEventChoice =>
      choice.type === "checked" && choice.statChecks.length > 0,
  );
  const firstCheck = checkedChoice?.statChecks[0];

  if (!firstCheck) {
    return "Uncertain";
  }

  const stat =
    firstCheck.stat.charAt(0).toUpperCase() + firstCheck.stat.slice(1);
  return `${stat} · ${firstCheck.difficulty}`;
}

export default function HubEventRow({
  eventSlots,
  events,
  onPlayEvent,
}: HubEventRowProps) {
  return (
    <section aria-label="Available leads" className="min-h-0">
      <div className="grid min-h-0 w-full grid-cols-1 gap-4 px-1 py-1 sm:grid-cols-3 xl:h-full xl:items-stretch">
        {eventSlots.map((entry, index) => {
          const event = entry ? events?.[entry.opens.eventFile] : null;
          const openingNode = event && entry ? getOpeningNode(event, entry) : null;

          return (
            <div
              key={`event-slot-${index}`}
              className="hub-event-slot-elevation flex min-h-[220px] items-stretch justify-center xl:min-h-0"
            >
              {entry && event ? (
                <HubEventCard
                  key={`${entry.id}-${event.id}-${event.cardImage ?? "no-image"}`}
                  title={event.name}
                  image={event.cardImage ?? null}
                  colourImage={event.cardColourImage ?? event.cardImage ?? null}
                  categoryLabel={event.tags?.[0] ?? "Local lead"}
                  detail={getEventDetail(openingNode)}
                  animationDelay={index * 140}
                  onClick={(element) => onPlayEvent(entry, element, index)}
                  {...(openingNode?.text ? { hook: openingNode.text } : {})}
                />
              ) : (
                <div
                  className="relative h-full w-full bg-[length:100%_100%] bg-center bg-no-repeat p-2.5 opacity-55"
                  style={{ backgroundImage: `url("${getImageUrl("parch2.png")}")` }}
                >
                  <div className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-[#68563e]/30 bg-[rgba(236,222,190,0.42)] shadow-[inset_0_0_20px_rgba(78,60,37,0.08)]">
                    <div className="text-center text-[#5f513f]/55">
                      <div className="mx-auto mb-2 h-5 w-5 rounded-full border border-current opacity-60" />
                      <p className="font-serif text-sm font-semibold">
                        Undrawn lead
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
