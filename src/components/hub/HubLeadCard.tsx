import type { CSSProperties } from "react";

type HubLeadCardProps = {
  title: string;
  image: string | null;
  animationDelay: number;
  onClick: (element: HTMLElement) => void;
};

export default function HubLeadCard({
  title,
  image,
  animationDelay,
  onClick,
}: HubLeadCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      className="group relative h-[88px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#725d40]/25 bg-[#4a4338] text-left shadow-[0_5px_12px_rgba(28,21,14,0.2)] outline-none transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_8px_17px_rgba(28,21,14,0.28)] focus-visible:ring-2 focus-visible:ring-[#766144]/55"
      style={{ animationDelay: `${animationDelay}ms` } as CSSProperties}
    >
      {image ? (
        <img
          src={`/images/events/${image}`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#716555,#403a32)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(27,21,16,0.08),rgba(27,21,16,0.18)_38%,rgba(22,16,11,0.82)_100%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_16px_rgba(27,20,13,0.24)]" />

      <div className="absolute inset-y-0 right-0 z-10 flex w-[72%] flex-col justify-center px-3.5 text-right text-stone-50">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.2em] text-stone-200/68">
          Local lead
        </p>
        <h3 className="line-clamp-2 font-serif text-[15px] font-bold leading-[1.1] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {title}
        </h3>
      </div>
    </button>
  );
}
