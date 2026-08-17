import "./HubImageButtonLabel.css";

type HubActionButtonProps = {
  title: string;
  image: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function HubActionButton({
  title,
  image,
  disabled = false,
  onClick,
}: HubActionButtonProps) {
  return (
    <button
      type="button"
      data-hub-action
      disabled={disabled}
      onClick={onClick}
      className="group relative h-[60px] w-full overflow-hidden border-b border-[rgba(70,58,44,0.15)] bg-transparent focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#766144]/70 disabled:cursor-not-allowed disabled:opacity-55 last:border-b-0"
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="event-mask hub-image-button-art absolute inset-0 h-full w-full object-cover"
      />

      <span className="hub-image-button-label pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 translate-x-0 text-[28px] font-bold tracking-wide opacity-100 transition-all duration-200 ease-out sm:translate-x-6 sm:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
        {title}
      </span>
    </button>
  );
}
