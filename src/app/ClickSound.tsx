import { useEffect, useRef } from "react";
import { getPublicAssetUrl } from "../shared/lib/publicAssetUrl";

import { useAudioVolume } from "../shared/hooks/useAudioVolume";

export default function ClickSound() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsAudioRef = useRef<HTMLAudioElement>(null);
  const eventAudioRef = useRef<HTMLAudioElement>(null);
  const choiceAudioRef = useRef<HTMLAudioElement>(null);
  const dropAudioRef = useRef<HTMLAudioElement>(null);

  useAudioVolume(audioRef, "uiVolume");
  useAudioVolume(settingsAudioRef, "uiVolume");
  useAudioVolume(eventAudioRef, "eventClickVolume");
  useAudioVolume(choiceAudioRef, "passageVolume");
  useAudioVolume(dropAudioRef, "eventDropVolume");

  useEffect(() => {
    const audio = audioRef.current;
    const settingsAudio = settingsAudioRef.current;
    const eventAudio = eventAudioRef.current;
    const choiceAudio = choiceAudioRef.current;
    const dropAudio = dropAudioRef.current;
    if (!audio || !settingsAudio || !eventAudio || !choiceAudio || !dropAudio) return;

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest(
        'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"]',
      );
      if (!control || control.matches(":disabled") ||
        control.closest('[aria-disabled="true"], [inert]')) return;

      let clickAudio = audio;
      if (control.closest('[data-click-sound="event-drop"]')) {
        clickAudio = dropAudio;
      } else if (control.closest("[data-event-card]")) {
        clickAudio = eventAudio;
      } else if (control.closest('[data-click-sound="passage-choice"]')) {
        clickAudio = choiceAudio;
      } else if (control.closest('[data-click-sound="settings"]')) {
        clickAudio = settingsAudio;
      }
      if (clickAudio) {
        clickAudio.currentTime = 0;
        void clickAudio.play().catch(() => {
          // Sound failure must not interrupt the interaction.
        });
      }
    }

    // Capture the target before navigation or a dialog removes the control.
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      audio.pause();
      settingsAudio.pause();
      eventAudio.pause();
      choiceAudio.pause();
      dropAudio.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={getPublicAssetUrl("audio/click2.mp3")} preload="auto" />
      <audio ref={settingsAudioRef} src={getPublicAssetUrl("audio/click1.mp3")} preload="auto" />
      <audio ref={eventAudioRef} src={getPublicAssetUrl("audio/event-click2.mp3")} preload="auto" />
      <audio ref={choiceAudioRef} src={getPublicAssetUrl("audio/event-click1.mp3")} preload="auto" />
      <audio ref={dropAudioRef} src={getPublicAssetUrl("audio/event-drop.mp3")} preload="auto" />
    </>
  );
}
