// src/components/node/NodePassage.tsx

import type { CSSProperties } from "react";
import type { NodeChoice, NodeData, NodeResolution } from "../../types/node";
import NodeChoiceButton from "./NodeChoiceButton";

type EventTransition = {
  fromX: number;
  fromY: number;
  fromScaleX: number;
  fromScaleY: number;
} | null;

type NodePassageProps = {
  node: NodeData;
  resolution: NodeResolution | null;
  transition: EventTransition;
  isClosing: boolean;
  onChoose: (choice: NodeChoice) => void;
  onReturn: () => void;
  getStatValue: (stat: string) => number;
};

function formatStat(stat: string) {
  return stat.charAt(0).toUpperCase() + stat.slice(1);
}

export default function NodePassage({
  node,
  resolution,
  transition,
  isClosing,
  onChoose,
  onReturn,
  getStatValue,
}: NodePassageProps) {
  const choices = node.choices ?? [];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 px-6 py-6 backdrop-blur-sm">
      <style>{`
        @keyframes node-enter {
          from {
            opacity: 0;
            transform: translate3d(var(--node-from-x), var(--node-from-y), 0)
              scale(var(--node-from-scale-x), var(--node-from-scale-y))
              rotate(-4deg);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes node-exit {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }

          to {
            opacity: 0;
            transform: translate3d(var(--node-from-x), var(--node-from-y), 0)
              scale(var(--node-from-scale-x), var(--node-from-scale-y))
              rotate(-4deg);
          }
        }

        .node-page-enter {
          animation: node-enter 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .node-page-exit {
          animation: node-exit 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <main
        className={[
          "relative max-h-[92vh] min-h-[720px] w-[min(820px,86vw)] overflow-y-auto bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-10 pb-12 pt-11 text-[#3b2b1d] drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)]",
          isClosing ? "node-page-exit" : "node-page-enter",
        ].join(" ")}
        style={
          {
            "--node-from-x": `${transition?.fromX ?? 0}px`,
            "--node-from-y": `${transition?.fromY ?? 0}px`,
            "--node-from-scale-x": transition?.fromScaleX ?? 0.35,
            "--node-from-scale-y": transition?.fromScaleY ?? 0.25,
          } as CSSProperties
        }
      >
        <button
          type="button"
          onClick={onReturn}
          className="absolute right-7 top-6 rounded-md border border-[#cdb890] bg-[#f6ead1] px-3 py-1 text-sm font-semibold transition hover:bg-[#fbf2df]"
        >
          Return
        </button>

        <h1 className="mb-3 pr-24 text-4xl font-semibold tracking-tight">
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
          <div className="mb-2 rounded-sm bg-[rgba(255,248,235,0.72)] px-4 py-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[#6f604f]">
              Checks
            </div>

            <div className="flex flex-wrap gap-4 text-sm font-bold">
              {resolution.checks.map((check) => (
                <span key={`${check.stat}-${check.difficulty}`}>
                  {formatStat(check.stat)}{" "}
                  <span
                    className={
                      check.success ? "text-green-700" : "text-red-700"
                    }
                  >
                    {check.success ? "Success" : "Fail"}
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

        <p className="mb-8 text-[1.05rem] leading-7 text-[#4c4032]">
          {node.text}
        </p>

        <div className="flex flex-col gap-3">
          {choices.length ? (
            choices.map((choice, index) => (
              <NodeChoiceButton
                key={`${choice.text}-${index}`}
                choice={choice}
                getStatValue={getStatValue}
                onClick={() => onChoose(choice)}
              />
            ))
          ) : (
            <NodeChoiceButton
              choice={{ text: "Return to the hub", returnToHub: true }}
              getStatValue={getStatValue}
              onClick={onReturn}
            />
          )}
        </div>
      </main>
    </div>
  );
}