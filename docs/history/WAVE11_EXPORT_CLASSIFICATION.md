# Wave 11 export classification (historical audit)

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

> This records the pre-deletion ownership audit used to execute Wave 11. Entries
> classified for deletion are now retired; consult `src/ARCHITECTURE.md` for the
> active production graph.

Status date: 2026-09-07

This is the Package 11-0 deletion inventory. It classifies the public exports in
`src/features/cheat`, `src/features/fetchers`, and `src/features/utils`. Returned
legacy action methods are additionally covered by
`test/baseline/cheat-migration-ownership.js`, which maps supported mutations to
stable descriptor IDs and parity evidence.

Classification meanings:

- **delete**: obsolete/superseded implementation;
- **replace**: callers must move to the listed descriptor/runtime owner first;
- **relocate**: supported non-cheat behavior needs an application owner;
- **retain temporarily**: live behavior intentionally remains through Wave 11.

## `features/cheat` exports

| Module | Export(s) | Decision | Replacement or destination |
| --- | --- | --- | --- |
| `debug-actions.js` | default `debugActions` | replace, then delete | `developer.run-diagnostics`; covered by `test/integration/diagnostics-production.test.js` |
| `player-actions.js` | default `playerActions` | delete | Aggregate only; individual behavior owners are listed below. |
| `player-body-actions.js` | `createPlayerBodyActions`, default | replace, then delete | `player.body-type`, `player.unlimited-spray`, `player.balls`, `player.virginity`, `player.characteristics`, `player.lactation`, `player.cum`, `player.milk`, `player.parasites` |
| `player-progression-actions.js` | `createPlayerProgressionActions`, default | replace, then delete | `world.npc-trait-editor`, `player.fame`, `player.exam`, `player.talent`, `player.hentai-skill` |
| `player-stats-actions.js` | `createPlayerStatsActions`, default | replace, then delete | `quick.arousal`, `player.crime`, `quick.temple-vow`, `quick.player-state`, `quick.enemy-state`, `player.stats`, `player.enemy-stats` |
| `pregnancy-actions.js` | default `pregnancyActions` | delete | Aggregate only; descriptor owners are listed below. |
| `pregnancy-abortion-actions.js` | `createPregnancyAbortionActions`, default | replace, then delete | `world.mc-abortion`, `world.named-npc-abortion`, `world.stored-npc-abortion` |
| `pregnancy-manager-actions.js` | `createPregnancyManagerActions`, default | replace, then delete | `world.named-npc-pregnancy`, `world.stored-npc-pregnancy`, `world.mc-pregnancy`, `world.mc-tentacle`, `world.mc-child-manager` |
| `pregnancy-lock-state.js` | `named_npc_pregnancy_locked`, `named_npc_pregnancy_locked_day`, `npc_pregnancy_locked`, `npc_pregnancy_locked_day`, `mc_pregnancy_locked`, `mc_pregnancy_locked_hole`, `mc_pregnancy_locked_type`, `mc_pregnancy_locked_day` | delete | Descriptor-local lock maps and production scheduler are canonical; do not relocate parallel arrays. |
| `pregnancy-shared.js` | `updateToggleBundle`, `abortion_notice`, `setPregnancyTimer`, `applyNpcPregnancySet` | replace, then delete | Descriptor-local actions plus production feedback/scheduler services |
| `toggle-domain-actions.js` | `createToggleDomainActions`, default | replace, then delete | Catalog toggle descriptors and production toggle runtime |
| `toggle-domain-basic-actions.js` | `createToggleDomainBasicActions`, default | replace, then delete | `quick.everyone-horny`, `quick.eden-spring`, `quick.eden-garden`, `quick.eden-timer`, `quick.eden-mushrooms`, `world.maximum-church-tasks`, `quick.maximum-stray-tasks`, `quick.maintain-purity`, `quick.maintain-virginity`, `quick.farm-safety`, `quick.auto-child-interaction` |
| `toggle-domain-pregnancy-actions.js` | `createToggleDomainPregnancyActions`, default | replace, then delete | `quick.pregnancy-detection`, pregnancy manager descriptors, `quick.infinite-npc-pregnancy`, `quick.maximum-npc-pregnancy-rate`, `quick.multiple-npc-pregnancies` |
| `toggle-domain-status-actions.js` | `createToggleDomainStatusActions`, default | replace, then delete | `quick.invincible-angel`, `quick.unlimited-cum`, `quick.intense-cum`, `player.infinite-arousal`; divine-state bookkeeping must be checked separately before deletion. |
| `toggle-runtime.js` | default `toggleRuntime` | replace, then delete | `createProductionCheatToggleRuntime()` and stable descriptor scheduler IDs |
| `world-actions.js` | `VrelCoinsUsage`, `set_animal_like`, `set_build_time`, `set_assault_time`, `clean_cum`, `dirty_cum`, `clean_cum_uretus`, `check_fruit_selling`, `set_school_rep`, `in_game_cheat`, `alt_cheat`, `randomEncounterSet`, `purgeNPCBaby` | replace, then delete | Respectively owned by `world.vrel-coins-usage`, farm descriptors, `quick.hygiene`, `world.produce-sales-report`, `player.school-reputation`, `quick.game-cheats`, `quick.random-encounters`, and `world.mc-child-manager`. |
| `world-actions.js` | former `sidebar_cheat`, `cheat_backwards`, `cheat_forwards`, `update_history` | relocated | `app/commands/shell-commands.js` owns forwarding; `ui/shell/floating-controls.js#syncHistoryButtons` owns state synchronization. Behavior is frozen by `test/integration/legacy-shell-command-classification.test.js`. |
| `world-actions.js` | default `worldActions` | delete | Aggregate disappears after replacements and relocations. |

