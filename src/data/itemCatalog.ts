import type { EventEffect } from "../types/event";

export type ItemCategory =
  | "consumable"
  | "tool"
  | "quest"
  | "currency"
  | "curio";

export type ItemUseDefinition = {
  label: string;
  description: string;
  effects: EventEffect[];
};

export type ItemDefinition = {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  use?: ItemUseDefinition;
  discardable?: boolean;
};

const ITEM_CATALOG: Record<string, ItemDefinition> = {
  rope: {
    id: "rope",
    name: "Rope",
    description: "A practical length of weathered climbing rope. Useful for crossings, hauling and improvised rescues.",
    category: "tool",
  },
  bandage: {
    id: "bandage",
    name: "Clean Bandage",
    description: "Clean cloth suitable for binding wounds or protecting damaged skin from the cold.",
    category: "consumable",
    use: {
      label: "Dress wounds",
      description: "Consume one bandage to recover 12 Health.",
      effects: [{ type: "resource", resource: "health", amount: 12 }],
    },
  },
  dry_kindling: {
    id: "dry_kindling",
    name: "Dry Kindling",
    description: "Split, dry wood kept sheltered from the Snowlands weather. Valuable wherever a reliable flame matters.",
    category: "tool",
  },
  resin_kindling: {
    id: "resin_kindling",
    name: "Resin-rich Kindling",
    description: "Pitch-heavy wood that catches quickly and burns hot, even in difficult conditions.",
    category: "tool",
  },
  bread_heel: {
    id: "bread_heel",
    name: "Bread Heel",
    description: "A dense heel of dark bread, wrapped against the cold. Plain, filling and difficult to spoil.",
    category: "consumable",
    use: {
      label: "Eat",
      description: "Consume one bread heel to reduce Hunger by 18.",
      effects: [{ type: "resource", resource: "hunger", amount: -18 }],
    },
  },
  drowned_bell: {
    id: "drowned_bell",
    name: "Drowned Bell",
    description: "A small bronze bell recovered from beneath the ice. Its metal remains unnaturally cold.",
    category: "quest",
    discardable: false,
  },
  rime_attuned_bell: {
    id: "rime_attuned_bell",
    name: "Rime-attuned Bell",
    description: "The drowned bell after the rime script answered its presence. Frost gathers along its lip without melting.",
    category: "quest",
    discardable: false,
  },
  sealed_courier_tube: {
    id: "sealed_courier_tube",
    name: "Sealed Courier Tube",
    description: "A hub-stamped courier tube with its wax cap still intact. Whatever it carries was meant to arrive unopened.",
    category: "quest",
    discardable: false,
  },
  winter_scrip: {
    id: "winter_scrip",
    name: "Winter Scrip",
    description: "Local trade chits accepted by storehouses and caravan factors throughout the Snowlands.",
    category: "currency",
    discardable: false,
  },
  bitter_tea: {
    id: "bitter_tea",
    name: "Bitter Tea",
    description: "A small packet of sharp-smelling warming tea. Unpleasant, but prized by people who work outside the walls.",
    category: "consumable",
    use: {
      label: "Drink",
      description: "Consume one packet to recover 14 Stamina and 4 Mana.",
      effects: [
        { type: "resource", resource: "stamina", amount: 14 },
        { type: "resource", resource: "mana", amount: 4 },
      ],
    },
  },
};

function prettifyItemId(itemId: string): string {
  return itemId
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getItemDefinition(itemId: string): ItemDefinition {
  const key = itemId.trim().toLowerCase();
  return (
    ITEM_CATALOG[key] ?? {
      id: key,
      name: prettifyItemId(key),
      description: "An item carried by the player.",
      category: "curio",
    }
  );
}

export function getItemCategoryLabel(category: ItemCategory): string {
  switch (category) {
    case "consumable":
      return "Consumable";
    case "tool":
      return "Tool";
    case "quest":
      return "Key Item";
    case "currency":
      return "Currency";
    case "curio":
      return "Curio";
  }
}
