import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { formatStatName, type PlayerStats } from "../../engine/eventRules";
import type {
  EventChoice,
  EventNode,
  NodeResolution,
} from "../../types/event";
import NodeChoiceButton from "./NodeChoiceButton";
import "./NodePassage.css";

type EventTransition = {
  fromX: number;
  fromY: number;
  fromScaleX: number;
  fromScaleY: number;
};

type NodePassageProps = {
  node: EventNode;
  resolution: NodeResolution | null;
  transition: EventTransition;
  isClosing: boolean;
  playerStats: PlayerStats;
  onChoose: (choice: EventChoice) => void;
  onReturn: () => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function NodePassage({
  node,
  resolution,
  transition,
  isClosing,
  playerStats,
  onChoose,
  onReturn,
}: NodePassageProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onReturnRef = useRef(onReturn);
  const isClosingRef = useRef(isClosing);

  useEffect(() => {
    onReturnRef.current = onReturn;
    isClosingRef.current = isClosing;
  }, [isClosing, onReturn]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusHeading = window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isClosingRef.current) {
        event.preventDefault();
        onReturnRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          document.activeElement === headingRef.current)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusHeading);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [node.id]);

  function preventClosingInteraction(event: ReactKeyboardEvent): void {
    if (isClosing) {
      event.preventDefault();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-2 backdrop-blur-sm sm:p-6">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={preventClosingInteraction}
        className={`relative max-h-[92dvh] min-h-[min(720px,92dvh)] w-[min(820px,calc(100vw-1rem))] overflow-y-auto bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-5 pb-8 pt-14 text-[#3b2b1d] drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)] sm:w-[min(820px,92vw)] sm:px-10 sm:pb-12 sm:pt-11 ${isClosing ? "node-page-exit" : "node-page-enter"}`}
        style={
          {
            "--node-from-x": `${transition.fromX}px`,
            "--node-from-y": `${transition.fromY}px`,
            "--node-from-scale-x": transition.fromScaleX,
            "--node-from-scale-y": transition.fromScaleY,
          } as CSSProperties
        }
      >
        <button
          type="button"
          disabled={isClosing}
          onClick={onReturn}
          className="absolute right-5 top-5 rounded-md border border-[#cdb890] bg-[#f6ead1] px-3 py-1 text-sm font-semibold transition hover:bg-[#fbf2df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4d37] disabled:cursor-wait disabled:opacity-60 sm:right-7 sm:top-6"
        >
          Return
        </button>

        <h1
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="mb-3 pr-24 text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
        >
          {node.title}
        </h1>

        <div className="mb-5 border-b border-[#c8b28c]" />

        {node.image ? (
          <img
            src={
              node.image.startsWith("/")
                ? node.image
                : `/images/events/${node.image}`
            }
            alt={node.title}
            className="mx-auto mb-5 max-h-[320px] w-[86%] rounded-md border border-[#9f8b6a] object-cover shadow-md"
          />
        ) : null}

        {resolution?.checks.length ? (
          <div
            aria-live="polite"
            className="mb-2 rounded-sm bg-[rgba(255,248,235,0.72)] px-4 py-3"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[#6f604f]">
              Checks
            </div>

            <div className="flex flex-wrap gap-4 text-sm font-bold">
              {resolution.checks.map((check, index) => (
                <span key={`${check.stat}-${check.difficulty}-${index}`}>
                  {formatStatName(check.stat)}{" "}
                  <span className={check.success ? "text-green-700" : "text-red-700"}>
                    {check.success ? "Success" : "Fail"}
                  </span>{" "}
                  <span className="font-normal text-[#6f604f]">
                    ({check.statValue} + {check.roll} vs {check.difficulty})
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {resolution?.flavourText ? (
          <div className="mb-4 rounded-sm bg-[rgba(255,248,235,0.72)] px-4 py-3 italic text-[#6f604f]">
            {resolution.flavourText}
          </div>
        ) : null}

        {node.miscText ? (
          <div className="mb-4 rounded-sm bg-[rgba(255,248,235,0.72)] px-4 py-3 italic text-[#6f604f]">
            {node.miscText}
          </div>
        ) : null}

        <p id={descriptionId} className="mb-8 text-[1.05rem] leading-7 text-[#4c4032]">
          {node.text}
        </p>

        <div className="flex flex-col gap-3">
          {node.choices.length > 0 ? (
            node.choices.map((choice, index) => (
              <NodeChoiceButton
                key={`${choice.text}-${index}`}
                choice={choice}
                playerStats={playerStats}
                disabled={isClosing}
                onClick={() => onChoose(choice)}
              />
            ))
          ) : (
            <NodeChoiceButton
              choice={{
                type: "simple",
                text: "Return to the hub",
                returnToHub: true,
              }}
              playerStats={playerStats}
              disabled={isClosing}
              onClick={onReturn}
            />
          )}
        </div>
      </section>
    </div>
  );
}
