// src/types/node.ts

export type StatCheck = {
  stat: string;
  difficulty: number;
};

export type CheckResult = {
  stat: string;
  difficulty: number;
  value: number;
  success: boolean;
};

export type WeightedBucket = {
  id: string;
  threshold: number;
  flavourText?: string;
  next: string;
};

export type NodeChoice = {
  type?: "simple" | "checked";
  text: string;
  next?: string;
  returnToHub?: boolean;
  endEvent?: boolean;
  statChecks?: StatCheck[];
  weighted?: {
    buckets: WeightedBucket[];
  };
};

export type NodeData = {
  id: string;
  title: string;
  text: string;
  image?: string;
  background?: string;
  miscText?: string;
  choices?: NodeChoice[];
};

export type NodeResolution = {
  checks: CheckResult[];
  flavourText?: string;
};