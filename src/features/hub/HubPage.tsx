import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  canSpendActivityEnergy,
  loadActivityEnergy,
  recoverActivityEnergy,
  saveActivityEnergy,
  spendActivityEnergy,
} from "../../engine/activityEnergy";
import { areEventConditionsMet } from "../../engine/eventConditions";
import { drawWeightedEvents } from "../../engine/eventSelection";
import {
  discardInventoryItem,
  consumeInventoryItem,
} from "../../engine/playerState";
import {
  advanceEventSession,
  createPassageSession,
  type PassageSession,
} from "../../engine/eventSession";
import { normaliseLighting } from "../../engine/sceneEffects";
import { loadHub } from "../../infrastructure/content/contentRepository";
import type { EventChoice } from "../../types/event";
import type { EventPoolEntry, LoadedHub } from "../../types/hub";
import type { AppliedEventEffect, PlayerState } from "../../types/player";
import { getImageUrl } from "../../shared/lib/publicAssetUrl";
import NodePassage from "../events/components/NodePassage";
import InventoryPage from "../inventory/InventoryPage";
import HubEventRow from "./components/HubEventRow";
import HubPlayerPanel from "./components/HubPlayerPanel";
import HubScenePanel from "./components/HubScenePanel";
import HubSidebar from "./components/HubSidebar";
import "./components/HubElevation.css";

const EVENT_SLOT_COUNT = 3;
const NODE_EXIT_DURATION_MS = 360;

type EventTransition = {
  fromX: number;
  fromY: number;
  fromScaleX: number;
  fromScaleY: number;
};

type EventSession = PassageSession & {
  eventFile: string;
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
    fromScaleX: rect.width / 760,
    fromScaleY: rect.height / 720,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unknown content error occurred.";
}

type HubPageProps = {
  player: PlayerState;
  setPlayer: Dispatch<SetStateAction<PlayerState>>;
  onReady?: () => void;
};

