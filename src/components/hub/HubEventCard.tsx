// HubEventCard.tsx

import type { CSSProperties } from "react";

type HubEventCardProps = {
  eventId: string;
  eventImage: string | null;
  tilt: string;
  animationDelay: number;
  onClick: (element: HTMLElement) => void;
};

export default function HubEventCard({
  eventId,
  eventImage,
  tilt,
  animationDelay,
  onClick,
}: HubEventCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      className="group relative h-full w-full bg-transparent focus:outline-none"
    >
      <div
        className="hub-event-deal-in h-full w-full"
        style={
          {
            "--slot-tilt": tilt,
            animationDelay: `${animationDelay}ms`,
          } as CSSProperties
        }
      >
        <div className="hub-event-card-layer relative h-full w-full bg-[url('/images/parch2.png')] bg-[length:100%_100%] bg-center bg-no-repeat drop-shadow-[0_8px_4px_rgba(0,0,0,0.35)] transition-[transform,filter] duration-200">
          <div className="absolute inset-2.5 overflow-hidden rounded-lg ">
            <div
              className="event-mask absolute inset-0 bg-cover bg-center opacity-95"
              style={{
                backgroundImage: eventImage
                  ? `url('/images/events/${eventImage}')`
                  : undefined,
              }}
            />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 translate-y-2 rounded-md border border-black/15 bg-[rgba(250,238,210,0.82)] px-3 py-1 text-sm font-bold text-[#2b2b2b] opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {eventId}
          </div>
        </div>
      </div>
    </button>
  );
}