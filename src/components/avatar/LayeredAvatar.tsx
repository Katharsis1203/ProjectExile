import type { CSSProperties } from "react";
import type { AvatarLayer, PlayerAvatar } from "../../types/avatar";

type LayeredAvatarProps = {
  avatar: PlayerAvatar;
  className?: string;
};

type AvatarLayerStyle = CSSProperties & {
  "--avatar-x": string;
  "--avatar-y": string;
  "--avatar-scale": number;
  "--avatar-lift": string;
  "--avatar-shadow-y": string;
  "--avatar-shadow-blur": string;
  "--avatar-depth-z": string;
};

function getLayerStyle(layer: AvatarLayer, index: number): AvatarLayerStyle {
  const depth = layer.depth ?? index * 4;

  return {
    "--avatar-x": `${layer.offsetX ?? 0}px`,
    "--avatar-y": `${layer.offsetY ?? 0}px`,
    "--avatar-scale": layer.scale ?? 1,
    "--avatar-lift": `${Math.min(12, 2 + depth * 0.22)}px`,
    "--avatar-shadow-y": `${Math.min(13, 2 + depth * 0.2)}px`,
    "--avatar-shadow-blur": `${Math.min(15, 4 + depth * 0.22)}px`,
    "--avatar-depth-z": `${Math.min(36, depth)}px`,
    zIndex: 20 + index,
    opacity: layer.opacity ?? 1,
  };
}

export default function LayeredAvatar({ avatar, className = "" }: LayeredAvatarProps) {
  const visibleLayers = avatar.layers.filter((layer) => layer.visible !== false);

  return (
    <figure
      className={`avatar-stage group/avatar relative isolate mx-auto h-[210px] w-full max-w-[195px] outline-none ${className}`}
      tabIndex={0}
      aria-label={`${avatar.name} layered avatar`}
    >
      <div aria-hidden="true" className="avatar-stage__halo absolute inset-x-[9%] bottom-[12px] top-[18px]" />
      <div aria-hidden="true" className="avatar-stage__well absolute inset-x-[3px] bottom-[12px] top-[12px]" />
      <div aria-hidden="true" className="avatar-stage__back-shadow absolute inset-x-[16%] bottom-[17px] top-[27px]" />

      <div className="avatar-stack absolute inset-x-[-8px] bottom-[-4px] top-[-24px]">
        {visibleLayers.map((layer, index) => (
          <img
            key={layer.id}
            src={`/images/avatar/${layer.image}`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`avatar-layer avatar-layer--${layer.slot} pointer-events-none absolute inset-0 h-full w-full select-none object-contain object-bottom`}
            style={getLayerStyle(layer, index)}
          />
        ))}
      </div>

      <div aria-hidden="true" className="avatar-stage__rim absolute inset-x-[2px] bottom-[10px] top-[10px]" />
      <div aria-hidden="true" className="avatar-stage__foreground absolute inset-x-[9px] bottom-[3px] h-[32px]" />
    </figure>
  );
}
