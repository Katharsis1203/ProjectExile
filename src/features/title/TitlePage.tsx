import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  DEFAULT_GAME_SETTINGS,
  SAVE_SLOT_IDS,
  deleteSaveSlot,
  getMostRecentSave,
  listSaveSlots,
  loadGameSettings,
  renameSaveSlot,
  saveGameSettings,
  type GameSave,
  type GameSettings,
  type SaveSlotId,
} from "../../infrastructure/persistence/gamePersistence";
import { getImageUrl } from "../../shared/lib/publicAssetUrl";
import "./TitlePage.css";

type TitlePageProps = {
  onNewGame: (slotId: SaveSlotId, saveName: string) => void;
  onLoadGame: (save: GameSave) => void;
};

type MenuView = "main" | "new" | "load" | "settings" | "credits";

type MenuButtonProps = {
  label: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  badge?: string;
  buttonRef?: Ref<HTMLButtonElement>;
};

function MenuButton({
  label,
  detail,
  onClick,
  disabled = false,
  primary = false,
  badge,
  buttonRef,
}: MenuButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`title-menu__button${primary ? " title-menu__button--primary" : ""}`}
    >
      <span className="title-menu__button-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      {badge ? <span className="title-menu__badge">{badge}</span> : null}
      <span className="title-menu__chevron" aria-hidden="true">›</span>
    </button>
  );
}

function formatSaveDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSaveLocation(save: GameSave): string {
  return save.resume.screen === "hub" ? "Snowlands · Village Hub" : "Snowlands · The Road North";
}

function getSaveSummary(save: GameSave): string {
  const health = save.player.resources.find((resource) => resource.id === "health");
  const statEntries = Object.entries(save.player.stats).slice(0, 2);
  const statText = statEntries.map(([key, value]) => `${key.slice(0, 3).toUpperCase()} ${value}`).join(" · ");
  const healthText = health ? `HP ${health.value}/${health.max}` : "";
  return [healthText, statText].filter(Boolean).join(" · ");
}

function SlotCard({
  slotId,
  save,
  selected,
  onSelect,
}: {
  slotId: SaveSlotId;
  save: GameSave | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`title-slot${selected ? " title-slot--selected" : ""}${save ? "" : " title-slot--empty"}`}
      onClick={onSelect}
    >
      <span className="title-slot__number">0{slotId}</span>
      <span className="title-slot__body">
        <strong>{save?.saveName ?? "Empty slot"}</strong>
        <small>{save ? getSaveLocation(save) : "A new journey can begin here"}</small>
      </span>
      <span className="title-slot__meta">
        {save ? formatSaveDate(save.updatedAt) : "Available"}
      </span>
    </button>
  );
}

function SettingChoice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="title-settings__choices">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-selected" : ""}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SettingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`title-settings__toggle${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span aria-hidden="true" />
      {checked ? "On" : "Off"}
    </button>
  );
}

