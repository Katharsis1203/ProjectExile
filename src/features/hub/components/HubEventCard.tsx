import { useId, useRef } from "react";
import { getEventImageUrl, getPublicAssetUrl } from "../../../shared/lib/publicAssetUrl";
import { useAudioVolume } from "../../../shared/hooks/useAudioVolume";
import "./HubEventCard.css";

type HubEventCardProps = {
  title: string;
  image: string | null;
  colourImage: string | null;
  categoryLabel?: string;
  hook?: string;
  detail?: string;
  animationDelay: number;
  dealSound: string;
  onClick: (element: HTMLElement) => void;
};

export default function HubEventCard({
  title,
  image,
  colourImage,
  categoryLabel = "Local lead",
  hook,
  detail,
  animationDelay,
  dealSound,
  onClick,
}: HubEventCardProps) {
  const dealAudioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedDealRef = useRef(false);
  useAudioVolume(dealAudioRef, "eventDealVolume");
  const svgId = useId().replace(/:/g, "");
  const maskId = `hub-event-mask-${svgId}`;
  const gooFilterId = `hub-event-goo-${svgId}`;
  const imagePath = image ? getEventImageUrl(image) : null;
  const colourImagePath = colourImage
    ? getEventImageUrl(colourImage)
    : imagePath;

  return (
    <article
      className="hub-event-deal-in group relative h-full w-full"
      style={{ animationDelay: `${animationDelay}ms` }}
      onAnimationStart={(event) => {
        if (event.target !== event.currentTarget || event.animationName !== "hub-event-deal-in" || hasPlayedDealRef.current) return;
        hasPlayedDealRef.current = true;
        void dealAudioRef.current?.play().catch(() => {
          // A blocked sound must not prevent the card from appearing.
        });
      }}
    >
      <audio ref={dealAudioRef} src={getPublicAssetUrl(`audio/${dealSound}`)} preload="auto" />
      <button
        type="button"
        data-event-card
        onClick={(event) => onClick(event.currentTarget)}
        aria-label={`Open event: ${title}`}
        className="absolute inset-0 z-20 cursor-pointer rounded-[12px] border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      />

      <div className="hub-event-card-layer relative h-full w-full overflow-hidden rounded-[12px] border border-[#62523f]/35 bg-[cornsilk] text-left shadow-[0_7px_14px_rgba(38,43,50,0.18),inset_0_0_0_1px_rgba(255,250,237,0.42)] transition-[transform,box-shadow,filter] duration-250">
        {imagePath ? (
          <>
            <div
              className="hub-event-image-base absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${imagePath}')` }}
            />

            <svg
              aria-hidden="true"
              className="hub-event-ink-reveal absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id={gooFilterId}>
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="1.7"
                    result="blur"
                  />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
                    result="goo"
                  />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>

                <mask id={maskId} maskUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="100" height="100" fill="black" />
                  <g
                    className="hub-event-ink-blobs"
                    filter={`url(#${gooFilterId})`}
                    fill="white"
                  >
                    <g className="hub-event-blob hub-event-blob--1">
                      <ellipse cx="33" cy="43" rx="8.5" ry="6.4" />
                    </g>
                    <g className="hub-event-blob hub-event-blob--2">
                      <ellipse cx="58" cy="35" rx="6.6" ry="5.2" />
                    </g>
                    <g className="hub-event-blob hub-event-blob--3">
                      <ellipse cx="67" cy="62" rx="8.2" ry="6.7" />
                    </g>
                    <g className="hub-event-blob hub-event-blob--4">
                      <ellipse cx="41" cy="70" rx="7.3" ry="5.6" />
                    </g>
                    <g className="hub-event-blob hub-event-blob--5">
                      <ellipse cx="79" cy="46" rx="5.6" ry="4.5" />
                    </g>
                  </g>
                </mask>
              </defs>

              <image
                href={colourImagePath ?? imagePath}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                mask={`url(#${maskId})`}
                className="hub-event-image-colour-svg"
              />
            </svg>
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(244,235,211,0.92),rgba(194,179,148,0.82))]" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,250,238,0.01)_0%,transparent_56%,rgba(242,234,216,0.05)_74%,rgba(242,234,216,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(to_top,rgba(248,241,225,0.84)_0%,rgba(248,241,225,0.58)_44%,rgba(248,241,225,0.18)_76%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_15px_rgba(51,43,34,0.14)]" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 pt-7 text-[#3b3024]">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-[9px] font-bold uppercase tracking-[0.24em] text-[#75634d]/80">
              {categoryLabel}
            </span>
            {detail ? (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#695a47]/72">
                {detail}
              </span>
            ) : null}
          </div>

          <h3 className="truncate font-serif text-lg font-bold leading-tight tracking-wide text-[#30261d] drop-shadow-[0_1px_0_rgba(255,249,234,0.7)]">
            {title}
          </h3>

          {hook ? (
            <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#574837]/82">
              {hook}
            </p>
          ) : null}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-10 translate-y-1 rounded-md border border-[#776349]/25 bg-[rgba(247,239,220,0.92)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#493b2c]/0 opacity-0 shadow-sm backdrop-blur-[1px] transition-all duration-200 group-hover:translate-y-0 group-hover:text-[#493b2c]/90 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:text-[#493b2c]/90 group-focus-within:opacity-100">
          Open
        </div>
      </div>
    </article>
  );
}
