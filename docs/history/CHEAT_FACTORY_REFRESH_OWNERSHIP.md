# Cheat factory refresh ownership (historical)

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

> This is a pre-Wave-11 migration snapshot. The listed fetcher modules and
> compatibility exports have been deleted. Active refresh behavior is owned by
> descriptor `sync()` callbacks and builder/renderer lifecycle reasons; see
> `src/ARCHITECTURE.md`.

Wave 7 moves refresh decisions into mounted descriptors. A descriptor declares the
triggers it accepts and owns its bindings, option sources, and exceptional `sync()`
logic.

## Supported authoring surface

- `binding.path` hydrates a scalar control through the game adapter.
- `binding.writeOn` explicitly opts a control into `input` or `change` writes.
- Active input edits are preserved unless `binding.syncWhileEditing` is true.
- A select may provide `options(context)` and stable `fallbackOptions`.
- `mount`, `section-open`, `after-action`, and `runtime-tick` run only when declared.
- `mounted.sync('manual')` remains available for tests and compatibility.
- Concurrent refresh requests for one mounted descriptor coalesce.
- Hidden descriptors skip automatic section and runtime refreshes.
- Sync diagnostics contain cheat ID, trigger, and error type, never game-state values.

The production `world.npc-trait-editor` descriptor is the dynamic-select and NPC
lookup vertical slice. Body Size remains the computed-label slice. The production
`world.named-npc-pregnancy` and `world.stored-npc-pregnancy` descriptors own their
option sources, selected-day hydration, mutations, and lock scheduling.

## Retained legacy fetchers

Every entry below remains in `features/fetchers/index.js` for an explicit reason.
Player-domain and NPC lookup hydrators were removed from section arrays after the
builder made their descriptors active.

| Legacy hydrators                                                                                                                                                       | Retention reason                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `arousalpicked`, `vowcurrent`, `update_cheat_state`, `randomEncounterUpdate`, `update_pregnancy`                                                                       | Their Quick descriptors are not migrated yet.                                                |
| `update_toggle`                                                                                                                                                        | Unmigrated legacy toggles still require global active-state rendering.                       |
| `statpicke`, `famecurrent`, `examcurrent`, `update_school_rep`, `talentcurrent`                                                                                        | Enemy, fame, school, exam, and talent descriptors are scheduled for the next domain package. |
| `update_pregnancy_list_mc`, `update_pregnancy_day_mc`                                                                                                                  | The complex MC pregnancy/fetus manager remains scheduled for its domain package.             |
| `update_mc_tentacle`, `update_mc_baby_list`, `update_mc_abortion_list`, `update_named_npc_abortion_list`, `update_npc_abortion_list`, `update_npc_fetus_abortion_list` | Dynamic offspring/abortion controls require their domain descriptors and parity fixtures.    |
| Legacy farm and array-checker hydrators                                                                                                                                | Farm tools are descriptor-owned; unsafe array diagnostics are retired.                        |

The exported compatibility objects (`fetcherActions`, `hydrateCheatUi`,
`hydratePregnancy`, `firstload`, and `alt_fetch`) remain because the current
listener/bootstrap path still consumes them.

## Refresh recipe

```js
export const example = createCheat({
  id: 'example.bound-value',
  location: { section: 'stats', order: 10 },
  meta: {
    label: 'Bound value',
    controls: [
      { key: 'value', type: 'input', binding: { path: 'value' } },
      {
        key: 'target',
        type: 'select',
        options: ({ game }) => game.get('targets'),
        fallbackOptions: [],
      },
    ],
  },
  refresh: ['mount', 'section-open'],
  sync() {},
});
```

Actions request hydration by returning `{ ok: true, refresh: true }`. They receive
the triggering event and descriptor-local controls directly; querying global IDs
is neither required nor supported by this recipe.