export default function TitlePage({ onNewGame, onLoadGame }: TitlePageProps) {
  const [view, setView] = useState<MenuView>("main");
  const [saves, setSaves] = useState(() => listSaveSlots());
  const [selectedSlot, setSelectedSlot] = useState<SaveSlotId>(() => {
    const firstEmpty = SAVE_SLOT_IDS.find((slotId) => !listSaveSlots()[slotId - 1]);
    return firstEmpty ?? 1;
  });
  const [newSaveName, setNewSaveName] = useState("Journey I");
  const [renameValue, setRenameValue] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const firstMenuButtonRef = useRef<HTMLButtonElement>(null);

  const mostRecentSave = useMemo(
    () =>
      saves
        .filter((save): save is GameSave => save !== null)
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )[0] ?? null,
    [saves],
  );
  const selectedSave = saves[selectedSlot - 1] ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => firstMenuButtonRef.current?.focus(), 420);
    return () => window.clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape" || view === "main") return;
      event.preventDefault();
      setView("main");
      setConfirmDelete(false);
      setConfirmOverwrite(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  function refreshSaves(): void {
    setSaves(listSaveSlots());
  }

  function openNewGame(): void {
    const currentSaves = listSaveSlots();
    setSaves(currentSaves);
    const emptySlot = SAVE_SLOT_IDS.find((slotId) => !currentSaves[slotId - 1]);
    const nextSlot = emptySlot ?? 1;
    setSelectedSlot(nextSlot);
    setNewSaveName(`Journey ${["I", "II", "III"][nextSlot - 1]}`);
    setConfirmOverwrite(false);
    setView("new");
  }

  function openLoadGame(): void {
    const currentSaves = listSaveSlots();
    setSaves(currentSaves);
    const latest = getMostRecentSave();
    if (latest) setSelectedSlot(latest.slotId);
    setRenameValue(latest?.saveName ?? "");
    setConfirmDelete(false);
    setView("load");
  }

  function handleNewGame(): void {
    if (selectedSave && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    onNewGame(selectedSlot, newSaveName.trim() || `Journey ${selectedSlot}`);
  }

  function handleSelectSlot(slotId: SaveSlotId): void {
    setSelectedSlot(slotId);
    setConfirmOverwrite(false);
    setConfirmDelete(false);
    const save = saves[slotId - 1];
    setRenameValue(save?.saveName ?? "");
    if (view === "new") {
      setNewSaveName(`Journey ${["I", "II", "III"][slotId - 1]}`);
    }
  }

  function handleRename(): void {
    if (!selectedSave || !renameValue.trim()) return;
    renameSaveSlot(selectedSlot, renameValue.trim());
    refreshSaves();
  }

  function handleDelete(): void {
    if (!selectedSave) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    deleteSaveSlot(selectedSlot);
    setConfirmDelete(false);
    setRenameValue("");
    refreshSaves();
  }

  function updateSettings(next: GameSettings): void {
    setSettings(next);
    saveGameSettings(next);
  }

  function renderPanelHeader(eyebrow: string, title: string, copy: string): ReactNode {
    return (
      <header className="title-submenu__header">
        <button
          ref={firstMenuButtonRef}
          type="button"
          className="title-submenu__back"
          onClick={() => setView("main")}
        >
          <span aria-hidden="true">‹</span> Main menu
        </button>
        <div className="title-submenu__eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </header>
    );
  }

  return (
    <main
      className={`title-page title-page--menu-${view}`}
      style={{
        "--title-night-image": `url("${getImageUrl("night.png")}")`,
        "--parchment-image": `url("${getImageUrl("parchment.png")}")`,
      } as CSSProperties}
    >
      <div className="title-page__ornament" aria-hidden="true" />

      <div className="title-page__scene" aria-hidden="true">
        <img src={getImageUrl("backy.png")} alt="" className="title-page__scene-image" />
        <div className="title-page__scene-wash" />
        <div className="title-page__scene-vignette" />
        <div className="hub-snow-field hub-snow-field--far hub-snow-field--light">
          <span className="hub-snow-layer hub-snow-layer--far" />
        </div>
        <div className="hub-snow-field hub-snow-field--near hub-snow-field--light">
          <span className="hub-snow-layer hub-snow-layer--near" />
        </div>
      </div>

      <div className="title-shell">
        <section className="title-brand" aria-labelledby="game-title">
          <div className="title-page__eyebrow">A narrative role-playing game</div>
          <h1 id="game-title" className="title-page__title">
            <span className="title-page__title-small">Project</span>
            <span className="title-page__title-large">Exile</span>
          </h1>
          <div className="title-page__rule" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <p className="title-page__tagline">
            Every road leaves a mark. Every choice follows you home.
          </p>
        </section>

        <section className={`title-menu-panel${view === "main" ? " title-menu-panel--main" : " title-menu-panel--deep"}`}>
          {view === "main" ? (
            <div className="title-menu">
              <div className="title-menu__heading">
                <span>Journey</span>
                <small>{mostRecentSave ? `${mostRecentSave.saveName} · ${formatSaveDate(mostRecentSave.updatedAt)}` : "No journey begun"}</small>
              </div>

              {mostRecentSave ? (
                <MenuButton
                  buttonRef={firstMenuButtonRef}
                  label="Continue"
                  detail={getSaveLocation(mostRecentSave)}
                  onClick={() => onLoadGame(mostRecentSave)}
                  primary
                  badge={`Slot 0${mostRecentSave.slotId}`}
                />
              ) : null}
              <MenuButton
                label="New Game"
                detail="Begin a new exile"
                onClick={openNewGame}
                primary={!mostRecentSave}
                {...(!mostRecentSave
                  ? { buttonRef: firstMenuButtonRef }
                  : {})}
              />
              <MenuButton
                label="Load Game"
                detail={mostRecentSave ? "Choose or manage a save slot" : "No saves yet — slots are ready"}
                onClick={openLoadGame}
              />
              <MenuButton
                label="Settings"
                detail="Display, interface and accessibility"
                onClick={() => setView("settings")}
              />
              <MenuButton
                label="About"
                detail="Build notes and credits"
                onClick={() => setView("credits")}
              />

              <div className="title-menu__hint">
                <span>Enter</span> select <i /> <span>Esc</span> back
              </div>
            </div>
          ) : null}

          {view === "new" ? (
            <div className="title-submenu">
              {renderPanelHeader(
                "New journey",
                "Choose a save slot",
                "Your journey will autosave into this slot as the story advances.",
              )}

              <div className="title-submenu__body">
                <div className="title-slot-list">
                  {SAVE_SLOT_IDS.map((slotId) => (
                    <SlotCard
                      key={slotId}
                      slotId={slotId}
                      save={saves[slotId - 1] ?? null}
                      selected={selectedSlot === slotId}
                      onSelect={() => handleSelectSlot(slotId)}
                    />
                  ))}
                </div>

                <div className="title-slot-detail">
                  <span className="title-slot-detail__label">Save name</span>
                  <input
                    type="text"
                    maxLength={32}
                    value={newSaveName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setNewSaveName(event.target.value);
                      setConfirmOverwrite(false);
                    }}
                    aria-label="Save name"
                  />

                  {selectedSave ? (
                    <div className="title-slot-detail__warning">
                      <strong>Slot 0{selectedSlot} already contains {selectedSave.saveName}.</strong>
                      <span>Starting here will permanently replace that save.</span>
                    </div>
                  ) : (
                    <div className="title-slot-detail__empty-note">
                      Slot 0{selectedSlot} is empty. Your first autosave is created when the introduction begins.
                    </div>
                  )}

                  <button
                    type="button"
                    className={`title-submenu__action${confirmOverwrite ? " title-submenu__action--danger" : ""}`}
                    onClick={handleNewGame}
                  >
                    {selectedSave
                      ? confirmOverwrite
                        ? "Confirm overwrite"
                        : "Overwrite & begin"
                      : "Begin journey"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {view === "load" ? (
            <div className="title-submenu">
              {renderPanelHeader(
                "Archive",
                "Load game",
                "Select a journey to continue, rename it, or clear the slot.",
              )}

              <div className="title-submenu__body">
                <div className="title-slot-list">
                  {SAVE_SLOT_IDS.map((slotId) => (
                    <SlotCard
                      key={slotId}
                      slotId={slotId}
                      save={saves[slotId - 1] ?? null}
                      selected={selectedSlot === slotId}
                      onSelect={() => handleSelectSlot(slotId)}
                    />
                  ))}
                </div>

                <div className="title-slot-detail">
                  {selectedSave ? (
                    <>
                      <div className="title-save-preview">
                        <span className="title-slot-detail__label">Selected save</span>
                        <h3>{selectedSave.saveName}</h3>
                        <p>{getSaveLocation(selectedSave)}</p>
                        <small>{getSaveSummary(selectedSave)}</small>
                        <time>{formatSaveDate(selectedSave.updatedAt)}</time>
                      </div>

                      <button
                        type="button"
                        className="title-submenu__action"
                        onClick={() => onLoadGame(selectedSave)}
                      >
                        Load journey
                      </button>

                      <div className="title-slot-detail__divider" />
                      <label className="title-slot-detail__label" htmlFor="rename-save">
                        Rename save
                      </label>
                      <div className="title-slot-detail__rename">
                        <input
                          id="rename-save"
                          type="text"
                          maxLength={32}
                          value={renameValue}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setRenameValue(event.target.value)}
                        />
                        <button type="button" onClick={handleRename} disabled={!renameValue.trim()}>
                          Rename
                        </button>
                      </div>

                      <button
                        type="button"
                        className={`title-submenu__delete${confirmDelete ? " is-confirming" : ""}`}
                        onClick={handleDelete}
                      >
                        {confirmDelete ? "Confirm delete" : "Delete save"}
                      </button>
                    </>
                  ) : (
                    <div className="title-save-preview title-save-preview--empty">
                      <span className="title-slot-detail__label">Slot 0{selectedSlot}</span>
                      <h3>Empty slot</h3>
                      <p>There is no journey stored here yet.</p>
                      <button type="button" className="title-submenu__action" onClick={openNewGame}>
                        Start a new game
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {view === "settings" ? (
            <div className="title-submenu title-submenu--settings">
              {renderPanelHeader(
                "Preferences",
                "Settings",
                "These options are stored separately from your save slots and apply immediately.",
              )}

              <div className="title-settings">
                <div className="title-settings__row">
                  <div>
                    <strong>Text size</strong>
                    <small>Story and interface text scale</small>
                  </div>
                  <SettingChoice
                    value={settings.textSize}
                    options={[
                      { value: "small", label: "Small" },
                      { value: "standard", label: "Standard" },
                      { value: "large", label: "Large" },
                    ]}
                    onChange={(textSize) => updateSettings({ ...settings, textSize })}
                  />
                </div>

                <div className="title-settings__row">
                  <div>
                    <strong>Interface scale</strong>
                    <small>Adjust the overall UI density</small>
                  </div>
                  <SettingChoice
                    value={settings.interfaceScale}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "standard", label: "Standard" },
                      { value: "large", label: "Large" },
                    ]}
                    onChange={(interfaceScale) => updateSettings({ ...settings, interfaceScale })}
                  />
                </div>

                <div className="title-settings__row">
                  <div>
                    <strong>Reduced motion</strong>
                    <small>Shorten or remove large page and scene animations</small>
                  </div>
                  <SettingToggle
                    checked={settings.reducedMotion}
                    onChange={(reducedMotion) => updateSettings({ ...settings, reducedMotion })}
                  />
                </div>

                <div className="title-settings__row">
                  <div>
                    <strong>Snow effects</strong>
                    <small>Show drifting snow layers in snowy scenes</small>
                  </div>
                  <SettingToggle
                    checked={settings.snowEffects}
                    onChange={(snowEffects) => updateSettings({ ...settings, snowEffects })}
                  />
                </div>

                <div className="title-settings__row">
                  <div>
                    <strong>High contrast</strong>
                    <small>Strengthen panel borders and text contrast</small>
                  </div>
                  <SettingToggle
                    checked={settings.highContrast}
                    onChange={(highContrast) => updateSettings({ ...settings, highContrast })}
                  />
                </div>

                <button
                  type="button"
                  className="title-settings__reset"
                  onClick={() => updateSettings({ ...DEFAULT_GAME_SETTINGS })}
                >
                  Restore defaults
                </button>
              </div>
            </div>
          ) : null}

          {view === "credits" ? (
            <div className="title-submenu title-submenu--credits">
              {renderPanelHeader(
                "Project Exile",
                "About this build",
                "A systems-first prototype for a slow-burn narrative role-playing game.",
              )}
              <div className="title-credits">
                <div>
                  <span>Current region</span>
                  <strong>The Snowlands</strong>
                  <p>Introduction, village hub, event cards, inventory and evolving player state.</p>
                </div>
                <div>
                  <span>Save system</span>
                  <strong>Three local journeys</strong>
                  <p>Named slots autosave character state and the current major story location.</p>
                </div>
                <div>
                  <span>Build</span>
                  <strong>Development</strong>
                  <p>More character creation, travel, combat and long-term progression will layer onto this foundation.</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="title-page__footer">
        <span>Project Exile</span>
        <span aria-hidden="true">·</span>
        <span>Development build</span>
      </div>
    </main>
  );
}
