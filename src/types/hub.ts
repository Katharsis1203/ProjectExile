import type { Event, EventPoolEntry } from "./event";

export type Hub = {
  schemaVersion: number;
  id: string;
  name: string;
  type: "hub";
  image: string;
  background?: string;
  ambient?: string[];
  eventPools: {
    life: EventPoolEntry[];
    explore: EventPoolEntry[];
    special: EventPoolEntry[];
  };
};

export type LoadedHub = {
  hub: Hub;
  events: Record<string, Event>;
};