import type { Event } from "../types/event";

export async function loadEvent(eventName: string): Promise<Event> {
    const filePath = `/data/events/snowlands/${eventName}.json`;
    const response = await fetch(filePath);

    if(!response.ok){
        throw new Error(`Failed to load event: ${filePath}`);
    }

    const event = (await response.json()) as Event;

    return event;
}