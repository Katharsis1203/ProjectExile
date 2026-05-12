// HubAreaPanel.tsx

import HubActionButton from "./HubActionButton";

type HubAreaPanelProps = {
  onExplore: () => void;
  backgroundImage: string | null;
};

export default function HubAreaPanel({
  onExplore,
  backgroundImage,
}: HubAreaPanelProps) {
  return (
    <div className="flex flex-[1.25] items-center justify-center">
      <div
        className="
          flex h-full w-full flex-col
          overflow-hidden
          rounded-t-xl rounded-b-none
          border border-[rgba(70,58,44,0.35)]
        "
      >
        <div
          className="
            relative flex flex-1 items-center justify-center
            overflow-hidden
            rounded-t-xl
border-b border-[rgba(70,58,44,0.35)]
bg-[rgba(250,238,210,0.92)]
            bg-cover bg-center
          "
          style={{
            backgroundImage: backgroundImage
              ? `url(/images/${backgroundImage})`
              : undefined,
          }}
        />

        <div className="flex flex-col">
          <HubActionButton
            title="Explore"
            image="/images/alt/journal-btn2.png"
            onClick={onExplore}
          />

          <HubActionButton
            title="Life"
            image="/images/alt/character-btn2.png"
          />
        </div>
      </div>
    </div>
  );
}