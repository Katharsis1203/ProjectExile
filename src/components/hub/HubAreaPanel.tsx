import { DEFAULT_EXILE_PORTRAIT } from "../../data/defaultPortrait";
import { DEFAULT_PLAYER_PANEL } from "../../data/defaultPlayerPanel";
import PortraitAvatar from "../avatar/PortraitAvatar";
import PlayerResourceBars from "../player/PlayerResourceBars";
import PlayerStatusEffects from "../player/PlayerStatusEffects";
import HubActionButton from "./HubActionButton";

type HubAreaPanelProps = {
  onExplore: () => void;
  onLife: () => void;
};

export default function HubAreaPanel({ onExplore, onLife }: HubAreaPanelProps) {
  const player = DEFAULT_PLAYER_PANEL;

  return (
    <aside className="relative flex min-w-0 flex-[1.15]">
      <div className="pointer-events-none absolute inset-[10px] scale-[1.03] rounded-[32px] bg-[rgba(55,42,28,0.24)] opacity-90 blur-[34px]" />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
        <section className="relative mb-[-28px] flex min-h-0 flex-1 flex-col px-5 pb-[42px] pt-5 text-[#2b2b2b]">
          <header className="relative z-40 border-b border-[#6c5942]/14 pb-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#584a3b]/52">
              Player
            </p>
            <h2 className="mt-0.5 font-serif text-[22px] font-bold leading-tight text-[#2f281f]">
              {player.name}
            </h2>
            <p className="mt-0.5 font-serif text-[11px] italic tracking-[0.04em] text-[#725f48]/68">
              {player.title}
            </p>
          </header>

          <div className="relative z-30 mt-3 flex h-[144px] shrink-0 items-start justify-center">
            <PortraitAvatar
              portrait={DEFAULT_EXILE_PORTRAIT}
              className="!h-[144px] !max-w-[150px] !rounded-[22px]"
            />
          </div>

          <div className="relative z-40 mt-3 border-t border-[#6c5942]/12 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#584a3b]/52">
                Condition
              </p>
              <span className="text-[8px] uppercase tracking-[0.12em] text-[#76644e]/42">
                Current
              </span>
            </div>
            <PlayerResourceBars resources={player.resources} />
          </div>

          <div className="relative z-50 mt-3 border-t border-[#6c5942]/12 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#584a3b]/52">
                Active effects
              </p>
              <span className="text-[8px] text-[#76644e]/40">hover for details</span>
            </div>
            <PlayerStatusEffects effects={player.effects} />
          </div>
        </section>

        <div className="relative z-50 flex flex-col border-t border-[rgba(70,58,44,0.15)]">
          <HubActionButton title="Explore" image="/images/alt/journal-btn4.png" onClick={onExplore} />
          <HubActionButton title="Life" image="/images/alt/character-btn4.png" onClick={onLife} />
        </div>
      </div>
    </aside>
  );
}
