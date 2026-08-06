// src/components/node/NodeChoiceButton.tsx

import type { NodeChoice } from "../../types/node";

type NodeChoiceButtonProps = {
  choice: NodeChoice;
  onClick: () => void;
  getStatValue: (stat: string) => number;
};

function formatStat(stat: string) {
  return stat.charAt(0).toUpperCase() + stat.slice(1);
}

export default function NodeChoiceButton({
  choice,
  onClick,
  getStatValue,
}: NodeChoiceButtonProps) {
  const checks = choice.statChecks ?? [];
  const hasChecks = choice.type === "checked" && checks.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-md border border-[#bca57f] bg-[rgba(255,248,235,0.5)] px-4 py-3 text-left text-[#3b2b1d] shadow-sm transition hover:border-[#2f2b25] hover:bg-[rgba(255,250,240,0.78)] hover:shadow-md"
    >
      <div className="font-bold leading-5">{choice.text}</div>

      {hasChecks ? (
        <>
          <div className="mt-1 text-sm text-[#6f604f]">
            Hover to view individual checks
          </div>

          <div
            className="
              grid max-h-0 overflow-hidden
              opacity-0
              transition-[max-height,opacity,margin-top]
              duration-300 ease-out
              group-hover:mt-3
              group-hover:max-h-24
              group-hover:opacity-100
            "
          >
            <div className="flex flex-wrap gap-2 border-t border-dashed border-[#bca57f] pt-2">
              {checks.map((check) => {
                const value = getStatValue(check.stat);

                const chance = Math.max(
                  5,
                  Math.min(95, 50 + (value - check.difficulty) * 10)
                );

                return (
                  <span
                    key={`${check.stat}-${check.difficulty}`}
                    className="rounded-full border border-[#bca57f] bg-[rgba(255,248,235,0.7)] px-2 py-0.5 text-xs font-semibold"
                  >
                    {formatStat(check.stat)} {chance}%
                  </span>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </button>
  );
}