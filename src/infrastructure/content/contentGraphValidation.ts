import type { EventChoice } from "../../types/event";
import type { LoadedHub } from "../../types/hub";
import { fail } from "./validationPrimitives.ts";

function getChoiceTargets(choice: EventChoice): string[] {
  const targets = choice.next ? [choice.next] : [];
  if (choice.type === "checked") {
    targets.push(...(choice.weighted?.buckets.map((bucket) => bucket.next) ?? []));
  }
  return targets;
}

export function assertLoadedHubContent({ hub, events }: LoadedHub): void {
  Object.values(hub.eventPools).flat().forEach((entry) => {
    const event = events[entry.opens.eventFile];
    if (!event) fail(hub.id, `event file "${entry.opens.eventFile}" was not loaded.`);
    if (!event.nodes[entry.opens.nodeId]) {
      fail(hub.id, `event "${event.id}" has no opening node "${entry.opens.nodeId}".`);
    }
  });
  Object.values(events).forEach((event) => {
    Object.values(event.nodes).forEach((node) => {
      node.choices.flatMap(getChoiceTargets).forEach((target) => {
        if (!event.nodes[target]) {
          fail(event.id, `node "${node.id}" targets missing node "${target}".`);
        }
      });
    });
  });
}
