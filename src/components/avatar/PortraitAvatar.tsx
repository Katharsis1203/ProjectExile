import type { AvatarPortrait } from "../../types/avatar";

type PortraitAvatarProps = {
  portrait: AvatarPortrait;
  className?: string;
};

export default function PortraitAvatar({ portrait, className = "" }: PortraitAvatarProps) {
  const imageFitClass = portrait.imageFit === "contain" ? "object-contain object-bottom" : "object-cover object-center";

  return (
    <figure
      className={`avatar-portrait-stage relative isolate mx-auto h-[238px] w-full max-w-[202px] overflow-hidden rounded-[26px] outline-none ${className}`}
      tabIndex={0}
      aria-label={`${portrait.name} portrait`}
    >
      <div aria-hidden="true" className={`avatar-portrait-stage__shadow avatar-portrait-stage__shadow--${portrait.stageTone ?? "violet"}`} />
      <div aria-hidden="true" className={`avatar-portrait-stage__backdrop avatar-portrait-stage__backdrop--${portrait.stageTone ?? "violet"}`} />
      <div aria-hidden="true" className="avatar-portrait-stage__wash" />
      <div aria-hidden="true" className="avatar-portrait-stage__filigree" />

      <div className="avatar-portrait-stage__image-wrap absolute inset-[10px] overflow-hidden rounded-[20px]">
        <img
          src={`/images/avatar/${portrait.image}`}
          alt={portrait.imageAlt ?? ""}
          draggable={false}
          className={`avatar-portrait-image h-full w-full select-none ${imageFitClass}`}
        />
      </div>

      <div aria-hidden="true" className="avatar-portrait-stage__inner-ring absolute inset-[10px] rounded-[20px]" />
      <div aria-hidden="true" className="avatar-portrait-stage__frame absolute inset-0 rounded-[26px]" />
    </figure>
  );
}
