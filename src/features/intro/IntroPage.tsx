import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  advanceEventSession,
  createPassageSession,
  type PassageSession,
} from "../../engine/eventSession";
import { loadEvent } from "../../infrastructure/content/contentRepository";
import type { EventChoice, GameEvent } from "../../types/event";
import type { PlayerState } from "../../types/player";
import { getImageUrl } from "../../shared/lib/publicAssetUrl";
import NodePassage from "../events/components/NodePassage";

const INTRO_EVENT_FILE = "intro_morning_at_home.json";
const INTRO_OPENING_NODE = "start";

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
  const titlePageStyle = {
    "--title-night-image": `url("${getImageUrl("night.png")}")`,
    "--parchment-image": `url("${getImageUrl("parchment.png")}")`,
  } as CSSProperties;
  const initialNodeIdRef = useRef(initialNodeId);
  const initialCompleteRef = useRef(initialComplete);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [session, setSession] = useState<PassageSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const hasReachedEndpoint = Boolean(
    session && (session.isComplete || session.node.choices.length === 0),
  );

  useEffect(() => {
    if (session || loadError) {
      onReady?.();
    }
  }, [loadError, onReady, session]);

  useEffect(() => {
    let ignore = false;

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
        setSession(
          createPassageSession(openingNode, {
            isComplete: initialCompleteRef.current,
            canReturn:
              openingNode.id === INTRO_OPENING_NODE &&
              !initialCompleteRef.current,
          }),
        );
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

    const outcome = advanceEventSession({
      event: gameEvent,
      session,
      choice,
      player,
    });

    if (outcome.kind === "blocked") {
      setInteractionError(outcome.message ?? "That choice could not be completed.");
      return;
    }

    if (outcome.player !== player) setPlayer(outcome.player);

    if (outcome.kind === "invalid-target") {
      setInteractionError(outcome.message ?? "That choice could not be completed.");
      return;
    }

    setInteractionError(null);

    if (outcome.kind === "finished") {
      onComplete();
      return;
    }

    setSession(outcome.session);
    onProgress?.(
      outcome.session.node.id,
      outcome.kind === "complete",
    );
  }

  if (loadError) {
    return (
      <main className="title-page" style={titlePageStyle}>
        <div className="title-page__scene" aria-hidden="true">
          <img src={getImageUrl("backy.png")} alt="" className="title-page__scene-image" />
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
              onClick={() => {
                setLoadError(null);
                setLoadAttempt((attempt) => attempt + 1);
              }}
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
    <main className="title-page" style={titlePageStyle}>
      <div className="title-page__scene" aria-hidden="true">
        <img src={getImageUrl("backy.png")} alt="" className="title-page__scene-image" />
        <div className="title-page__scene-wash" />
        <div className="title-page__scene-vignette" />
      </div>

      {session ? (
        <NodePassage
          node={{ ...session.node, image: session.lastKnownImage }}
          resolution={session.resolution}
          consequences={session.appliedEffects}
          isComplete={session.isComplete}
          allowReturn={session.canReturn}
          transition={INTRO_TRANSITION}
          isClosing={false}
          playerStats={player.stats}
          playerInventory={player.inventory}
          onChoose={handleChoose}
          onReturn={hasReachedEndpoint ? onComplete : onBackToTitle}
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
