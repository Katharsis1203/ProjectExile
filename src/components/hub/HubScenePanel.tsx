import {
  normaliseLighting,
  normaliseWeather,
  normaliseWeatherIntensity,
} from "../../engine/sceneEffects";
import type {
  Hub,
  HubTag,
  HubTagTone,
  HubWeatherIntensity,
} from "../../types/hub";

type HubScenePanelProps = {
  hub: Hub | null;
  loadError: string | null;
  onRetry: () => void;
};

type SnowfallProps = {
  depth: "far" | "near";
  intensity: HubWeatherIntensity;
};

const tagToneClasses: Record<HubTagTone, string> = {
  cold: "border-sky-100/30 bg-slate-950/28 text-sky-50",
  danger: "border-rose-100/25 bg-stone-950/30 text-rose-50",
  neutral: "border-stone-100/25 bg-stone-950/28 text-stone-50",
  night: "border-indigo-100/25 bg-slate-950/32 text-indigo-50",
};

function Snowfall({ depth, intensity }: SnowfallProps) {
  return (
    <div
      aria-hidden="true"
      className={`hub-snow-field hub-snow-field--${depth} hub-snow-field--${intensity}`}
    >
      <span
        className={`hub-snow-layer hub-snow-layer--${depth} hub-snow-layer--${intensity}`}
      />
    </div>
  );
}

function getTimeTone(lighting: ReturnType<typeof normaliseLighting>): HubTagTone {
  if (lighting === "night") {
    return "night";
  }

  return lighting === "dawn" || lighting === "dusk" ? "neutral" : "cold";
}

export default function HubScenePanel({
  hub,
  loadError,
  onRetry,
}: HubScenePanelProps) {
  const scene = hub?.scene;
  const sceneImage = scene?.image ?? hub?.image;
  const focalPoint = scene?.focalPoint ?? "50% 55%";
  const lighting = normaliseLighting(
    scene?.effects?.lighting ?? scene?.tone,
  );
  const weather = normaliseWeather(
    scene?.effects?.weather ?? scene?.weather,
  );
  const intensity = normaliseWeatherIntensity(
    scene?.effects?.weatherIntensity,
  );
  const tags = hub?.tags ?? [];
  const ambient = hub?.ambient?.[0];
  const timeLabel = scene?.labels?.time ?? scene?.timeOfDay;
  const weatherLabel = scene?.labels?.weather ?? scene?.weather;
  const temperatureLabel = scene?.labels?.temperature ?? scene?.temperature;
  const topBadges: HubTag[] = [
    ...(timeLabel ? [{ label: timeLabel, tone: getTimeTone(lighting) }] : []),
    ...(weatherLabel
      ? [
          {
            label: weatherLabel,
            tone: weather === "snow" ? ("cold" as const) : ("neutral" as const),
          },
        ]
      : []),
    ...(temperatureLabel
      ? [{ label: temperatureLabel, tone: "neutral" as const }]
      : []),
  ];
  const isSnowing = weather === "snow";
  const isFoggy = weather === "fog";

  return (
    <main className="flex min-w-0 items-center justify-center xl:col-start-2 xl:row-start-1">
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-0 scale-[0.98] bg-[rgba(35,25,15,0.28)] blur-[24px]" />

        <section
          aria-busy={!hub && !loadError}
          className="relative flex h-full min-h-[440px] w-full flex-col bg-[url('/images/parchment.png')] bg-[length:100%_100%] bg-center bg-no-repeat p-5 text-[#2b2b2b] sm:min-h-[540px]"
        >
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[18px] border border-[#6c5639]/30 bg-[#665a4a] shadow-[inset_0_0_22px_rgba(45,31,18,0.34)]">
            {sceneImage ? (
              <img
                src={`/images/${sceneImage}`}
                alt={`${hub?.name ?? "Hub"} landscape`}
                className={`hub-scene-image hub-scene-image--${lighting} absolute inset-0 h-full w-full object-cover`}
                style={{ objectPosition: focalPoint }}
              />
            ) : (
              <div className="absolute inset-0 bg-stone-700" />
            )}

            {scene?.layers?.map((layer) => (
              <img
                key={layer.id}
                src={`/images/${layer.image}`}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{
                  objectPosition: layer.focalPoint ?? focalPoint,
                  opacity: layer.opacity ?? 1,
                  mixBlendMode: layer.blendMode ?? "normal",
                }}
              />
            ))}

            {isSnowing ? <Snowfall depth="far" intensity={intensity} /> : null}

            <div
              aria-hidden="true"
              className={`hub-scene-lighting hub-scene-lighting--${lighting} absolute inset-0`}
            />
            <div
              aria-hidden="true"
              className={`hub-scene-vignette hub-scene-vignette--${lighting} absolute inset-0`}
            />
            {isFoggy ? (
              <div aria-hidden="true" className="hub-scene-fog absolute inset-0" />
            ) : null}
            <div aria-hidden="true" className="hub-scene-edge-wash absolute inset-0" />
            {isSnowing ? <Snowfall depth="near" intensity={intensity} /> : null}
            <div aria-hidden="true" className="hub-scene-grain absolute inset-0" />

            <header className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-5 text-stone-50">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-200/80">
                  Current hub
                </p>
                <h1 className="truncate font-serif text-3xl font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] sm:text-4xl">
                  {loadError ? "Unable to load hub" : (hub?.name ?? "Loading…")}
                </h1>
              </div>

              <div className="flex max-w-[48%] flex-wrap justify-end gap-2">
                {(topBadges.length > 0 ? topBadges : tags).map((tag) => (
                  <span
                    key={tag.label}
                    className={`rounded-md border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-[1px] ${tagToneClasses[tag.tone ?? "neutral"]}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </header>

            <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-stone-50">
              <div className="max-w-[640px]">
                {loadError ? (
                  <div role="alert">
                    <p className="text-sm leading-6 text-red-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {loadError}
                    </p>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-3 rounded-md border border-stone-100/45 bg-stone-950/45 px-3 py-1.5 text-sm font-semibold transition hover:bg-stone-950/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-stone-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {hub?.description ?? "The landscape is still taking shape."}
                    </p>
                    {ambient ? (
                      <p className="mt-2 border-l border-stone-100/35 pl-3 font-serif text-sm italic text-stone-200/80">
                        “{ambient}”
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
