import type { Event } from "../types/event";
import type { Hub, LoadedHub } from "../types/hub";

export async function loadHub(hubId: string): Promise<LoadedHub> {
    const hubResponse = await fetch(`/data/hubs/${hubId}.json`);

    if (!hubResponse.ok) {
        throw new Error(`Could not load hub: ${hubId}`);
    }

    const hub = (await hubResponse.json()) as Hub;

    const eventFileNames = new Set<string>();

    Object.values(hub.eventPools).forEach((pool) => {
        pool.forEach((entry) => {
            eventFileNames.add(entry.opens.eventFile);
        });
    });

    const events: Record<string, Event> = {};

    await Promise.all(
        [...eventFileNames].map(async (eventFileName) => {
            const eventPath = `/data/events/${eventFileName}.json`;
            const response = await fetch(eventPath);

            if (!response.ok) {
                throw new Error(`Could not load event: ${eventPath}`);
            }

            const text = await response.text();

            try {
                events[eventFileName] = JSON.parse(text) as Event;
            } catch {
                console.error("Bad event response from:", eventPath);
                console.error(text.slice(0, 200));

                throw new Error(
                    `Invalid JSON at ${eventPath}. File may be missing or returning HTML.`
                );
            }
        })
    );

    return {
        hub,
        events,
    };
}