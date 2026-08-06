// src/components/hub/HubEventCard.tsx

type HubEventCardProps = {
  eventTitle: string;
  eventImage: string | null;
  categoryLabel?: string;
  hook?: string;
  detail?: string;
  animationDelay: number;
  onClick: (element: HTMLElement) => void;
};

export default function HubEventCard({
  eventTitle,
  eventImage,
  categoryLabel = "Local lead",
  hook,
  detail,
  animationDelay,
  onClick,
}: HubEventCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      aria-label={`Open event: ${eventTitle}`}
      className="group relative h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <article
        className="hub-event-deal-in hub-event-card-layer relative h-full w-full overflow-hidden rounded-[12px] border border-[#62523f]/35 bg-[cornsilk] shadow-[0_7px_14px_rgba(38,43,50,0.18),inset_0_0_0_1px_rgba(255,250,237,0.42)] transition-[transform,box-shadow,filter] duration-200"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {eventImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center saturate-[1.02] contrast-[1.02] brightness-[1.06] transition-[filter] duration-250 group-hover:saturate-[1.08] group-hover:contrast-[1.04] group-hover:brightness-[1.08]"
            style={{
              backgroundImage: `url('/images/events/${eventImage}')`,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(244,235,211,0.92),rgba(194,179,148,0.82))]" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,250,238,0.01)_0%,transparent_58%,rgba(242,234,216,0.08)_76%,rgba(242,234,216,0.24)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(to_top,rgba(248,241,225,0.93)_0%,rgba(248,241,225,0.72)_44%,rgba(248,241,225,0.24)_76%,transparent_100%)]" />
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
            {eventTitle}
          </h3>

          {hook ? (
            <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#574837]/82">
              {hook}
            </p>
          ) : null}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-10 translate-y-1 rounded-md border border-[#776349]/25 bg-[rgba(247,239,220,0.92)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#493b2c]/0 opacity-0 shadow-sm backdrop-blur-[1px] transition-all duration-200 group-hover:translate-y-0 group-hover:text-[#493b2c]/90 group-hover:opacity-100">
          Open
        </div>
      </article>
    </button>
  );
}
