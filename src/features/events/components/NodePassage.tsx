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
} from "../../../engine/eventRules";
import type {
  EventChoice,
  EventNode,
  NodeResolution,
} from "../../../types/event";
import type { AppliedEventEffect, PlayerInventory } from "../../../types/player";
import { useModalDialog } from "../../../shared/hooks/useModalDialog";
import {
  getEventImageUrl,
  getImageUrl,
  getPublicAssetUrl,
} from "../../../shared/lib/publicAssetUrl";
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

const TWO_COLUMN_WORD_THRESHOLD = 80;

function isLongNarrative(text: string = ""): boolean {
  return (text.match(/\S+/g)?.length ?? 0) >= TWO_COLUMN_WORD_THRESHOLD;
}

function FormattedNarrativeText({
  text,
  className,
  id,
  paragraphGapClass = "mt-2.5",
}: {
  text: string;
  className: string;
  id?: string;
  paragraphGapClass?: string;
}) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div
      id={id}
      className={`${className}${isLongNarrative(text) ? " node-narrative-columns" : ""}`}
    >
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className={`${index > 0 ? paragraphGapClass : ""} whitespace-pre-line`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

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
  const hasLongNarrative = [node.text, node.miscText, resolution?.flavourText]
    .some((text) => isLongNarrative(text));
  const [expandedCheck, setExpandedCheck] = useState<{
    passageKey: string;
    index: number;
  } | null>(null);
  const passageKey = `${node.id}:${resolution?.checks
    .map((check) => `${check.stat}:${check.difficulty}:${check.roll}`)
    .join("|") ?? "unresolved"}`;
  const expandedCheckIndex =
    expandedCheck?.passageKey === passageKey ? expandedCheck.index : null;

  useModalDialog({
    containerRef: dialogRef,
    initialFocusRef: headingRef,
    onEscape: onReturn,
    escapeEnabled: allowReturn && !isClosing,
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, [node.id, resolution]);

  function preventClosingInteraction(event: ReactKeyboardEvent): void {
    if (isClosing) {
      event.preventDefault();
    }
  }

  return (
    <div className="node-passage-scroll fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/35 px-2 pb-2 pt-2 backdrop-blur-sm sm:px-6 sm:pb-4 sm:pt-3">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-wide-passage={hasLongNarrative || undefined}
        onKeyDown={preventClosingInteraction}
        className={`relative min-h-[min(680px,calc(100dvh-1rem))] w-[min(700px,calc(100vw-1rem))] bg-[length:100%_100%] bg-center bg-no-repeat px-8 pb-12 pt-16 text-[#3b2b1d] drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)] sm:w-[min(700px,88vw)] sm:px-14 sm:pb-14 sm:pt-14 ${isClosing ? "node-page-exit" : "node-page-enter"}`}
        style={
          {
            "--node-from-x": `${transition.fromX}px`,
            "--node-from-y": `${transition.fromY}px`,
            "--node-from-scale-x": transition.fromScaleX,
            "--node-from-scale-y": transition.fromScaleY,
            backgroundImage: `url("${getImageUrl("parchment.png")}")`,
          } as CSSProperties
        }
      >
        {allowReturn ? (
          <button
            type="button"
            disabled={isClosing}
            onClick={onReturn}
            data-click-sound="event-drop"
            className="absolute right-8 top-6 rounded-md border border-[#cdb890] bg-[#f6ead1] px-2.5 py-1 text-[13px] font-semibold transition hover:bg-[#fbf2df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4d37] disabled:cursor-wait disabled:opacity-60 sm:right-14 sm:top-7"
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
                ? getPublicAssetUrl(node.image)
                : getEventImageUrl(node.image)
            }
            alt={node.title}
            className="mb-6 max-h-[220px] w-full rounded-md border border-[#9f8b6a] object-cover shadow-sm"
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
                        onClick={() =>
                          setExpandedCheck(
                            isExpanded ? null : { passageKey, index },
                          )
                        }
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
          <FormattedNarrativeText
            text={resolution.flavourText}
            paragraphGapClass="mt-1.5"
            className="mb-3 rounded-sm bg-[rgba(255,248,235,0.64)] px-3.5 py-2.5 text-[0.94rem] italic leading-6 text-[#6f604f]"
          />
        ) : null}

        {node.miscText ? (
          <FormattedNarrativeText
            text={node.miscText}
            paragraphGapClass="mt-1.5"
            className="mb-3 rounded-sm bg-[rgba(255,248,235,0.64)] px-3.5 py-2.5 text-[0.94rem] italic leading-6 text-[#6f604f]"
          />
        ) : null}

        <FormattedNarrativeText
          id={descriptionId}
          text={node.text}
          paragraphGapClass="mt-2"
          className="mb-6 text-[0.98rem] leading-[1.65] text-[#4c4032]"
        />

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
