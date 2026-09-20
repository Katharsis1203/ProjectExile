import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

let scrollLockCount = 0;
let unlockedOverflow = "";

type UseModalDialogOptions = {
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  onEscape?: () => void;
  escapeEnabled?: boolean;
};

export function useModalDialog({
  containerRef,
  initialFocusRef,
  onEscape,
  escapeEnabled = true,
}: UseModalDialogOptions): void {
  const onEscapeRef = useRef(onEscape);
  const escapeEnabledRef = useRef(escapeEnabled);

  useEffect(() => {
    onEscapeRef.current = onEscape;
    escapeEnabledRef.current = escapeEnabled;
  }, [escapeEnabled, onEscape]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    if (scrollLockCount === 0) unlockedOverflow = document.body.style.overflow;
    scrollLockCount += 1;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (containerRef.current?.closest("[inert]")) return;
      if (event.key === "Escape" && escapeEnabledRef.current) {
        const handleEscape = onEscapeRef.current;
        if (handleEscape) {
          event.preventDefault();
          handleEscape();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        initialFocusRef.current?.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          document.activeElement === initialFocusRef.current)
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
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      scrollLockCount -= 1;
      if (scrollLockCount === 0) document.body.style.overflow = unlockedOverflow;

      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, initialFocusRef]);
}
