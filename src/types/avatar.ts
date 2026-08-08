export type AvatarLayerSlot =
  | "base"
  | "skin"
  | "tattoo"
  | "underclothes"
  | "clothing"
  | "armor"
  | "outerwear"
  | "hair"
  | "accessory"
  | "headgear"
  | "condition";

export type AvatarLayer = {
  id: string;
  slot: AvatarLayerSlot;
  image: string;
  label?: string;
  visible?: boolean;
  opacity?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  depth?: number;
};

export type PlayerAvatar = {
  id: string;
  name: string;
  layers: AvatarLayer[];
};


export type AvatarPortrait = {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
  imageFit?: "cover" | "contain";
  stageTone?: "violet" | "forest" | "night" | "ember";
};
