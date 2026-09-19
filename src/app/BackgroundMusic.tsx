import { useEffect, useRef, useState } from "react";
import { getPublicAssetUrl } from "../shared/lib/publicAssetUrl";
import { useAudioVolume } from "../shared/hooks/useAudioVolume";

const MUSIC_MUTED_KEY = "project-exile.music-muted";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUSIC_MUTED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useAudioVolume(audioRef, "musicVolume");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function resume() {
      if (audio && !document.hidden && audio.paused) {
        void audio.play().catch(() => {
          // Browsers may require a user gesture before starting music.
        });
      }
    }

    function handleVisibility() {
      if (document.hidden) audio?.pause();
      else resume();
    }

    if (muted) {
      audio.pause();
      return;
    }

    resume();
    window.addEventListener("click", resume);
    window.addEventListener("keydown", resume);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      audio.pause();
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", resume);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [muted]);

  function toggleMusic() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    try {
      localStorage.setItem(MUSIC_MUTED_KEY, String(nextMuted));
    } catch {
      // The control still works when browser storage is unavailable.
    }
    if (!nextMuted) void audioRef.current?.play().catch(() => {});
  }

  return (
    <>
      <audio ref={audioRef} src={getPublicAssetUrl("audio/main-menu.mp3")} loop preload="none" />
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={muted ? "Enable background music" : "Mute background music"}
        aria-pressed={!muted}
        className="fixed bottom-3 left-3 z-[110] rounded-md border border-[#cdb890]/50 bg-[#241e18]/85 px-3 py-1.5 text-xs text-[#f6ead1] shadow-sm hover:bg-[#3b2b1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cdb890]"
      >
        Music: {muted ? "Off" : "On"}
      </button>
    </>
  );
}
