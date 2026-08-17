import { useEffect, useRef, useState } from "react";
import { DEFAULT_PLAYER } from "../data/defaultPlayer";
import { drawWeightedEvents } from "../engine/eventSelection";
import { resolveChoice } from "../engine/eventRules";
import { normaliseLighting } from "../engine/sceneEffects";
import { loadHub } from "../services/content/contentRepository";
import type {
  EventChoice,
  EventNode,
  NodeResolution,
} from "../types/event";
import type { EventPoolEntry, LoadedHub } from "../types/hub";
import HubEventRow from "../components/hub/HubEventRow";
import HubPlayerPanel from "../components/hub/HubPlayerPanel";
import HubScenePanel from "../components/hub/HubScenePanel";
import HubSidebar from "../components/hub/HubSidebar";
import NodePassage from "../components/node/NodePassage";

const EVENT_SLOT_COUNT = 3;
const NODE_EXIT_DURATION_MS = 360;

type EventTransition = {
  fromX: number;
  fromY: number;
  fromScaleX: number;
  fromScaleY: number;
};

type EventSession = {
  eventFile: string;
  node: EventNode;
  resolution: NodeResolution | null;
  transition: EventTransition;
  slotIndex: number;
  isClosing: boolean;
};

function createEventSlots(
  entries: readonly EventPoolEntry[] = [],
): Array<EventPoolEntry | null> {
  return Array.from(
    { length: EVENT_SLOT_COUNT },
    (_, index) => entries[index] ?? null,
  );
}

