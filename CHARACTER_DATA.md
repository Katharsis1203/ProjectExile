# Character data and authoring

The hub's **Character** button opens the character sheet. It reads the same player
record used by event checks and saves; it is not a separate preview or mock.

## Files and ownership

- `src/data/characterCatalog.json`: stat descriptions, feats, status definitions,
  quests, typed flags, factions, people, discoveries and equipment definitions.
- `src/data/characterCatalog.ts`: typed access to that catalogue.
- `src/data/defaultPlayer.ts`: new-game base stats, resources and stackable inventory.
- `src/engine/character.ts`: new-character defaults, effective-stat calculation,
  feat acquisition, training, equipment, status timing and character effects.
- `src/data/itemCatalog.ts`: existing stackable item definitions and use effects.
- `src/types/character.ts` and `src/types/player.ts`: the saved character contract.
- `src/engine/eventSession.ts`: checks and effects resolved together.
- `src/infrastructure/content/characterValidation.ts`: authored IDs and values
  checked before events are used.
- `src/infrastructure/persistence/playerMigration.ts`: old-save migration and
  validation of persisted characters.

Stat categories and their display order live in `statCategories` in the JSON
catalogue. Each stat assigns a `category`; the Character overview and training
sections use the same grouping. Empty categories are hidden.

Definitions are shared, while acquired ranks, possessions, decisions and current
values are saved per character. New games receive independent IDs and records.
The four existing stat IDs are retained for content/save compatibility. Survival
is labelled as a skill; its legacy base value remains in `player.stats`. New
skills are stored in `player.character.skills`.

## Stats, progression and feats

All story checks, displayed odds and stat-based event eligibility use
`getEffectiveStats(player)`. Base values are never changed by equipping an item or
applying a condition. `getStatBreakdown` supplies the UI with each modifier source.

Current provisional progression: 100 XP per level, one advancement point per
level, one initial point. A point can purchase a feat or increase a base stat/skill
by one (training cap 20). Feats have base-stat prerequisites, rank limits and costs.
They can also unlock choices via conditions. These balance values can be changed
in the rules; this is an initial progression model, not a final balance pass.

Only equipped, non-broken equipment grants modifiers. Slots reference owned item
instances, which include a definition ID and durability. Stackable possessions
remain in `player.inventory`. Both are visible in Character; Inventory links back
to equipment management. Durability is stored, but ordinary actions do not yet
wear items down.

## Conditions and time

Timed statuses count down once per successful story action, after that action's
check. Menus, equipment changes and viewing the sheet do not advance time.
Reapplying a status refreshes/replaces it, rather than stacking copies.

- Chilled: Survival -1, six actions.
- Focused: Perception +1, four actions.
- Minor Wound: Strength -1 until treated; a bandage heals Health and removes it.

These replace the earlier descriptive-only recovery percentages and wall-clock
labels. No passive resource regeneration or wall-clock simulation is implied.

## Quests, facts and requirements

Quest state contains a stage, objective booleans and named decisions. Decision
values are mutually exclusive: `ledger_destination` is `returned` or `kept`.

```json
{"type":"quest","quest":"missing_ledger","stage":"recovered","objective":"ledger_recovered"}
```

```json
{"type":"quest","quest":"missing_ledger","decision":"ledger_destination","value":"returned"}
```

Flags have declared types and, where appropriate, an allowed list of values:

```json
{"type":"flag","flag":"story.mara_trust","value":"trusted"}
```

Hub pools accept `feat`, `flag`, `questStage` and `questDecision` conditions in
addition to their existing conditions. Choices use the same character conditions
inside a requirement:

```json
{"type":"condition","condition":{"type":"feat","feat":"keen_observer","rank":1}}
```

Inventory requirements still use `{"type":"item","item":"rope"}`. A requirement
checks possession; consume an item explicitly with an item effect if appropriate.

Additional effects include `experience`, `feat`, `status`, `reputation`,
`relationship`, `discovery`, and `equipmentItem`. See `src/types/character.ts` for
fields. Unknown catalogue IDs and invalid quest/flag values fail validation.

Facts currently represent this character's knowledge and choices. A shared world
simulation (settlement-wide changes, calendars, NPC schedules) is not yet present;
keep that separate when added rather than treating character flags as global state.

## Example: The Missing Ledger

Find it through the hub's **Life** action. The rope option combines an inventory
requirement, Perception check and Stamina cost. Keen Observer unlocks a reliable
alternative. Recovery grants an actual quest item, which returning the ledger
consumes. Reading it adds knowledge and a discovery. Returning or keeping it is
recorded alongside Mara's trust and the north-room decision.

Resolving the quest awards XP and changes reputation/relationship. Discreetly
returning it grants scrip and a scouting charm. **A Debt Remembered** later appears
with a different opening according to Mara's trust. Completed chains are excluded
from subsequent draws.

A choice's `rewardId` protects its entire effects bundle from being applied more
than once to that character. Use a shared ID for alternative branches of the same
one-time reward. Do not reuse it for an unrelated reward.

## Saves

Save envelopes are version 2. Existing version-1 slots remain under their original
storage keys and migrate on read; their base stats, resources and inventory are
preserved. New character fields receive defaults, and recognised legacy statuses
are converted to the action-based definitions. New writes use version 2. Unknown
future versions or malformed character records are rejected without deleting them.

Hub saves now preserve held cards and the active passage, including resolved rolls,
consequences, image and completion state. Intro saves also preserve the full current
passage. Reloading restores the already-resolved result instead of rolling again.
A completed session cannot award its final effects again. If authored nodes are
removed, restoration falls back to the available hub rather than rerunning effects.

Run `npm run check` after changing definitions, rules or authored content.

### Dedicated equipment page

Open **Character → Equipment** or **Inventory → Manage equipment** in the hub. Select a slot, then an owned item to preview effective stat changes before equipping. Equipped items can be unequipped; swaps preserve both item instances. Empty slots remain visible. The page reads and updates the same saved player record used by character stats and event checks.

`characterCatalog.json` defines `equipmentSlots` (head, body, hands, feet, main_hand, off_hand, trinket, trinket_2). Existing `body` and `trinket` save keys are preserved. Items with `slot: "trinket"` fit either accessory slot; an instance can occupy only one slot. Item definitions can optionally declare `requirements: { "strength": 7 }` (base stats) and `twoHanded: true` for main-hand items. Equipping a two-handed item removes the off-hand item; equipping an off-hand item removes an equipped two-handed item. The preview identifies displaced items before applying the change. Broken items cannot be equipped or supply modifiers, but may be unequipped.

The initial belongings remain the traveller's coat; the scouting charm is a quest reward. Other slots are ready for authored equipment. No repair, durability loss, upgrades, or drag-and-drop are implemented yet.
