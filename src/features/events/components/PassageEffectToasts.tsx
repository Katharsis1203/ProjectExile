import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { formatAppliedEffect } from "../../../engine/playerState";
import type { AppliedEventEffect } from "../../../types/player";
import "./PassageEffectToasts.css";

type EffectToast = {
  id: number;
  effect: AppliedEventEffect;
  delay: number;
};

const TOAST_DURATION = 6500;

function EffectTab({ toast, onExpire }: {
  toast: EffectToast;
  onExpire: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onExpire(toast.id), TOAST_DURATION + toast.delay);
    return () => window.clearTimeout(timer);
  }, [toast, onExpire]);

  const { effect } = toast;
  const label = effect.type === "item"
    ? `${Math.abs(effect.amount)} × ${effect.name} ${effect.amount > 0 ? "added" : "removed"}`
    : formatAppliedEffect(effect);
  const tone = effect.amount < 0 ? "loss" : effect.amount > 0 ? "gain" : "update";

  return (
    <div
      className="passage-effect-tab"
      data-tone={tone}
      style={{
        "--toast-duration": `${TOAST_DURATION}ms`,
        "--toast-delay": `${toast.delay}ms`,
      } as CSSProperties}
    >
      <span className="passage-effect-tab-symbol" aria-hidden="true">
        {tone === "loss" ? "−" : tone === "gain" ? "+" : "•"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function PassageEffectToasts({ effects }: { effects: AppliedEventEffect[] }) {
  const [state, setState] = useState(() => ({ effects, nextId: 0, toasts: [] as EffectToast[] }));

  // Each choice supplies a fresh effect batch, including repeated identical rewards.
  // Keep earlier tabs alive across passages; restored results are not new rewards.
  if (state.effects !== effects) {
    setState({
      effects,
      nextId: state.nextId + effects.length,
      toasts: [...state.toasts, ...effects.map((effect, index) => ({
        id: state.nextId + index,
        effect,
        delay: Math.min(index * 120, 600),
      }))],
    });
  }

  const expire = useCallback((id: number) => {
    setState((current) => ({ ...current, toasts: current.toasts.filter((toast) => toast.id !== id) }));
  }, []);

  return (
    <div className="passage-effect-anchor">
      <div className="passage-effect-stack" role="log" aria-label="Choice effects" aria-live="polite" aria-relevant="additions">
        {state.toasts.map((toast) => <EffectTab key={toast.id} toast={toast} onExpire={expire} />)}
      </div>
    </div>
  );
}