function getTransitionFromElement(element: HTMLElement): EventTransition {
  const rect = element.getBoundingClientRect();

  return {
    fromX: rect.left + rect.width / 2 - window.innerWidth / 2,
    fromY: rect.top + rect.height / 2 - window.innerHeight / 2,
    fromScaleX: rect.width / 820,
    fromScaleY: rect.height / 720,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unknown content error occurred.";
}

export default function HubPage() {
  const [hubContent, setHubContent] = useState<LoadedHub | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [eventSlots, setEventSlots] = useState(createEventSlots);
  const [eventSession, setEventSession] = useState<EventSession | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let ignoreResult = false;

    void loadHub("snowlands_hub")
      .then((content) => {
        if (!ignoreResult) {
          setHubContent(content);
        }
      })
      .catch((error: unknown) => {
        if (!ignoreResult) {
          setLoadError(getErrorMessage(error));
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [loadAttempt]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  const scene = hubContent?.hub.scene;
  const sceneLighting = normaliseLighting(
    scene?.effects?.lighting ?? scene?.tone,
  );
  const showBirds = sceneLighting !== "night";

  function handleDrawEvents(pool: readonly EventPoolEntry[]): void {
    const selectedEvents = drawWeightedEvents(pool, EVENT_SLOT_COUNT);
    setEventSlots(createEventSlots(selectedEvents));
    setInteractionError(null);
  }

  function handleExplore(): void {
    if (hubContent) {
      handleDrawEvents(hubContent.hub.eventPools.explore);
    }
  }

  function handleLife(): void {
    if (hubContent) {
      handleDrawEvents(hubContent.hub.eventPools.life);
    }
  }

  function handleRetryLoad(): void {
    setLoadError(null);
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handlePlayEvent(
    entry: EventPoolEntry,
    cardElement: HTMLElement,
    slotIndex: number,
  ): void {
    const gameEvent = hubContent?.events[entry.opens.eventFile];
    const openingNode = gameEvent?.nodes[entry.opens.nodeId];

    if (!gameEvent || !openingNode) {
      setInteractionError(
        `Could not open ${entry.opens.eventFile} at ${entry.opens.nodeId}.`,
      );
      return;
    }

    setInteractionError(null);
    setEventSession({
      eventFile: entry.opens.eventFile,
      node: openingNode,
      resolution: null,
      transition: getTransitionFromElement(cardElement),
      slotIndex,
      isClosing: false,
    });
  }

  function restoreHubFocus(): void {
    window.requestAnimationFrame(() => {
      const focusTarget = document.querySelector<HTMLButtonElement>(
        "[data-event-card], [data-hub-action]",
      );
      focusTarget?.focus();
    });
  }

  function closeNode(): void {
    if (!eventSession || eventSession.isClosing) {
      return;
    }

    const playedSlotIndex = eventSession.slotIndex;
    setEventSession({ ...eventSession, isClosing: true });

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    const closeDuration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : NODE_EXIT_DURATION_MS;

    closeTimerRef.current = window.setTimeout(() => {
      setEventSlots((slots) =>
        slots.map((entry, index) =>
          index === playedSlotIndex ? null : entry,
        ),
      );
      setEventSession(null);
      closeTimerRef.current = null;
      restoreHubFocus();
    }, closeDuration);
  }

  function handleChoose(choice: EventChoice): void {
    if (!eventSession || eventSession.isClosing) {
      return;
    }

    if (choice.returnToHub || choice.endEvent) {
      closeNode();
      return;
    }

    const result = resolveChoice(choice, DEFAULT_PLAYER.stats);

    if (!result.next) {
      closeNode();
      return;
    }

    const nextNode =
      hubContent?.events[eventSession.eventFile]?.nodes[result.next];

    if (!nextNode) {
      setInteractionError(
        `The event targets a missing node named ${result.next}.`,
      );
      closeNode();
      return;
    }

    setEventSession({
      ...eventSession,
      node: nextNode,
      resolution: {
        checks: result.checks,
        ...(result.flavourText
          ? { flavourText: result.flavourText }
          : {}),
      },
    });
  }

  return (
    <div
      className={`hub-page-background hub-page-background--${sceneLighting} min-h-screen overflow-auto text-white`}
    >
      <div
        aria-hidden="true"
        className={`hub-page-clouds hub-page-clouds--${sceneLighting}`}
      />
      <div
        aria-hidden="true"
        className={`hub-page-skyglow hub-page-skyglow--${sceneLighting}`}
      />
      {showBirds ? (
        <div
          aria-hidden="true"
          className={`hub-page-birds hub-page-birds--${sceneLighting}`}
        />
      ) : null}
      <div aria-hidden="true" className="hub-page-grain" />

      <div className="relative z-10 flex min-h-screen justify-center p-2 sm:p-4 xl:items-center">
        <div className="w-full max-w-[1350px] px-0 sm:px-4 xl:h-[clamp(720px,calc(100vh-2rem),900px)] xl:py-2">
          <div className="grid gap-2 xl:h-full xl:grid-rows-[minmax(0,3.78fr)_minmax(0,1.02fr)]">
            <div className="grid min-h-0 gap-2 xl:grid-cols-[1.15fr_3.35fr_1.25fr]">
              <HubScenePanel
                hub={hubContent?.hub ?? null}
                loadError={loadError}
                onRetry={handleRetryLoad}
              />
              <HubPlayerPanel
                player={DEFAULT_PLAYER}
                disabled={!hubContent}
                onExplore={handleExplore}
                onLife={handleLife}
              />
              <HubSidebar hub={hubContent?.hub ?? null} />
            </div>

            <HubEventRow
              eventSlots={eventSlots}
              events={hubContent?.events ?? null}
              onPlayEvent={handlePlayEvent}
            />
          </div>
        </div>
      </div>

      {interactionError ? (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-[110] max-w-[min(92vw,680px)] -translate-x-1/2 rounded-md border border-red-200/50 bg-red-950/90 px-4 py-3 text-sm text-red-50 shadow-xl"
        >
          {interactionError}
        </div>
      ) : null}

      {eventSession ? (
        <NodePassage
          node={eventSession.node}
          resolution={eventSession.resolution}
          transition={eventSession.transition}
          isClosing={eventSession.isClosing}
          playerStats={DEFAULT_PLAYER.stats}
          onChoose={handleChoose}
          onReturn={closeNode}
        />
      ) : null}
    </div>
  );
}
