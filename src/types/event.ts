export type Event = {
    schemaVersion: number;
    id: string;
    type:"event";
    title:string;
    tags?:string[];
    nodes:EventNode[];
};

export type EventNode = {
    id: string;
    title: string;
    text: string;
    image?: string;
    background?: string;
    choices: EventChoice[];
};

export type EventChoice = SimpleChoice | CheckedChoice;

export type SimpleChoice = {
    type: "simple";
    text: string;
    next: string;
};

export type CheckedChoice = {
    type:"checked";
    text:string;
    statChecks: StatCheck[];
    weighted: WeightedOutcome;
};

export type StatCheck = {
  stat: string;
  difficulty: number;
};

export type WeightedOutcome = {
  buckets: OutcomeBucket[];
  weights: Record<string, Record<string, number>>;
  tiebreak: "first" | "random";
};

export type OutcomeBucket = {
  id: string;
  threshold: number;
  flavourText: string;
  next: string;
};

// src/types/event.ts

export type HubEventSlot = {
  id: string;
  event?: EventPoolEntry | null;
};

export type EventPoolEntry = {
  id: string;
  weight: number;
  conditions: unknown[];
  opens: {
    eventFile: string;
    nodeId: string;
  };
};