import type { AvatarPortrait } from "../../types/avatar";
import "./PortraitAvatar.css";

type PortraitAvatarProps = {
  portrait: AvatarPortrait;
  className?: string;
};

export default function PortraitAvatar({ portrait, className = "" }: PortraitAvatarProps) {
  const imageFitClass = portrait.imageFit === "cover"
    ? "object-cover object-center"
    : "object-contain object-center";

  return (
    <figure
      className={`avatar-portrait-stage relative mx-auto h-[250px] w-full max-w-[204px] overflow-hidden rounded-[16px] ${className}`}
    >
      <div
        aria-hidden="true"
        className={`avatar-portrait-stage__backdrop avatar-portrait-stage__backdrop--${portrait.stageTone ?? "violet"}`}
      />
      <div aria-hidden="true" className="avatar-portrait-stage__wash" />

      <div className="avatar-portrait-stage__image-wrap absolute inset-[4px] overflow-hidden rounded-[13px]">
        <img
          src={`/images/avatar/${portrait.image}`}
          alt={portrait.imageAlt ?? ""}
          draggable={false}
          className={`avatar-portrait-image h-full w-full select-none ${imageFitClass}`}
        />
      </div>

      <div aria-hidden="true" className="avatar-portrait-stage__inner-ring absolute inset-[4px] rounded-[13px]" />
      <div aria-hidden="true" className="avatar-portrait-stage__frame absolute inset-0 rounded-[16px]" />
    </figure>
  );
}
