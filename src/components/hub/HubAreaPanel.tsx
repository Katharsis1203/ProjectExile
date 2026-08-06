// HubAreaPanel.tsx

import HubActionButton from "./HubActionButton";

type HubAreaPanelProps = {
  onExplore: () => void;
  backgroundImage: string | null;
};

export default function HubAreaPanel({ onExplore, backgroundImage }: HubAreaPanelProps) {
  return (
    <div className="relative flex flex-[1.25]">
      <div className="pointer-events-none absolute inset-[10px] scale-[1.03] rounded-[32px] bg-[rgba(55,42,28,0.24)] opacity-90 blur-[34px]" />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        <div className="relative mb-[-30px] flex flex-1 items-center justify-center overflow-hidden bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-3 pb-[38px] pt-3">
          <div
            className="event-mask h-full w-full bg-cover bg-center opacity-95"
            style={{
              backgroundImage: backgroundImage ? `url('/images/${backgroundImage}')` : undefined,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col border-t border-[rgba(70,58,44,0.15)]">
          <HubActionButton title="Explore" image="/images/alt/journal-btn4.png" onClick={onExplore} />
          <HubActionButton title="Life" image="/images/alt/character-btn4.png" />
        </div>
      </div>
    </div>
  );
}