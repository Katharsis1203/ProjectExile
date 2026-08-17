import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  applyEventEffects,
  areChoiceRequirementsMet,
  describeChoiceRequirement,
  getUnmetChoiceRequirements,
} from "../../engine/playerState";
import { resolveChoice } from "../../engine/eventRules";
import { loadEvent } from "../../services/content/contentRepository";
import type {
  EventChoice,
  EventNode,
  GameEvent,
  NodeResolution,
} from "../../types/event";
import type { AppliedEventEffect, PlayerState } from "../../types/player";
import NodePassage from "../node/NodePassage";

const INTRO_EVENT_FILE = "introduction.json";
const INTRO_OPENING_NODE = "road_north";

const INTRO_TRANSITION = {
  fromX: 0,
  fromY: 24,
  fromScaleX: 0.94,
  fromScaleY: 0.94,
};

type IntroPageProps = {
  player: PlayerState;
  setPlayer: Dispatch<SetStateAction<PlayerState>>;
  initialNodeId?: string;
  initialComplete?: boolean;
  onProgress?: (nodeId: string, isComplete: boolean) => void;
  onBackToTitle: () => void;
  onComplete: () => void;
  onReady?: () => void;
};

type IntroSession = {
  node: EventNode;
  lastKnownImage: string | null;
  resolution: NodeResolution | null;
  consequences: AppliedEventEffect[];
  allowReturn: boolean;
  isComplete: boolean;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load the introduction.";
}

export default function IntroPage({
  player,
  setPlayer,
  initialNodeId = INTRO_OPENING_NODE,
  initialComplete = false,
  onProgress,
  onBackToTitle,
  onComplete,
  onReady,
}: IntroPageProps) {
  const initialNodeIdRef = useRef(initialNodeId);
  const initialCompleteRef = useRef(initialComplete);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [session, setSession] = useState<IntroSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (session || loadError) {
      onReady?.();
    }
  }, [loadError, onReady, session]);

  useEffect(() => {
    let ignore = false;

    setLoadError(null);

    void loadEvent(INTRO_EVENT_FILE)
      .then((event) => {
        if (ignore) return;

        const requestedNode = event.nodes[initialNodeIdRef.current];
        const openingNode = requestedNode ?? event.nodes[INTRO_OPENING_NODE];
        if (!openingNode) {
          throw new Error(
            `Introduction is missing opening node "${INTRO_OPENING_NODE}".`,
          );
        }

        setGameEvent(event);
        setSession({
          node: openingNode,
          lastKnownImage: openingNode.image ?? null,
          resolution: null,
          consequences: [],
          allowReturn: openingNode.id === INTRO_OPENING_NODE && !initialCompleteRef.current,
          isComplete: initialCompleteRef.current,
        });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoadError(getErrorMessage(error));
      });

    return () => {
      ignore = true;
    };
  }, [loadAttempt]);

  function handleChoose(choice: EventChoice): void {
    if (!session || !gameEvent) return;

    if (!areChoiceRequirementsMet(choice, player.inventory)) {
      const missing = getUnmetChoiceRequirements(choice, player.inventory)
        .map(describeChoiceRequirement)
        .join(", ");
      setInteractionError(`This choice requires: ${missing}.`);
      return;
    }

    setInteractionError(null);

    const result = resolveChoice(choice, player.stats);
    const applied = applyEventEffects(player, result.effects);

    if (applied.player !== player) {
      setPlayer(applied.player);
    }

    const resolution: NodeResolution = {
      checks: result.checks,
      ...(result.flavourText ? { flavourText: result.flavourText } : {}),
    };

    const hasOutcomeToShow =
      applied.appliedEffects.length > 0 ||
      result.checks.length > 0 ||
      Boolean(result.flavourText);

    if (choice.returnToHub || choice.endEvent || !result.next) {
      if (hasOutcomeToShow) {
        setSession({
          ...session,
          resolution,
          consequences: applied.appliedEffects,
          allowReturn: false,
          isComplete: true,
        });
        onProgress?.(session.node.id, true);
      } else {
        onComplete();
      }
      return;
    }

    const nextNode = gameEvent.nodes[result.next];
    if (!nextNode) {
      setInteractionError(`The introduction targets a missing node named ${result.next}.`);
      return;
    }

    setSession({
      node: nextNode,
      lastKnownImage: nextNode.image ?? session.lastKnownImage,
      resolution,
      consequences: applied.appliedEffects,
      allowReturn: false,
      isComplete: false,
    });
    onProgress?.(nextNode.id, false);
  }

  if (loadError) {
    return (
      <main className="title-page">
        <div className="title-page__scene" aria-hidden="true">
          <img src="/images/backy.png" alt="" className="title-page__scene-image" />
          <div className="title-page__scene-wash" />
          <div className="title-page__scene-vignette" />
        </div>

        <section className="relative z-10 mx-auto mt-[12vh] w-[min(620px,92vw)] rounded-md border border-[#b9a37f]/60 bg-[#f4e6c9]/95 p-7 text-[#3b2b1d] shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#75624c]">
            Introduction unavailable
          </div>
          <p className="mt-3 text-sm leading-6">{loadError}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="rounded border border-[#aa8d61] bg-[#f8ecd4] px-4 py-2 font-semibold"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded border border-[#aa8d61]/70 px-4 py-2"
              onClick={onBackToTitle}
            >
              Back to title
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="title-page">
      <div className="title-page__scene" aria-hidden="true">
        <img src="/images/backy.png" alt="" className="title-page__scene-image" />
        <div className="title-page__scene-wash" />
        <div className="title-page__scene-vignette" />
      </div>

      {session ? (
        <NodePassage
          node={{ ...session.node, image: session.lastKnownImage }}
          resolution={session.resolution}
          consequences={session.consequences}
          isComplete={session.isComplete}
          allowReturn={session.allowReturn}
          transition={INTRO_TRANSITION}
          isClosing={false}
          playerStats={player.stats}
          playerInventory={player.inventory}
          onChoose={handleChoose}
          onReturn={session.isComplete ? onComplete : onBackToTitle}
        />
      ) : null}

      {interactionError ? (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-[140] max-w-[min(92vw,680px)] -translate-x-1/2 rounded-md border border-red-200/50 bg-red-950/90 px-4 py-3 text-sm text-red-50 shadow-xl"
        >
          {interactionError}
        </div>
      ) : null}
    </main>
  );
}
