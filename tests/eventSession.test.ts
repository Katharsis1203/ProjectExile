import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultPlayer } from "../src/data/defaultPlayer.ts";
import {
  advanceEventSession,
  createPassageSession,
} from "../src/engine/eventSession.ts";
import type { EventNode, GameEvent } from "../src/types/event.ts";

const openingNode: EventNode = {
  id: "start",
  title: "Start",
  text: "The beginning.",
  image: "start.png",
  choices: [],
};

const nextNode: EventNode = {
  id: "next",
  title: "Next",
  text: "The continuation.",
  choices: [],
};

const event: GameEvent = {
  schemaVersion: 2,
  id: "test_event",
  type: "event",
  name: "Test Event",
  nodes: { start: openingNode, next: nextNode },
};

test("event sessions advance while retaining the last illustrated image", () => {
  const player = createDefaultPlayer();
  const outcome = advanceEventSession({
    event,
    session: createPassageSession(openingNode),
    choice: { type: "simple", text: "Continue", next: "next" },
    player,
  });

  assert.equal(outcome.kind, "advanced");
  assert.equal(outcome.session.node.id, "next");
  assert.equal(outcome.session.lastKnownImage, "start.png");
  assert.equal(outcome.session.canReturn, false);
});

test("event sessions surface unmet requirements without changing state", () => {
  const player = createDefaultPlayer();
  const session = createPassageSession(openingNode);
  const outcome = advanceEventSession({
    event,
    session,
    choice: {
      type: "simple",
      text: "Unlock",
      next: "next",
      requirements: [{ type: "item", item: "missing_key" }],
    },
    player,
  });

  assert.equal(outcome.kind, "blocked");
  assert.equal(outcome.player, player);
  assert.equal(outcome.session, session);
  assert.match(outcome.message ?? "", /Missing Key/);
});

test("event sessions retain visible outcomes before completing", () => {
  const player = createDefaultPlayer();
  const outcome = advanceEventSession({
    event,
    session: createPassageSession(openingNode),
    choice: {
      type: "simple",
      text: "Finish",
      endEvent: true,
      flavourText: "It is done.",
      effects: [{ type: "item", item: "winter_scrip", amount: 2 }],
    },
    player,
  });

  assert.equal(outcome.kind, "complete");
  assert.equal(outcome.session.isComplete, true);
  assert.equal(outcome.session.resolution?.flavourText, "It is done.");
  assert.equal(outcome.player.inventory.winter_scrip, 2);
});

test("event sessions finish immediately when there is no result to display", () => {
  const outcome = advanceEventSession({
    event,
    session: createPassageSession(openingNode),
    choice: { type: "simple", text: "Leave", returnToHub: true },
    player: createDefaultPlayer(),
  });

  assert.equal(outcome.kind, "finished");
});
