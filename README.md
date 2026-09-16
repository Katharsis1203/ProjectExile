# Project Exile

Project Exile is a browser-based narrative game prototype built with React,
TypeScript, Vite, and Tailwind CSS. The current slice includes a title/save
flow, a data-driven introduction, the Snowlands hub, weighted event leads,
inventory actions, and persistent player consequences.

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
  app/                    Application screen and transition orchestration
  data/                   Temporary/default player and avatar state
  engine/                 Pure game rules and reusable event-session workflow
  features/               UI and orchestration grouped by product feature
  infrastructure/         Content loading/validation and browser persistence
  shared/                 Cross-feature hooks and URL utilities
  styles/                 Application-wide styles and preferences
  types/                  Canonical domain models
tests/                    Rule and content-graph tests
public/data/              Author-authored hub and event documents
public/images/            Runtime artwork
art/source/unused/         Retained source/alternate artwork not shipped
```

Feature pages delegate deterministic behavior to `src/engine`. The content
repository is the only boundary that turns untrusted JSON into typed game
content, and persistence is isolated behind `src/infrastructure`. Components
consume validated models and do not fetch or cast content themselves.

Dependencies should point inward: features may use engine, data, types,
infrastructure, and shared utilities; engine code must remain independent of
React and browser presentation.

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
replacement. Conditions can inspect player resources and stats, status
effects, inventory, hub stats, and scene state.

Only assets required at runtime belong in `public/images`, because Vite copies
that directory directly into every production build. Alternate and source
artwork should live outside `public`; currently retained alternatives are kept
under `art/source/unused`.

## Current scope

This repository is still a vertical slice. Some navigation tiles are marked as
coming soon, player defaults remain local data, and hub event hands are not yet
restored across sessions. Save slots persist player state and major story
location. Those boundaries remain explicit so later systems can be added
without coupling them to the hub presentation.