export default function HubPage({ player, setPlayer, onReady }: HubPageProps) {
  const [activityEnergy, setActivityEnergy] = useState(() => loadActivityEnergy());
  const activityEnergyRef = useRef(activityEnergy);
  const [hubContent, setHubContent] = useState<LoadedHub | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [eventSlots, setEventSlots] = useState(createEventSlots);
  const eventSlotsRef = useRef(eventSlots);
  const [eventSession, setEventSession] = useState<EventSession | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryEffects, setInventoryEffects] = useState<AppliedEventEffect[]>([]);
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

  useEffect(() => {
    if (hubContent || loadError) {
      onReady?.();
    }
  }, [hubContent, loadError, onReady]);

  useEffect(() => {
    activityEnergyRef.current = activityEnergy;
    saveActivityEnergy(activityEnergy);
  }, [activityEnergy]);

  useEffect(() => {
    const recover = () => {
      setActivityEnergy((current) => {
        const next = recoverActivityEnergy(current, Date.now());
        activityEnergyRef.current = next;
        return next;
      });
    };

    const timer = window.setInterval(recover, 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") recover();
    };

    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  function setEventHand(nextSlots: Array<EventPoolEntry | null>): void {
    eventSlotsRef.current = nextSlots;
    setEventSlots(nextSlots);
  }

  function getEventIdentity(entry: EventPoolEntry): string {
    return `${entry.opens.eventFile}:${entry.opens.nodeId}`;
  }

  function handleDrawEvent(
    pool: readonly EventPoolEntry[],
    actionName: "Explore" | "Life",
  ): void {
    if (!hubContent) {
      return;
    }

    const currentSlots = eventSlotsRef.current;
    const emptySlotIndexes = currentSlots
      .map((entry, index) => (entry === null ? index : -1))
      .filter((index) => index >= 0);

    if (emptySlotIndexes.length === 0) {
      setInteractionError(
        "Your hand is full. Play a lead before drawing another.",
      );
      return;
    }

    const heldEvents = new Set(
      currentSlots
        .filter((entry): entry is EventPoolEntry => entry !== null)
        .map(getEventIdentity),
    );
    const selectedEvents = drawWeightedEvents(
      pool,
      emptySlotIndexes.length,
      Math.random,
      (entry) =>
        !heldEvents.has(getEventIdentity(entry)) &&
        areEventConditionsMet(entry.conditions, {
          player,
          hub: hubContent.hub,
        }),
    );

    if (selectedEvents.length === 0) {
      setInteractionError(
        `There are no eligible ${actionName.toLowerCase()} leads to draw right now.`,
      );
      return;
    }

    if (!spendHubActionEnergy()) {
      return;
    }

    const nextSlots = [...currentSlots];
    selectedEvents.forEach((selectedEvent, index) => {
      const slotIndex = emptySlotIndexes[index];
      if (slotIndex !== undefined) {
        nextSlots[slotIndex] = selectedEvent;
      }
    });
    setEventHand(nextSlots);
    setInteractionError(null);
  }

  function spendHubActionEnergy(): boolean {
    const result = spendActivityEnergy(activityEnergyRef.current);
    activityEnergyRef.current = result.state;
    setActivityEnergy(result.state);

    if (!result.spent) {
      setInteractionError(
        "You have no Energy available. Explore and Life recover as Energy recharges.",
      );
      return false;
    }

    return true;
  }

  function handleExplore(): void {
    if (hubContent) {
      handleDrawEvent(hubContent.hub.eventPools.explore, "Explore");
    }
  }

  function handleLife(): void {
    if (hubContent) {
      handleDrawEvent(hubContent.hub.eventPools.life, "Life");
    }
  }

  function handleRetryLoad(): void {
    setLoadError(null);
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleOpenInventory(): void {
    setInventoryEffects([]);
    setInteractionError(null);
    setInventoryOpen(true);
  }

  function handleCloseInventory(): void {
    setInventoryOpen(false);
    setInventoryEffects([]);
  }

  function handleUseInventoryItem(itemId: string): void {
    const applied = consumeInventoryItem(player, itemId);
    if (applied.player === player || applied.appliedEffects.length === 0) {
      return;
    }
    setPlayer(applied.player);
    setInventoryEffects(applied.appliedEffects);
  }

  function handleDiscardInventoryItem(itemId: string): void {
    const applied = discardInventoryItem(player, itemId);
    if (applied.player === player || applied.appliedEffects.length === 0) {
      return;
    }
    setPlayer(applied.player);
    setInventoryEffects(applied.appliedEffects);
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
      ...createPassageSession(openingNode),
      eventFile: entry.opens.eventFile,
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

  function closeNode(consumeCard = false): void {
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
      if (consumeCard) {
        setEventHand(
          eventSlotsRef.current.map((entry, index) =>
            index === playedSlotIndex ? null : entry,
          ),
        );
      }
      setEventSession(null);
      closeTimerRef.current = null;
      restoreHubFocus();
    }, closeDuration);
  }

  function handleChoose(choice: EventChoice): void {
    if (!eventSession || eventSession.isClosing) {
      return;
    }

    const gameEvent = hubContent?.events[eventSession.eventFile];
    if (!gameEvent) {
      setInteractionError(`The event ${eventSession.eventFile} is unavailable.`);
      return;
    }

    const outcome = advanceEventSession({
      event: gameEvent,
      session: eventSession,
      choice,
      player,
    });

    if (outcome.kind === "blocked") {
      setInteractionError(outcome.message ?? "That choice is unavailable.");
      return;
    }

    if (outcome.player !== player) setPlayer(outcome.player);

    if (outcome.kind === "invalid-target") {
      setInteractionError(outcome.message ?? "The event cannot continue.");
      closeNode();
      return;
    }

    setInteractionError(null);
    if (outcome.kind === "finished") {
      closeNode(true);
      return;
    }

    setEventSession({ ...eventSession, ...outcome.session });
  }

  return (
    <div
      className={`hub-page-background hub-page-background--${sceneLighting} min-h-screen overflow-auto text-white`}
      style={{
        "--hub-sky-image": `url("${getImageUrl("sky.png")}")`,
        "--hub-night-image": `url("${getImageUrl("night.png")}")`,
      } as CSSProperties}
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
          <div className="grid gap-2 xl:h-full xl:grid-rows-[minmax(0,3.55fr)_minmax(0,1.15fr)]">
            <div className="grid min-h-0 gap-2 xl:grid-cols-[1.15fr_3.35fr_1.25fr] xl:[&>*]:min-h-0">
              <HubScenePanel
                hub={hubContent?.hub ?? null}
                loadError={loadError}
                onRetry={handleRetryLoad}
              />
              <HubPlayerPanel
                player={player}
                activityEnergy={activityEnergy}
                disabled={
                  !hubContent ||
                  !canSpendActivityEnergy(activityEnergy) ||
                  eventSlots.every((entry) => entry !== null)
                }
                onExplore={handleExplore}
                onLife={handleLife}
              />
              <HubSidebar
                hub={hubContent?.hub ?? null}
                onInventory={handleOpenInventory}
              />
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
          className="fixed bottom-4 left-1/2 z-[140] max-w-[min(92vw,680px)] -translate-x-1/2 rounded-md border border-red-200/50 bg-red-950/90 px-4 py-3 text-sm text-red-50 shadow-xl"
        >
          {interactionError}
        </div>
      ) : null}

      {inventoryOpen ? (
        <InventoryPage
          player={player}
          recentEffects={inventoryEffects}
          onUseItem={handleUseInventoryItem}
          onDiscardItem={handleDiscardInventoryItem}
          onClose={handleCloseInventory}
        />
      ) : null}

      {eventSession ? (
        <NodePassage
          node={{
            ...eventSession.node,
            image: eventSession.lastKnownImage,
          }}
          resolution={eventSession.resolution}
          consequences={eventSession.appliedEffects}
          isComplete={eventSession.isComplete}
          allowReturn={eventSession.canReturn}
          transition={eventSession.transition}
          isClosing={eventSession.isClosing}
          playerStats={player.stats}
          playerInventory={player.inventory}
          onChoose={handleChoose}
          onReturn={() => closeNode(eventSession.isComplete)}
        />
      ) : null}
    </div>
  );
}
