import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlayerStatusEffect } from "../../types/player";

type PlayerStatusEffectsProps = {
  effects: PlayerStatusEffect[];
};

type TooltipPosition = {
  left: number;
  top: number;
  placement: "above" | "below";
};

const TOOLTIP_WIDTH = 188;
const TOOLTIP_GAP = 10;
const VIEWPORT_PADDING = 12;

const toneRingClasses: Record<NonNullable<PlayerStatusEffect["tone"]>, string> = {
  cold: "border-[#63798b]/45 bg-[#dfe7e9]/58",
  arcane: "border-[#726b91]/45 bg-[#e4dfeb]/58",
  wound: "border-[#8b5f59]/45 bg-[#eaded9]/58",
  neutral: "border-[#77664f]/35 bg-[#e7ddca]/58",
};

function EffectBadge({ effect }: { effect: PlayerStatusEffect }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const halfWidth = TOOLTIP_WIDTH / 2;
      const idealLeft = rect.left + rect.width / 2;
      const left = Math.max(
        halfWidth + VIEWPORT_PADDING,
        Math.min(window.innerWidth - halfWidth - VIEWPORT_PADDING, idealLeft)
      );

      const hasRoomAbove = rect.top >= 118;

      setPosition({
        left,
        top: hasRoomAbove ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP,
        placement: hasRoomAbove ? "above" : "below",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const tooltip = isOpen && position && typeof document !== "undefined"
    ? createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[9999] w-[188px] rounded-[10px] border border-[#695742]/22 bg-[rgba(247,239,220,0.985)] px-3 py-2.5 text-left shadow-[0_12px_28px_rgba(31,23,16,0.30)] backdrop-blur-[2px]"
          style={{
            left: position.left,
            top: position.top,
            transform: position.placement === "above"
              ? "translate(-50%, -100%)"
              : "translate(-50%, 0)",
          }}
        >
          <p className="font-serif text-[12px] font-bold leading-none text-[#30261d]">
            {effect.name}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6d5a45]/58">
            {effect.duration}
          </p>
          <p className="mt-1.5 text-[10px] leading-[1.4] text-[#4e4032]/80">
            {effect.effect}
          </p>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${effect.name}: ${effect.duration}. ${effect.effect}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[9px] border shadow-[0_2px_5px_rgba(62,46,31,0.12),inset_0_0_0_1px_rgba(255,250,239,0.28)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_5px_10px_rgba(62,46,31,0.16)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#76624a]/45 ${toneRingClasses[effect.tone ?? "neutral"]}`}
      >
        <img
          src={`/images/status-effects/${effect.icon}`}
          alt=""
          className="h-[22px] w-[22px] object-contain opacity-85"
          draggable={false}
        />
      </button>

      {tooltip}
    </div>
  );
}

export default function PlayerStatusEffects({ effects }: PlayerStatusEffectsProps) {
  if (!effects.length) {
    return (
      <p className="text-[10px] italic text-[#594b3b]/48">No active effects.</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {effects.map((effect) => (
        <EffectBadge key={effect.id} effect={effect} />
      ))}
    </div>
  );
}
