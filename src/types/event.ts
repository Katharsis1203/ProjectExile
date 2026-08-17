export type StatCheck = {
  stat: string;
  difficulty: number;
};

export type OutcomeBucket = {
  id: string;
  threshold: number;
  flavourText?: string;
  next: string;
};

export type ThresholdOutcome = {
  buckets: OutcomeBucket[];
};

type BaseEventChoice = {
  text: string;
  returnToHub?: boolean;
  endEvent?: boolean;
};

export type SimpleEventChoice = BaseEventChoice & {
  type: "simple";
  next?: string;
};

export type CheckedEventChoice = BaseEventChoice & {
  type: "checked";
  statChecks: StatCheck[];
  weighted?: ThresholdOutcome;
  next?: string;
};

export type EventChoice = SimpleEventChoice | CheckedEventChoice;

export type EventNode = {
  id: string;
  title: string;
  text: string;
  image?: string | null;
  background?: string | null;
  miscText?: string;
  choices: EventChoice[];
};

export type GameEvent = {
  schemaVersion: number;
  id: string;
  type: "event";
  name: string;
  tags?: string[];
  cardImage?: string | null;
  cardColourImage?: string | null;
  nodes: Record<string, EventNode>;
};

export type CheckResult = StatCheck & {
  statValue: number;
  roll: number;
  success: boolean;
};

export type NodeResolution = {
  checks: CheckResult[];
  flavourText?: string;
};
