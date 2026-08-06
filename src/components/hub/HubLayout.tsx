// src/components/hub/HubLayout.tsx

import { useEffect, useState } from "react";
import { loadHub } from "../../engine/loadHub";
import { loadNode } from "../../engine/loadNode";
import type { EventPoolEntry, HubEventSlot } from "../../types/event";
import type { LoadedHub } from "../../types/hub";
import type {
  CheckResult,
  NodeChoice,
  NodeData,
  NodeResolution,
} from "../../types/node";
import HubAreaPanel from "./HubAreaPanel";
import HubEventRow from "./HubEventRow";
import HubMainContent from "./HubMainContent";
import HubSideBar from "./HubSideBar";
import NodePassage from "../node/NodePassage";

const INITIAL_EVENT_SLOTS: HubEventSlot[] = [
  { id: "slot_1", event: null },
  { id: "slot_2", event: null },
  { id: "slot_3", event: null },
];

const PLAYER_STATS: Record<string, number> = {
  strength: 7,
  endurance: 8,
  perception: 8,
  survival: 6,
};

type EventTransition = {
  fromX: number;
  fromY: number;
  fromScaleX: number;
  fromScaleY: number;
} | null;

function getRandomUniqueEvents(pool: EventPoolEntry[], amount: number) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, amount);
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

function getStatValue(stat: string) {
  return PLAYER_STATS[stat.toLowerCase()] ?? 5;
}

function rollCheck(stat: string, difficulty: number): CheckResult {
  const value = getStatValue(stat);
  const roll = Math.floor(Math.random() * 6) + 1;
  const success = value + roll >= difficulty;

  return {
    stat,
    difficulty,
    value,
    success,
  };
}

function resolveCheckedChoice(choice: NodeChoice): NodeResolution & {
  next?: string;
} {
  const checks = (choice.statChecks ?? []).map((check) =>
    rollCheck(check.stat, check.difficulty)
  );

  const successCount = checks.filter((check) => check.success).length;

  const bucket = [...(choice.weighted?.buckets ?? [])]
    .sort((a, b) => b.threshold - a.threshold)
    .find((candidate) => successCount >= candidate.threshold);

  return {
    checks,
    flavourText: bucket?.flavourText,
    next: bucket?.next ?? choice.next,
  };
}

export default function HubLayout() {
  const [loadedHub, setLoadedHub] = useState<LoadedHub | null>(null);
  const [eventSlots, setEventSlots] =
    useState<HubEventSlot[]>(INITIAL_EVENT_SLOTS);

  const [activeEventFile, setActiveEventFile] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<NodeData | null>(null);
  const [resolution, setResolution] = useState<NodeResolution | null>(null);
  const [transition, setTransition] = useState<EventTransition>(null);
  const [isClosingNode, setIsClosingNode] = useState(false);
  const [playedSlotId, setPlayedSlotId] = useState<string | null>(null);

  useEffect(() => {
    loadHub("snowlands_hub").then(setLoadedHub).catch(console.error);
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

  async function handlePlayEvent(
    eventFile: string,
    cardElement: HTMLElement,
    slotId: string
  ) {
    setPlayedSlotId(slotId);
    setTransition(getTransitionFromElement(cardElement));
    setActiveEventFile(eventFile);
    setResolution(null);

    const startNode = await loadNode(eventFile, "start");
    setActiveNode(startNode);
  }

  async function handleChoose(choice: NodeChoice) {
    if (choice.returnToHub || choice.endEvent || !activeEventFile) {
      closeNode();
      return;
    }

    const result =
      choice.type === "checked"
        ? resolveCheckedChoice(choice)
        : { checks: [], next: choice.next };

    if (!result.next) {
      closeNode();
      return;
    }

    const nextNode = await loadNode(activeEventFile, result.next);

    if (!nextNode) {
      closeNode();
      return;
    }

    setResolution({
      checks: result.checks,
      flavourText: result.flavourText,
    });

    setActiveNode(nextNode);
  }

  function closeNode() {
    setIsClosingNode(true);

    window.setTimeout(() => {
      if (playedSlotId) {
        setEventSlots((slots) =>
          slots.map((slot) =>
            slot.id === playedSlotId ? { ...slot, event: null } : slot
          )
        );
      }

      setActiveNode(null);
      setActiveEventFile(null);
      setResolution(null);
      setTransition(null);
      setPlayedSlotId(null);
      setIsClosingNode(false);
    }, 360);
  }

  return (
    <div className="min-h-screen overflow-auto bg-[url('/images/snow.png')] bg-[length:100%_100%] text-white">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-225 w-337.5 shrink-0 p-4">
          <div className="grid h-full grid-rows-[4fr_1fr] gap-1">
            <div className="flex gap-2">
              <HubAreaPanel
                onExplore={handleExplore}
                backgroundImage={loadedHub?.hub.image ?? null}
              />

              <HubMainContent />
              <HubSideBar />
            </div>

            <HubEventRow
              eventSlots={eventSlots}
              loadedHub={loadedHub}
              onPlayEvent={handlePlayEvent}
            />
          </div>
        </div>
      </div>

      {activeNode ? (
        <NodePassage
          node={activeNode}
          resolution={resolution}
          transition={transition}
          isClosing={isClosingNode}
          getStatValue={getStatValue}
          onChoose={handleChoose}
          onReturn={closeNode}
        />
      ) : null}
    </div>
  );
}