import type { PlayerAvatar } from "../types/avatar";

/**
 * Temporary avatar state until equipment/character state owns these values.
 * All images are relative to /public/images/avatar/ and share one 480x600 canvas.
 */
export const DEFAULT_EXILE_AVATAR: PlayerAvatar = {
  id: "the_exile",
  name: "The Exile",
  layers: [
    {
      id: "base",
      slot: "base",
      image: "demo/base.svg",
      label: "Base body",
      depth: 0,
    },
    {
      id: "skin_features",
      slot: "skin",
      image: "demo/skin_features.svg",
      label: "Skin features",
      depth: 5,
    },
    {
      id: "tattoo",
      slot: "tattoo",
      image: "demo/tattoo.svg",
      label: "Tattoo",
      depth: 8,
    },
    {
      id: "underclothes",
      slot: "underclothes",
      image: "demo/underclothes.svg",
      label: "Underclothes",
      depth: 12,
    },
    {
      id: "outerwear",
      slot: "outerwear",
      image: "demo/outerwear.svg",
      label: "Outerwear",
      depth: 16,
    },
    {
      id: "armor",
      slot: "armor",
      image: "demo/armor.svg",
      label: "Armour",
      depth: 22,
    },
    {
      id: "hair",
      slot: "hair",
      image: "demo/hair.svg",
      label: "Hair",
      depth: 28,
    },
    {
      id: "condition",
      slot: "condition",
      image: "demo/condition.svg",
      label: "Condition",
      depth: 34,
      opacity: 0.78,
    },
  ],
};
