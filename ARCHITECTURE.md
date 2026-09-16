# Project Exile architecture

Project Exile uses a feature-oriented UI around a small, framework-independent
game engine.

## Boundaries

- `src/app` owns application-level screen selection and transitions.
- `src/features` owns UI, local interaction state, and feature orchestration.
- `src/engine` owns deterministic game rules and reusable session transitions.
- `src/infrastructure` owns browser and network boundaries such as storage,
  JSON fetching, caching, parsing, and content-graph validation.
- `src/data` contains temporary defaults and authored code-side catalogs.
- `src/types` contains shared domain contracts.
- `src/shared` contains behavior that is genuinely reused across features.

Features may depend on engine, infrastructure, data, types, and shared code.
Engine code must not import React, UI components, or infrastructure modules.
Infrastructure may depend on domain types but not feature components.

## Content flow

1. The content repository fetches an unknown JSON value.
2. Event or hub validation converts it to a typed domain model.
3. Graph validation verifies references between hubs, events, and nodes.
4. Features consume only validated models.

## Event flow

`eventSession` is the common transition boundary used by both introduction and
hub events. It checks requirements, resolves random/stat outcomes, applies
player effects, and returns an explicit session outcome. React features decide
how each outcome is presented or closed.

## Runtime assets

Files in `public` are shipped unchanged. Keep only runtime data and artwork
there. Source variants and unused alternatives belong under `art/source` so
they remain recoverable without increasing the production artifact.
