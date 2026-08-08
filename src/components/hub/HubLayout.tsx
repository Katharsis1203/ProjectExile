// src/components/hub/HubLayout.tsx

import { useEffect, useMemo, useState } from "react";
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

type SceneLighting = "day" | "dawn" | "dusk" | "night" | "overcast";

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

function normaliseLighting(value: unknown): SceneLighting {
  const lighting = typeof value === "string" ? value.toLowerCase() : "day";

  switch (lighting) {
    case "day":
    case "dawn":
    case "dusk":
    case "night":
    case "overcast":
      return lighting;
    default:
      return "day";
  }
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

  const sceneLighting = useMemo(() => {
    const scene = loadedHub?.hub?.scene as
      | {
          tone?: string;
          effects?: { lighting?: string };
        }
      | undefined;

    return normaliseLighting(scene?.effects?.lighting ?? scene?.tone);
  }, [loadedHub]);

  const showBirds = sceneLighting !== "night";

  function handleDrawEvents(pool: EventPoolEntry[]) {
    const selectedEvents = getRandomUniqueEvents(pool, 3);

    setEventSlots((slots) =>
      slots.map((slot, index) => ({
        ...slot,
        event: selectedEvents[index] ?? null,
      }))
    );
  }

  function handleExplore() {
    if (!loadedHub) return;
    handleDrawEvents(loadedHub.hub.eventPools.explore);
  }

  function handleLife() {
    if (!loadedHub) return;
    handleDrawEvents(loadedHub.hub.eventPools.life);
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
    <div className={`hub-page-background hub-page-background--${sceneLighting} min-h-screen overflow-auto text-white`}>
      <div aria-hidden="true" className={`hub-page-clouds hub-page-clouds--${sceneLighting}`} />
      <div aria-hidden="true" className={`hub-page-skyglow hub-page-skyglow--${sceneLighting}`} />
      {showBirds ? (
        <div aria-hidden="true" className={`hub-page-birds hub-page-birds--${sceneLighting}`} />
      ) : null}
      <div aria-hidden="true" className="hub-page-grain" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="h-225 w-337.5 shrink-0 px-4 py-2">
          <div className="grid h-full grid-rows-[minmax(0,3.78fr)_minmax(0,1.02fr)] gap-2">
            <div className="flex gap-2">
              <HubAreaPanel
                onExplore={handleExplore}
                onLife={handleLife}
              />

              <HubMainContent hub={loadedHub?.hub ?? null} />
              <HubSideBar hub={loadedHub?.hub ?? null} />
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
