import { useState } from "react";
import { DEFAULT_EXILE_PORTRAIT } from "../../data/defaultPortrait";
import type { ActivityEnergyState } from "../../types/activityEnergy";
import type { PlayerState } from "../../types/player";
import PortraitAvatar from "../avatar/PortraitAvatar";
import PlayerResourceBars from "../player/PlayerResourceBars";
import PlayerStatusEffects from "../player/PlayerStatusEffects";
import HubActionButton from "./HubActionButton";
import HubActivityEnergy from "./HubActivityEnergy";

type HubPlayerPanelProps = {
  player: PlayerState;
  activityEnergy: ActivityEnergyState;
  disabled: boolean;
  onExplore: () => void;
  onLife: () => void;
};

type PlayerStatusTab = "condition" | "effects";

export default function HubPlayerPanel({
  player,
  activityEnergy,
  disabled,
  onExplore,
  onLife,
}: HubPlayerPanelProps) {
  const [activeTab, setActiveTab] = useState<PlayerStatusTab>("condition");

  return (
    <aside
      aria-label="Player status and hub actions"
      className="hub-panel-elevation hub-panel-elevation--player relative flex h-full min-h-0 min-w-0 xl:col-start-1 xl:row-start-1"
    >
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
        <section className="relative flex min-h-0 flex-1 flex-col px-5 pb-3.5 pt-5 text-[#2b2b2b]">
          <header className="relative z-40 border-b border-[#6c5942]/14 pb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#584a3b]/70">
              Player
            </p>
            <h2 className="mt-0.5 font-serif text-[22px] font-bold leading-tight text-[#2f281f]">
              {player.name}
            </h2>
            <p className="mt-0.5 font-serif text-[11px] italic tracking-[0.04em] text-[#725f48]/80">
              {player.title}
            </p>
          </header>

          <div className="relative z-30 mt-2 flex h-[176px] shrink-0 items-start justify-center">
            <PortraitAvatar
              portrait={DEFAULT_EXILE_PORTRAIT}
              className="!h-[176px] !max-w-[164px] !rounded-[16px]"
            />
          </div>

          <div className="relative z-50 mt-2 min-h-0 border-t border-[#6c5942]/12 pt-1.5">
            <div
              role="tablist"
              aria-label="Player condition and active effects"
              className="grid grid-cols-2 border-b border-[#6c5942]/12"
            >
              <button
                type="button"
                role="tab"
                id="player-condition-tab"
                aria-selected={activeTab === "condition"}
                aria-controls="player-condition-panel"
                onClick={() => setActiveTab("condition")}
                className={`relative flex h-8 items-center justify-center gap-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors duration-150 focus:outline-none focus-visible:bg-[#6b5841]/7 ${
                  activeTab === "condition"
                    ? "text-[#3f3428]"
                    : "text-[#665540]/48 hover:text-[#554633]/72"
                }`}
              >
                Condition
                {activeTab === "condition" ? (
                  <span className="absolute inset-x-2 bottom-[-1px] h-px bg-[#6e5a43]/62" />
                ) : null}
              </button>

              <button
                type="button"
                role="tab"
                id="player-effects-tab"
                aria-selected={activeTab === "effects"}
                aria-controls="player-effects-panel"
                onClick={() => setActiveTab("effects")}
                className={`relative flex h-8 items-center justify-center gap-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors duration-150 focus:outline-none focus-visible:bg-[#6b5841]/7 ${
                  activeTab === "effects"
                    ? "text-[#3f3428]"
                    : "text-[#665540]/48 hover:text-[#554633]/72"
                }`}
              >
                Effects
                <span
                  className={`min-w-[16px] rounded-full border px-1 py-[1px] text-center font-mono text-[8px] leading-none tracking-normal ${
                    activeTab === "effects"
                      ? "border-[#6e5a43]/24 bg-[#776249]/10 text-[#4d3f31]/78"
                      : "border-[#6e5a43]/14 bg-[#776249]/6 text-[#695743]/46"
                  }`}
                >
                  {player.effects.length}
                </span>
                {activeTab === "effects" ? (
                  <span className="absolute inset-x-2 bottom-[-1px] h-px bg-[#6e5a43]/62" />
                ) : null}
              </button>
            </div>

            <div className="min-h-[142px] pt-3">
              {activeTab === "condition" ? (
                <div
                  id="player-condition-panel"
                  role="tabpanel"
                  aria-labelledby="player-condition-tab"
                >
                  <PlayerResourceBars resources={player.resources} />
                </div>
              ) : (
                <div
                  id="player-effects-panel"
                  role="tabpanel"
                  aria-labelledby="player-effects-tab"
                >
                  <PlayerStatusEffects effects={player.effects} variant="rows" />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="relative z-50 flex flex-col border-t border-[rgba(70,58,44,0.15)]">
          <HubActivityEnergy energy={activityEnergy} />
          <HubActionButton
            title="Explore"
            image="/images/alt/journal-btn4.png"
            disabled={disabled}
            onClick={onExplore}
          />
          <HubActionButton
            title="Life"
            image="/images/alt/character-btn4.png"
            disabled={disabled}
            onClick={onLife}
          />
        </div>
      </div>
    </aside>
  );
}