The complete legacy action-to-descriptor mapping and its parity test path remain
authoritative in `test/baseline/cheat-migration-ownership.js`. One item requires
special care: `updateUserDivine` is returned by the old status-action factory but
is not represented in the old listener method/toggle maps. Package 11B must prove
whether another production path owns that bookkeeping before deleting the module.

## `features/fetchers` exports

These are DOM hydrators, not network fetchers. The useful behavior is replaced by
descriptor options/synchronization on panel or section open, dependency-control
change, successful action, or explicit refresh. Replacement must not introduce
continuous input overwrites.

| Module | Export(s) | Decision | Replacement owner |
| --- | --- | --- | --- |
| `core-updates.js` | `setButtonText` | delete | Private legacy helper |
| `core-updates.js` | `statpick`, `statpicke`, `spraystate`, `bodycurrent`, `bodytypecurrent`, `ballscurrent`, `virginitycurrent`, `crimecurrent`, `vowcurrent`, `characurrent`, `lactatingcurrent`, `milkcurrent`, `cumcurrent`, `famecurrent`, `npccurrent`, `examcurrent`, `talentcurrent`, `arousalpicked`, `update_school_rep` | replace, then delete | Matching player/quick/world descriptor `sync()` and dependency-change actions |
| `core-updates.js` | `update_pregnancy` | replace, then delete | `quick.pregnancy-detection` behavior/feedback; confirm no shell counter remains supported |
| `core-updates.js` | default `coreUpdates` | delete | Aggregate facade |
| `misc-updates.js` | `update_cheat_state`, `randomEncounterUpdate`, `update_farm_assault_day`, `update_farm_buildtime`, `update_farm_animals_like` | replace, then delete | `quick.game-cheats`, `quick.random-encounters`, and farm descriptors |
| `misc-updates.js` | default `miscUpdates` | delete | Aggregate facade |
| `offspring-updates.js` | `update_mc_tentacle`, `update_mc_tentacle_input`, `update_mc_baby_info`, `update_mc_baby_list`, `update_mc_abortion_list`, `update_named_npc_abortion_list`, `update_npc_abortion_list`, `update_npc_fetus_abortion_list` | replace, then delete | MC tentacle/child/removal and named/stored NPC removal descriptor options/sync |
| `offspring-updates.js` | default `offspringUpdates` | delete | Aggregate facade |
| `pregnancy-updates.js` | `update_pregnancy_list_named_npc`, `update_pregnancy_day_named_npc`, `update_pregnancy_list_npc`, `update_pregnancy_day_npc`, `update_pregnancy_list_mc`, `update_pregnancy_day_mc` | replace, then delete | Named/stored/MC pregnancy descriptor options, dependency actions, and sync |
| `pregnancy-updates.js` | default `pregnancyUpdates` | delete | Aggregate facade |
| `index.js` | `update_toggle` | replace, then delete | Descriptor toggle controls restore their state through the production toggle runtime. |
| `index.js` | `update_pregnancy_mc`, `hydrateQuickSection`, `hydrateStatsSection`, `hydrateMiscSection` | replace, then delete | Direct `getActiveCheatBuilder()?.sectionOpened(section)` application navigation; MC dependency behavior is descriptor-local. |
| `index.js` | `fetcherActions`, `hydrateCheatUi`, `hydratePregnancy` | delete | Legacy aggregate facades |

## `features/utils` exports

| Module | Export(s) | Decision | Wave 11 owner |
| --- | --- | --- | --- |
| `value-tree.js` | `walkValueTree` | retain temporarily | `features/search-actions.js`; later relocation belongs to the architecture reorganization. |

## Production versus test reachability

Production reaches the legacy graph through:

```text
core/injection.js
  -> features/bootstrap.js
  -> features/registry.js
  -> features/listeners/index.js
  -> features/actions.js + features/fetchers/index.js + listener action maps
```

Direct test-only imports of old implementations currently occur in:

- `test/characterization/legacy-cheat-actions.test.js`;
- `test/parity/legacy-descriptor-parity.test.js`.

Baseline inventory files also name legacy paths as data. These tests/data must be
rewritten or archived when implementations disappear; they are not production
owners.

## Relocation behavior evidence

`test/integration/section-shell-renderer.test.js` proves that the history/sidebar
buttons render. `test/integration/legacy-shell-command-classification.test.js`
freezes sidebar forwarding, backward/forward forwarding, disabled-state
synchronization, and missing-history feedback before the commands are relocated.

## Frozen pre-deletion baseline

Command: `npm run verify:cheat-factory`

- Catalog: 61 descriptors
- Tests: 181
- Passing: 179
- Failing: 0
- Skipped: 0
- TODO: 2 (`save_data` and `load_data` server-save regressions)

The verification gate passed on 2026-09-07.

After adding the relocation behavior test, the complete gate passed again with
182 tests, 180 passing, zero failures/skips, and the same two TODOs.

After Package 11A cut production registration over to application commands, the
gate passed with 183 tests, 181 passing, zero failures/skips, and the same two
TODOs.
