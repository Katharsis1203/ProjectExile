import {
  describeCheckChance,
  formatStatName,
  getCheckChance,
  getStatPalette,
} from "../../../engine/eventRules";
import {
  describeChoiceRequirement,
  isChoiceRequirementMet,
} from "../../../engine/playerState";
import type { PlayerStats } from "../../../engine/eventRules";
import type { EventChoice } from "../../../types/event";
import type { PlayerInventory } from "../../../types/player";

type NodeChoiceButtonProps = {
  choice: EventChoice;
  playerStats: PlayerStats;
  playerInventory: PlayerInventory;
  disabled?: boolean;
  onClick: () => void;
};

export default function NodeChoiceButton({
  choice,
  playerStats,
  playerInventory,
  disabled = false,
  onClick,
}: NodeChoiceButtonProps) {
  const checks = choice.type === "checked" ? choice.statChecks : [];
  const requirements = choice.requirements ?? [];
  const missingRequirement = requirements.some(
    (requirement) => !isChoiceRequirementMet(requirement, playerInventory),
  );
  const isDisabled = disabled || missingRequirement;
  const endsEvent = choice.endEvent || choice.returnToHub ||
    (!choice.next && !(choice.type === "checked" && choice.weighted?.buckets.length));

  return (
    <button
      type="button"
      data-click-sound={endsEvent ? "event-drop" : "passage-choice"}
      disabled={isDisabled}
      onClick={onClick}
      className={`group w-full rounded-md border px-3.5 py-2.5 text-left text-[0.94rem] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f4d37] ${
        missingRequirement
          ? "cursor-not-allowed border-[#9b8870]/40 bg-[rgba(224,216,201,0.48)] text-[#74695d]/70 shadow-none grayscale-[0.2]"
          : "border-[#bca57f] bg-[rgba(255,248,235,0.54)] text-[#3b2b1d] hover:border-[#2f2b25] hover:bg-[rgba(255,250,240,0.78)] hover:shadow-md"
      } ${disabled && !missingRequirement ? "cursor-wait opacity-60" : ""}`}
    >
      <span className="block font-bold leading-[1.35]">{choice.text}</span>

      {checks.length > 0 || requirements.length > 0 ? (
        <span className="mt-1.5 flex flex-wrap gap-1.5 border-t border-dashed border-[#bca57f]/75 pt-1.5">
          {checks.map((check, index) => {
            const palette = getStatPalette(check.stat);
            const chance = getCheckChance(check, playerStats);

            return (
              <span
                key={`${check.stat}-${check.difficulty}-${index}`}
                title={describeCheckChance(check, playerStats)}
                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none"
                style={{
                  backgroundColor: missingRequirement
                    ? "rgba(130,120,108,0.08)"
                    : palette.tintStrong,
                  borderColor: missingRequirement
                    ? "rgba(120,105,88,0.2)"
                    : palette.border,
                  color: missingRequirement ? "#807468" : palette.text,
                }}
              >
                {formatStatName(check.stat)} · {chance}%
              </span>
            );
          })}

          {requirements.map((requirement, index) => {
            const isMet = isChoiceRequirementMet(requirement, playerInventory);
            return (
              <span
                key={`${requirement.type}-${requirement.item}-${index}`}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${
                  isMet
                    ? "border-[#6f7a5b]/30 bg-[#75805f]/10 text-[#556044]"
                    : "border-[#9b6258]/30 bg-[#a8665a]/10 text-[#8a5149]"
                }`}
              >
                Requires {describeChoiceRequirement(requirement)}
              </span>
            );
          })}
        </span>
      ) : null}
    </button>
  );
}
