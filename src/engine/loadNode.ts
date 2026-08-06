// src/engine/loadNode.ts

import type { NodeData } from "../types/node";

const nodeCache: Record<string, Record<string, NodeData>> = {};

function normaliseNodeFile(file: string) {
  if (file.startsWith("/")) return file;
  if (file.endsWith(".json")) return `/data/events/${file}`;
  return `/data/events/${file}.json`;
}

function normaliseNodes(data: unknown): Record<string, NodeData> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const eventData = data as {
    nodes?: Record<string, NodeData> | NodeData[];
  };

  if (Array.isArray(eventData.nodes)) {
    return Object.fromEntries(
      eventData.nodes.map((node) => [node.id, node])
    );
  }

  if (eventData.nodes && typeof eventData.nodes === "object") {
    return eventData.nodes;
  }

  return data as Record<string, NodeData>;
}

export async function loadNode(file: string, nodeId = "start") {
  const path = normaliseNodeFile(file);

  if (!nodeCache[path]) {
    const res = await fetch(path);

    if (!res.ok) {
      throw new Error(`Failed to load node file: ${path}`);
    }

    const data = await res.json();
    nodeCache[path] = normaliseNodes(data);
  }

  return nodeCache[path][nodeId] ?? null;
}