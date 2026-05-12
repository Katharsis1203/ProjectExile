// HubActionButton.tsx

type HubActionButtonProps = {
  title: string;
  image: string;
  onClick?: () => void;
};

export default function HubActionButton({
  title,
  image,
  onClick,
}: HubActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group relative h-[72px] w-full overflow-hidden
        first:border-t border-b border-[rgba(70,58,44,0.35)]
        bg-[rgba(250,238,210,0.9)]
        transition hover:brightness-110
        last:border-b-0
      "
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />


      <span
        className="
          pointer-events-none absolute right-4 top-1/2 z-10
          -translate-y-1/2 translate-x-6
          text-[28px] font-bold tracking-wide
          text-[#e6d8b5]
          opacity-0
          drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]
          transition-all duration-200 ease-out
          group-hover:translate-x-0
          group-hover:opacity-100
        "
      >
        {title}
      </span>
    </button>
  );
}