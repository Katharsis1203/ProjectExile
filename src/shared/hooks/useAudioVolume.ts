import { useEffect, type RefObject } from "react";
import {
  GAME_SETTINGS_CHANGED,
  loadGameSettings,
  type GameSettings,
} from "../../infrastructure/persistence/gamePersistence";

type VolumeSetting = "musicVolume" | "uiVolume" | "eventClickVolume" | "eventDropVolume" | "eventDealVolume" | "eventHoverVolume" | "passageVolume";

export function useAudioVolume(ref: RefObject<HTMLAudioElement | null>, setting: VolumeSetting) {
  useEffect(() => {
    function apply(settings: GameSettings) {
      if (ref.current) ref.current.volume = settings[setting] / 100;
    }
    function handleSettings(event: Event) {
      apply((event as CustomEvent<GameSettings>).detail);
    }
    apply(loadGameSettings());
    window.addEventListener(GAME_SETTINGS_CHANGED, handleSettings);
    return () => window.removeEventListener(GAME_SETTINGS_CHANGED, handleSettings);
  }, [ref, setting]);
}
