import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  formatStatName,
  getCheckChance,
  getStatPalette,
  type PlayerStats,
} from "../../engine/eventRules";
import type {
  EventChoice,
  EventNode,
  NodeResolution,
} from "../../types/event";
import type { AppliedEventEffect, PlayerInventory } from "../../types/player";
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
  consequences: AppliedEventEffect[];
  isComplete: boolean;
  allowReturn: boolean;
  transition: EventTransition;
  isClosing: boolean;
  playerStats: PlayerStats;
  playerInventory: PlayerInventory;
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
  consequences,
  isComplete,
  allowReturn,
  transition,
  isClosing,
  playerStats,
  playerInventory,
  onChoose,
  onReturn,
}: NodePassageProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onReturnRef = useRef(onReturn);
  const isClosingRef = useRef(isClosing);
  const allowReturnRef = useRef(allowReturn);
  const [expandedCheckIndex, setExpandedCheckIndex] = useState<number | null>(null);

  useEffect(() => {
    onReturnRef.current = onReturn;
    isClosingRef.current = isClosing;
    allowReturnRef.current = allowReturn;
  }, [allowReturn, isClosing, onReturn]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusHeading = window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (
        event.key === "Escape" &&
        !isClosingRef.current &&
        allowReturnRef.current
      ) {
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
    setExpandedCheckIndex(null);
  }, [node.id, resolution]);

  function preventClosingInteraction(event: ReactKeyboardEvent): void {
    if (isClosing) {
      event.preventDefault();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/35 px-2 pb-2 pt-2 backdrop-blur-sm sm:px-6 sm:pb-4 sm:pt-3">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={preventClosingInteraction}
        className={`relative max-h-[calc(100dvh-1rem)] min-h-[min(720px,calc(100dvh-1rem))] w-[min(760px,calc(100vw-1rem))] overflow-y-auto bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-6 pb-9 pt-14 text-[#3b2b1d] drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)] sm:w-[min(760px,90vw)] sm:px-12 sm:pb-11 sm:pt-12 ${isClosing ? "node-page-exit" : "node-page-enter"}`}
        style={
          {
            "--node-from-x": `${transition.fromX}px`,
            "--node-from-y": `${transition.fromY}px`,
            "--node-from-scale-x": transition.fromScaleX,
            "--node-from-scale-y": transition.fromScaleY,
          } as CSSProperties
        }
      >
        {allowReturn ? (
          <button
            type="button"
            disabled={isClosing}
            onClick={onReturn}
            className="absolute right-6 top-5 rounded-md border border-[#cdb890] bg-[#f6ead1] px-2.5 py-1 text-[13px] font-semibold transition hover:bg-[#fbf2df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4d37] disabled:cursor-wait disabled:opacity-60 sm:right-9 sm:top-7"
          >
            Return
          </button>
        ) : null}

        <h1
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="mb-2.5 pr-24 text-[1.7rem] font-semibold tracking-tight outline-none sm:text-[2rem]"
        >
          {node.title}
        </h1>

        <div className="mb-4 border-b border-[#c8b28c]" />

        {node.image ? (
          <img
            src={
              node.image.startsWith("/")
                ? node.image
                : `/images/events/${node.image}`
            }
            alt={node.title}
            className="mx-auto mb-4 max-h-[245px] w-[78%] rounded-md border border-[#9f8b6a] object-cover shadow-sm"
          />
        ) : null}

        {(resolution?.checks.length || consequences.length > 0) ? (
          <div
            aria-live="polite"
            className="mb-3 rounded-sm bg-[rgba(255,248,235,0.64)] px-3.5 py-2.5 text-[0.92rem] leading-6 text-[#5f5141]"
          >
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f604f]">
              Results
            </div>

            {resolution?.checks.length ? (
              <p>
                <span className="font-medium text-[#776856]">Checks: </span>
                {resolution.checks.map((check, index) => {
                  const isExpanded = expandedCheckIndex === index;

                  return (
                    <span key={`${check.stat}-${check.difficulty}-${index}`}>
                      {index > 0 ? <span className="text-[#9b8a72]"> · </span> : null}
                      <span className="text-[#5f5141]">
                        {formatStatName(check.stat)} — {" "}
                      </span>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedCheckIndex(isExpanded ? null : index)}
                        className="inline border-0 bg-transparent p-0 font-semibold underline decoration-dotted decoration-1 underline-offset-[3px] transition-opacity hover:opacity-70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f604f]/40"
                        style={{ color: check.success ? "#3f7148" : "#a34f43" }}
                      >
                        {check.success ? "Success" : "Fail"}
                      </button>
                    </span>
                  );
                })}
                .
              </p>
            ) : null}

            {consequences.length > 0 ? (
              <p className={resolution?.checks.length ? "mt-0.5" : ""}>
                <span className="font-medium text-[#776856]">Effects: </span>
                {consequences.map((effect, index) => {
                  const isGain = effect.amount > 0;
                  const sign = isGain ? "+" : "";
                  const tone = effect.type === "item"
                    ? "#65553e"
                    : isGain
                      ? "#496347"
                      : "#7b4b42";

                  return (
                    <span key={`${effect.type}-${index}`}>
                      {index > 0 ? <span className="text-[#9b8a72]"> · </span> : null}
                      <span className="font-semibold" style={{ color: tone }}>
                        {effect.type === "resource" ? effect.label : effect.name} {sign}{effect.amount}
                      </span>
                      <span className="text-[0.82rem] text-[#80715f]">
                        {effect.type === "resource"
                          ? ` (${effect.after}/${effect.max})`
                          : ` (${effect.after} held)`}
                      </span>
                    </span>
                  );
                })}
                .
              </p>
            ) : null}

            {expandedCheckIndex !== null && resolution?.checks[expandedCheckIndex] ? (() => {
              const check = resolution.checks[expandedCheckIndex];
              const chance = getCheckChance(check, playerStats);
              const total = check.statValue + check.roll;
              const palette = getStatPalette(check.stat);

              return (
                <p className="mt-2 border-t border-[#bca98b]/35 pt-2 text-[0.82rem] italic leading-5 text-[#746553]">
                  <span className="not-italic font-semibold" style={{ color: palette.text }}>
                    {formatStatName(check.stat)} detail:
                  </span>{" "}
                  {check.statValue} base + {check.roll} roll = {total}, against difficulty {check.difficulty}. The pre-roll success chance was {chance}%.
                </p>
              );
            })() : null}
          </div>
        ) : null}

        {resolution?.flavourText ? (
          <div className="mb-3 rounded-sm bg-[rgba(255,248,235,0.64)] px-3.5 py-2.5 text-[0.94rem] italic leading-6 text-[#6f604f]">
            {resolution.flavourText}
          </div>
        ) : null}

        {node.miscText ? (
          <div className="mb-3 rounded-sm bg-[rgba(255,248,235,0.64)] px-3.5 py-2.5 text-[0.94rem] italic leading-6 text-[#6f604f]">
            {node.miscText}
          </div>
        ) : null}

        <p id={descriptionId} className="mb-6 text-[0.98rem] leading-[1.65] text-[#4c4032]">
          {node.text}
        </p>

        <div className="flex flex-col gap-2.5">
          {isComplete ? (
            <NodeChoiceButton
              choice={{
                type: "simple",
                text: "Return to the hub",
                returnToHub: true,
              }}
              playerStats={playerStats}
              playerInventory={playerInventory}
              disabled={isClosing}
              onClick={onReturn}
            />
          ) : node.choices.length > 0 ? (
            node.choices.map((choice, index) => (
              <NodeChoiceButton
                key={`${choice.text}-${index}`}
                choice={choice}
                playerStats={playerStats}
                playerInventory={playerInventory}
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
              playerInventory={playerInventory}
              disabled={isClosing}
              onClick={onReturn}
            />
          )}
        </div>
      </section>
    </div>
  );
}
