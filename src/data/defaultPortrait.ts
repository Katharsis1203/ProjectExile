import type { AvatarPortrait } from "../types/avatar";

/**
 * Interim single-image portrait setup while we explore a less literal,
 * more player-projective avatar style. The framing/background are handled
 * in the UI so the portrait art can move toward transparent assets later.
 */
export const DEFAULT_EXILE_PORTRAIT: AvatarPortrait = {
  id: "the_exile_portrait",
  name: "The Exile",
  image: "portraits/exile_soft_portrait.png",
  imageAlt: "Portrait of the Exile",
  imageFit: "cover",
  stageTone: "violet",
};
