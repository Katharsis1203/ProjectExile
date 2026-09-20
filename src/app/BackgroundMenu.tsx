import { useEffect, useLayoutEffect, useRef, useState } from "react";

type BackgroundMenuProps = {
  enabled: boolean;
  onSettings: () => void;
  onSaveLoad: () => void;
  onExit: () => void;
};

export default function BackgroundMenu({ enabled, onSettings, onSaveLoad, onExit }: BackgroundMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    function open(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.target.closest(
        'button, a, input, textarea, select, [role="dialog"], [role="menu"], [contenteditable="true"], .title-menu-panel',
      ) || window.getSelection()?.toString()) return;
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
    }
    document.addEventListener("contextmenu", open);
    return () => document.removeEventListener("contextmenu", open);
  }, [enabled]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu || !position || !enabled) return;
    const previousFocus = document.activeElement;
    menu.style.left = `${Math.max(8, Math.min(position.x, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(position.y, window.innerHeight - menu.offsetHeight - 8))}px`;
    const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>("button"));
    buttons[0]?.focus();
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menu?.contains(event.target)) setPosition(null);
    }
    function close() { setPosition(null); }
    function handleKey(event: KeyboardEvent) {
      if (!["Escape", "Tab", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") { close(); return; }
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
        (index + (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey) ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [position, enabled]);

  if (!enabled || !position) return null;
  return (
    <div ref={menuRef} role="menu" aria-label="Game menu"
      className="fixed z-[300] w-48 max-w-[calc(100vw-1rem)] rounded-md border border-[#bca57f] bg-[#f6ead1] p-1.5 text-[#3b2b1d] shadow-xl">
      {([
        ["Settings", onSettings], ["Save / Load", onSaveLoad], ["Exit to main menu", onExit],
      ] as const).map(([label, action]) => (
        <button key={label} type="button" role="menuitem"
          className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[#e7d5b3] focus:bg-[#e7d5b3] focus:outline-none"
          onClick={() => { setPosition(null); action(); }}>
          {label}
        </button>
      ))}
    </div>
  );
}
