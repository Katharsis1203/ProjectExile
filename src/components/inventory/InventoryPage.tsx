import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  getItemCategoryLabel,
  getItemDefinition,
  type ItemCategory,
  type ItemDefinition,
} from "../../data/itemCatalog";
import { formatAppliedEffect } from "../../engine/playerState";
import type { AppliedEventEffect, PlayerState } from "../../types/player";

type InventoryPageProps = {
  player: PlayerState;
  recentEffects: AppliedEventEffect[];
  onUseItem: (itemId: string) => void;
  onDiscardItem: (itemId: string) => void;
  onClose: () => void;
};

type InventoryEntry = {
  id: string;
  quantity: number;
  definition: ItemDefinition;
};

type FilterId = "all" | ItemCategory;

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "consumable", label: "Consumables" },
  { id: "tool", label: "Tools" },
  { id: "quest", label: "Key Items" },
  { id: "currency", label: "Currency" },
  { id: "curio", label: "Curios" },
];

const CATEGORY_MARKS: Record<ItemCategory, string> = {
  consumable: "✦",
  tool: "⌁",
  quest: "◆",
  currency: "¤",
  curio: "◇",
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function canUseItem(player: PlayerState, definition: ItemDefinition): boolean {
  if (!definition.use) return false;

  const resourceEffects = definition.use.effects.filter(
    (effect) => effect.type === "resource",
  );

  if (resourceEffects.length === 0) return true;

  return resourceEffects.some((effect) => {
    const resource = player.resources.find(
      (candidate) => candidate.id === effect.resource,
    );
    if (!resource) return false;
    return effect.amount > 0 ? resource.value < resource.max : resource.value > 0;
  });
}

function getUseDisabledReason(player: PlayerState, definition: ItemDefinition): string | null {
  if (!definition.use) return null;
  if (canUseItem(player, definition)) return null;
  return "Using this now would have no mechanical effect.";
}

export default function InventoryPage({
  player,
  recentEffects,
  onUseItem,
  onDiscardItem,
  onClose,
}: InventoryPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const entries = useMemo<InventoryEntry[]>(() => {
    return Object.entries(player.inventory)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({
        id,
        quantity,
        definition: getItemDefinition(id),
      }))
      .sort((left, right) => {
        const categoryDifference = left.definition.category.localeCompare(
          right.definition.category,
        );
        return categoryDifference || left.definition.name.localeCompare(right.definition.name);
      });
  }, [player.inventory]);

  const visibleEntries = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((entry) => entry.definition.category === filter),
    [entries, filter],
  );

  useEffect(() => {
    if (visibleEntries.length === 0) {
      setSelectedItemId(null);
      return;
    }

    if (!visibleEntries.some((entry) => entry.id === selectedItemId)) {
      setSelectedItemId(visibleEntries[0]?.id ?? null);
    }
  }, [selectedItemId, visibleEntries]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = Array.from(
        pageRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  const selectedEntry =
    visibleEntries.find((entry) => entry.id === selectedItemId) ?? null;
  const selectedDefinition = selectedEntry?.definition ?? null;
  const useDisabledReason = selectedDefinition
    ? getUseDisabledReason(player, selectedDefinition)
    : null;
  const distinctCount = entries.length;
  const totalCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  function preventBackdropKeyInteraction(event: ReactKeyboardEvent): void {
    event.stopPropagation();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[#101722]/50 px-3 pb-5 pt-3 backdrop-blur-[3px] sm:px-6 sm:pt-5">
      <section
        ref={pageRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-page-title"
        onKeyDown={preventBackdropKeyInteraction}
        className="relative flex min-h-[min(690px,calc(100dvh-2rem))] w-[min(1020px,96vw)] flex-col overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-5 pb-6 pt-5 text-[#33291f] drop-shadow-[0_26px_55px_rgba(0,0,0,0.45)] sm:px-8 sm:pb-8 sm:pt-7"
      >
        <header className="flex items-start justify-between gap-5 border-b border-[#7b664d]/20 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#685945]/70">
              The Exile
            </p>
            <h1
              ref={headingRef}
              id="inventory-page-title"
              tabIndex={-1}
              className="mt-1 font-serif text-3xl font-bold outline-none sm:text-[36px]"
            >
              Inventory
            </h1>
            <p className="mt-1 max-w-[620px] text-sm text-[#6a5946]">
              Everything currently carried by the player. Items earned, spent or consumed in events update here immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-[#b9a078] bg-[rgba(249,239,217,0.82)] px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-[#fbf2df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#685741]"
          >
            Return
          </button>
        </header>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#7b664d]/14 pb-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Inventory categories">
            {FILTERS.map((candidate) => {
              const active = filter === candidate.id;
              const count =
                candidate.id === "all"
                  ? entries.length
                  : entries.filter((entry) => entry.definition.category === candidate.id).length;

              return (
                <button
                  key={candidate.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(candidate.id)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "border-[#7c674d]/45 bg-[#6d5941]/10 text-[#3d3125] shadow-[inset_0_-2px_0_rgba(92,72,50,0.32)]"
                      : "border-transparent text-[#756550] hover:border-[#9b8568]/25 hover:bg-white/20"
                  }`}
                >
                  {candidate.label}
                  {count > 0 ? <span className="ml-1 opacity-60">{count}</span> : null}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#756550]">
            {distinctCount} kinds · {totalCount} carried
          </p>
        </div>

        {recentEffects.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[#8b775d]/20 bg-[rgba(255,249,237,0.48)] px-3 py-2 text-[11px] text-[#5d4f3f]">
            <span className="font-bold uppercase tracking-[0.16em] text-[#75634f]">Last action</span>
            {recentEffects.map((effect, index) => (
              <span
                key={`${effect.type}-${effect.type === "item" ? effect.item : effect.resource}-${index}`}
                className={`rounded-full border px-2 py-0.5 font-semibold ${
                  effect.amount >= 0
                    ? "border-[#718260]/25 bg-[#718260]/8 text-[#526147]"
                    : "border-[#94594b]/25 bg-[#94594b]/8 text-[#75463d]"
                }`}
              >
                {formatAppliedEffect(effect)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid min-h-0 flex-1 gap-4 md:grid-cols-[0.9fr_1.2fr]">
          <div className="min-h-[280px] overflow-hidden rounded-lg border border-[#8d7659]/20 bg-[rgba(255,249,236,0.26)]">
            <div className="border-b border-[#8d7659]/16 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#725f49]/75">
              Carried items
            </div>

            <div className="max-h-[52dvh] overflow-y-auto p-2">
              {visibleEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {visibleEntries.map((entry) => {
                    const active = selectedItemId === entry.id;
                    const mark = CATEGORY_MARKS[entry.definition.category];

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedItemId(entry.id)}
                        className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-[#806b50]/38 bg-[rgba(230,216,189,0.5)] shadow-sm"
                            : "border-transparent hover:border-[#947d60]/22 hover:bg-white/22"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#806a50]/18 bg-[rgba(248,239,219,0.7)] font-serif text-lg text-[#6b5842]">
                          {mark}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-serif text-[15px] font-bold text-[#3b3024]">
                            {entry.definition.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-[#776650]/65">
                            {getItemCategoryLabel(entry.definition.category)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full border border-[#806a50]/18 bg-white/28 px-2 py-0.5 text-xs font-bold text-[#5f4f3d]">
                          ×{entry.quantity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm italic text-[#756650]/70">
                  No items in this category.
                </div>
              )}
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-[#8d7659]/20 bg-[rgba(255,249,236,0.32)] p-5">
            {selectedEntry && selectedDefinition ? (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-[#8d7659]/15 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#75634f]/70">
                      {getItemCategoryLabel(selectedDefinition.category)}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#352a20]">
                      {selectedDefinition.name}
                    </h2>
                  </div>
                  <div className="rounded-md border border-[#806a50]/18 bg-[rgba(248,239,219,0.58)] px-3 py-1.5 text-sm font-bold text-[#5f4f3d]">
                    ×{selectedEntry.quantity}
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-6 text-[#5d4d3b]">
                  {selectedDefinition.description}
                </p>

                {selectedDefinition.use ? (
                  <div className="mt-5 rounded-md border border-[#887458]/20 bg-[rgba(236,225,202,0.38)] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#705e49]/70">
                      Use
                    </p>
                    <p className="mt-1 font-semibold text-[#45372a]">
                      {selectedDefinition.use.label}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#6a5946]">
                      {selectedDefinition.use.description}
                    </p>
                    {useDisabledReason ? (
                      <p className="mt-2 text-[11px] italic text-[#8a6b50]">{useDisabledReason}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-md border border-dashed border-[#887458]/20 bg-white/12 px-4 py-3 text-sm italic text-[#766652]/70">
                    This item has no direct inventory action. It may instead unlock or alter choices during events.
                  </div>
                )}

                <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-[#8d7659]/15 pt-5">
                  {selectedDefinition.discardable !== false ? (
                    <button
                      type="button"
                      onClick={() => onDiscardItem(selectedEntry.id)}
                      className="rounded-md border border-[#9a7668]/28 bg-[rgba(151,91,75,0.05)] px-3 py-2 text-sm font-semibold text-[#754e43] transition hover:bg-[rgba(151,91,75,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e6457]/55"
                    >
                      Discard one
                    </button>
                  ) : null}

                  {selectedDefinition.use ? (
                    <button
                      type="button"
                      disabled={Boolean(useDisabledReason)}
                      onClick={() => onUseItem(selectedEntry.id)}
                      className="rounded-md border border-[#6e7052]/32 bg-[rgba(108,116,77,0.12)] px-4 py-2 text-sm font-bold text-[#4f553a] shadow-sm transition hover:bg-[rgba(108,116,77,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69704f]/55 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {selectedDefinition.use.label}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center px-8 text-center text-sm italic text-[#756650]/70">
                Select an item to inspect it.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
