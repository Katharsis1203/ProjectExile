# Project Exile

Project Exile is a browser-based narrative game prototype built with React,
TypeScript, Vite, and Tailwind CSS. The current slice presents the Snowlands
hub, draws weighted event leads, and lets the player move through data-driven
event nodes and stat checks.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Local development

```bash
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Quality checks

```bash
npm run lint              # Type-aware ESLint checks
npm run typecheck         # Strict TypeScript checks
npm test                  # Game-rule and content-contract tests
npm run validate:content  # Validate bundled hubs, events, links, and images
npm run build             # Type-check and create the production bundle
npm run check             # Run the complete verification suite
```

## Project structure

```text
src/
  components/             Presentational UI grouped by game area
  data/                   Temporary/default player and avatar state
  engine/                 Pure selection, dice, and scene rules
  pages/                  Page-level state and interaction orchestration
  services/content/       Fetching, caching, and runtime content validation
  types/                  Canonical domain models
tests/                    Rule and content-graph tests
public/data/              Author-authored hub and event documents
public/images/            Runtime artwork
```

`HubPage` owns the current screen session. It delegates deterministic game
rules to `src/engine`, while the content repository is the only boundary that
turns untrusted JSON into typed game content. Components consume validated
models and do not fetch or cast content themselves.

## Content authoring

Hub documents live in `public/data/hubs`; event documents live in
`public/data/events`. An event uses a node record keyed by node ID. Every
`next`, threshold-bucket target, and hub opening node must resolve within its
event.

Event cards may define both fields below:

```json
{
  "cardImage": "blood_in_snow.png",
  "cardColourImage": "blood_in_snow_colour.png"
}
```

`cardColourImage` is optional. When it is omitted, the card reveal reuses the
base image instead of requesting a guessed filename.

Run `npm run validate:content` after changing JSON or referenced artwork. The
validator checks supported schema versions, required fields, unique IDs,
event/node links, and referenced runtime images.

Pool entries support relative `weight` values. Selection is weighted without
replacement. `conditions` are reserved for the future game-state evaluator;
until that evaluator exists, current entries should keep an empty condition
array.

## Current scope

This repository is still a vertical slice. The navigation tiles are marked as
coming soon, player state is temporary local data, and event consequences are
not yet persisted. Those boundaries are kept explicit so later systems can be
added without coupling them to the hub presentation.
