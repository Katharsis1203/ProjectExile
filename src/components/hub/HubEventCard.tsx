type HubEventCardProps = {
  eventId: string;
};

export default function HubEventCard({ eventId }: HubEventCardProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-800 p-4 hover:bg-neutral-700 transition-colors">

      <span className="font-semibold text-neutral-200">
        {eventId}
      </span>

    </div>
  );
}