import { advanceCharacterTurn, getEffectiveStats } from "./character.ts";
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
  if (session.isComplete) return { kind: "finished", player, session };

  if (!areChoiceRequirementsMet(choice, player.inventory, player)) {
    const missing = getUnmetChoiceRequirements(choice, player.inventory, player)
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
    ? resolveChoice(choice, getEffectiveStats(player), random)
    : resolveChoice(choice, getEffectiveStats(player));
  // Validate the destination before spending items or granting rewards.
  if (result.next && !choice.endEvent && !choice.returnToHub && !event.nodes[result.next]) {
    return { kind: "invalid-target", player, session, message: `The event targets a missing node named "${result.next}".` };
  }
  const claimed = choice.rewardId && player.character.claimedRewards.includes(choice.rewardId);
  const applied = applyEventEffects(advanceCharacterTurn(player), claimed ? [] : result.effects);
  if (choice.rewardId && !claimed) applied.player = { ...applied.player, character: { ...applied.player.character, claimedRewards: [...applied.player.character.claimedRewards, choice.rewardId] } };
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

export function savePassage(session: PassageSession): import("../types/session").SavedPassage {
  return { nodeId: session.node.id, lastKnownImage: session.lastKnownImage,
    resolution: structuredClone(session.resolution), appliedEffects: structuredClone(session.appliedEffects),
    isComplete: session.isComplete, canReturn: session.canReturn };
}

export function restorePassage(event: GameEvent, saved: import("../types/session").SavedPassage): PassageSession | null {
  const node = event.nodes[saved.nodeId];
  if (!node) return null;
  return { node, lastKnownImage: saved.lastKnownImage ?? node.image ?? null,
    resolution: saved.resolution, appliedEffects: saved.appliedEffects,
    isComplete: saved.isComplete, canReturn: saved.canReturn };
}
