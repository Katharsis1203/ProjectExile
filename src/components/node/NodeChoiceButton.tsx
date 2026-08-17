import { formatStatName, getCheckChance } from "../../engine/eventRules";
import type { PlayerStats } from "../../engine/eventRules";
import type { EventChoice } from "../../types/event";

type NodeChoiceButtonProps = {
  choice: EventChoice;
  playerStats: PlayerStats;
  disabled?: boolean;
  onClick: () => void;
};

export default function NodeChoiceButton({
  choice,
  playerStats,
  disabled = false,
  onClick,
}: NodeChoiceButtonProps) {
  const checks = choice.type === "checked" ? choice.statChecks : [];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group w-full rounded-md border border-[#bca57f] bg-[rgba(255,248,235,0.5)] px-4 py-3 text-left text-[#3b2b1d] shadow-sm transition hover:border-[#2f2b25] hover:bg-[rgba(255,250,240,0.78)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4d37] disabled:cursor-wait disabled:opacity-60"
    >
      <span className="block font-bold leading-5">{choice.text}</span>

      {checks.length > 0 ? (
        <span className="mt-2 flex flex-wrap gap-2 border-t border-dashed border-[#bca57f] pt-2">
          {checks.map((check, index) => (
            <span
              key={`${check.stat}-${check.difficulty}-${index}`}
              className="rounded-full border border-[#bca57f] bg-[rgba(255,248,235,0.7)] px-2 py-0.5 text-xs font-semibold"
            >
              {formatStatName(check.stat)} {getCheckChance(check, playerStats)}%
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
