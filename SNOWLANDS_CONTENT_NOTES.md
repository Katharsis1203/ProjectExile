# Snowlands content pack

This pack adds 20 authored Snowlands events and a small typed eligibility system for hub event conditions.

## Explore events

1. **Whiteout Cairn** — composite Perception + Survival navigation, fallback Endurance check.
2. **Bell Beneath Ice** — Perception discovery, Strength + Endurance recovery, cold-water failure branch.
3. **Black Pine Hollow** — composite Perception + Survival investigation with a trapped dead-drop branch.
4. **Wrecked Sled** — Strength + Endurance rescue, alternative Perception + Strength leverage solution.
5. **Crows Over the Ravine** — Survival route-finding and Strength + Endurance descent.
6. **Ash in the Snow** — composite tracking/investigation and a hidden watcher.
7. **Frostglass Cave** — composite hazard reading and cache extraction.
8. **Hunter's Snare** — single Survival handling plus a Strength + Endurance recovery branch.
9. **Singing Ice** — composite Perception + Survival route selection, Endurance/Strength failure recovery.
10. **Smoke Beyond the Ridge** — Survival smoke reading and multi-check rescue sequence.
11. **Lost Patrol** — condition-gated by low hub visibility + snow; several rescue/investigation check paths.
12. **Rime Script** — condition-gated by Mana >= 40 + Focused; arcane mystery/investigation.

## Life events

13. **The Last Bowl** — social choice event with a Perception read of the room.
14. **Tallow and Salt** — composite Survival + Perception work event with a local rumour branch.
15. **The Missing Ledger** — Perception investigation and inn mystery.
16. **Roof Under Snow** — Strength + Endurance work, with alternate structural bracing path.
17. **Night Watch** — composite Perception + Endurance duty event and signal investigation.
18. **Borrowed Gloves** — character event with Perception and Survival checks around frostbite.
19. **The Thawing Room** — condition-gated by the Chilled status effect; recovery-oriented checks/choices.
20. **Hunger's Bargain** — condition-gated by Hunger >= 30; practical work with Strength/Endurance/Perception routes.

## Condition semantics added

All conditions on an event-pool entry are treated as AND conditions. Supported condition types:

- `playerResource` — numeric comparison against a resource value.
- `playerStat` — numeric comparison against a player stat.
- `statusEffect` — require/predicate an active status effect by id or name.
- `hubStat` — numeric comparison against a hub stat's `percent` value.
- `scene` — compare `lighting`, `weather`, or `weatherIntensity`.

Numeric operators: `lt`, `lte`, `eq`, `gte`, `gt`.

These conditions are evaluated when Explore/Life draws its three leads. This is current-state gating only; persistent flags/relationships/consequences are not added by this pack.

## Artwork

The Explore events reuse existing Snowlands artwork as temporary card/passage art where the subject is close enough. Life events use `../village.png` as a generic hub-life card image so they remain visually functional without pretending bespoke character art already exists. These can be replaced event-by-event later.
