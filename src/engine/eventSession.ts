import type { EventChoice, EventNode, GameEvent, NodeResolution } from "../types/event";
import type { AppliedEventEffect, PlayerState } from "../types/player";
import { resolveChoice, type RandomSource } from "./eventRules.ts";
import {
  applyEventEffects,
  areChoiceRequirementsMet,
  describeChoiceRequirement,
  getUnmetChoiceRequirements,
} from "./playerState.ts";

export type PassageSession = {
  node: EventNode;
  lastKnownImage: string | null;
  resolution: NodeResolution | null;
  appliedEffects: AppliedEventEffect[];
  isComplete: boolean;
  canReturn: boolean;
};

export type EventSessionOutcome = {
  kind: "advanced" | "complete" | "finished" | "blocked" | "invalid-target";
  player: PlayerState;
  session: PassageSession;
  message?: string;
};

type CreatePassageSessionOptions = {
  isComplete?: boolean;
  canReturn?: boolean;
};

type AdvanceEventSessionOptions = {
  event: GameEvent;
  session: PassageSession;
  choice: EventChoice;
  player: PlayerState;
  random?: RandomSource;
};

export function createPassageSession(
  node: EventNode,
  { isComplete = false, canReturn = true }: CreatePassageSessionOptions = {},
): PassageSession {
  return {
    node,
    lastKnownImage: node.image ?? null,
    resolution: null,
    appliedEffects: [],
    isComplete,
    canReturn,
  };
}

export function advanceEventSession({
  event,
  session,
  choice,
  player,
  random,
}: AdvanceEventSessionOptions): EventSessionOutcome {
  if (!areChoiceRequirementsMet(choice, player.inventory)) {
    const missing = getUnmetChoiceRequirements(choice, player.inventory)
      .map(describeChoiceRequirement)
      .join(", ");

    return {
      kind: "blocked",
      player,
      session,
      message: `This choice requires: ${missing}.`,
    };
  }

  const result = random
    ? resolveChoice(choice, player.stats, random)
    : resolveChoice(choice, player.stats);
  const applied = applyEventEffects(player, result.effects);
  const resolution: NodeResolution = {
    checks: result.checks,
    ...(result.flavourText ? { flavourText: result.flavourText } : {}),
  };
  const hasOutcomeToShow =
    applied.appliedEffects.length > 0 ||
    result.checks.length > 0 ||
    Boolean(result.flavourText);

  if (choice.returnToHub || choice.endEvent || !result.next) {
    if (!hasOutcomeToShow) {
      return {
        kind: "finished",
        player: applied.player,
        session,
      };
    }

    return {
      kind: "complete",
      player: applied.player,
      session: {
        ...session,
        resolution,
        appliedEffects: applied.appliedEffects,
        isComplete: true,
        canReturn: false,
      },
    };
  }

  const nextNode = event.nodes[result.next];

  if (!nextNode) {
    return {
      kind: "invalid-target",
      player: applied.player,
      session,
      message: `The event targets a missing node named ${result.next}.`,
    };
  }

  return {
    kind: "advanced",
    player: applied.player,
    session: {
      node: nextNode,
      lastKnownImage: nextNode.image ?? session.lastKnownImage,
      resolution,
      appliedEffects: applied.appliedEffects,
      isComplete: false,
      canReturn: false,
    },
  };
}
