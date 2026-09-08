# Domain migration ledger (historical)

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

> Migration record only. Global action maps referenced below were removed in
> Wave 11; new work must use descriptor-local ownership.

Wave 9 migrated all bounded packages into the generated catalog. The Wave 10
hybrid builder makes descriptors the live owner while temporarily retaining shell
layout from legacy metadata. Renderer stabilization and physical compatibility
deletion remain before final retirement.

## Quick one-shot package

The completed migration ledger's first package moved eleven visible Quick actions
into six generated descriptors: arousal, enemy state, temple vow, hygiene,
in-game cheat access, and random encounters. Each descriptor owns its controls,
validation, mutations, state-derived labels, refresh policy, and legacy aliases.
Focused evidence is in `test/parity/quick-one-shot-production.test.js`.

## Quick daily-toggle package

Six daily toggles now use stable generated descriptors: maximum stray tasks, the
four Eden task controls, and Infinite NPC Pregnancy. The pregnancy descriptor
owns its overflow NPC records, processed date, and priority through declared
save-backed config paths. Package evidence covers legacy-key migration, immediate
restoration, distinct-day execution, same-day deduplication, and teardown in
`test/parity/quick-daily-toggle-production.test.js`.

## Quick frame-toggle package

Eleven frame toggles now declare stable IDs, cooldowns, failure limits, game paths,
save-backed config, and effects in generated descriptors. The package covers
unlimited cum, maintained virginity/purity, NPC lust, farm safety, intense-cum
cycles, angel protection, child interaction, pregnancy detection, and NPC
pregnancy-rate/multiplicity controls. Focused evidence in
`test/parity/quick-frame-toggle-production.test.js` verifies legacy-key
restoration, mutations, independent disable, persistence, and teardown; the
shared production toggle-runtime tests cover quarantine and remount restoration.

## Package 1: player stats and body

Status: descriptor implementation, automated parity, and live-owner cutover
complete; browser smoke and physical legacy retirement pending.

| Descriptor               | Legacy actions covered                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| `player.stats`           | `hesoyam`, `kill_player`, `statset`                                      |
| `player.money`           | `moneyset`                                                               |
| `player.unlimited-spray` | `sprayset`                                                               |
| `player.body-size`       | `bodyset`                                                                |
| `player.body-type`       | `bodytypeset`                                                            |
| `player.balls`           | `ballsset`                                                               |
| `player.virginity`       | `virginityset`, `virginpure`                                             |
| `player.crime`           | `sheesh`, `jk-lol`                                                       |
| `player.parasites`       | `infect`, `desinfect`                                                    |
| `player.characteristics` | `charaset`, `lactatingset`, `milkset`, `milkrefil`, `cumset`, `cumrefil` |

The package preserves action mutations, selection-driven hydration, validation,
visible labels and ordering, descriptor-local feedback, and missing-path handling.
Related rows remain grouped: characteristics and fluid actions share one module,
virginity selection and bulk purity share one module, and parasite infection and
removal share one module.

Automated evidence is in `test/parity/player-domain-production.test.js`. The
migration ownership gate also compares all generated descriptor IDs with all
declared migration candidates, failing for either a missing descriptor or an
orphan generated export.

### Retained legacy ownership

The corresponding source rows, action-object methods, action-map entries, and
fetcher-array entries remain as compatibility inventory, but the builder filters
their controls and generated aliases replace their handlers. They are explicit
physical-removal candidates for Wave 11 after browser parity.

## Stats editor package

Six generated descriptors now own enemy stats, fame, exams, school reputation,
talents, and hentai skills. Each editor owns its options, selected-value
hydration, numeric validation, mutation, refresh cadence, and legacy aliases.
Runtime ticks follow live SugarCube changes, while a focused input is protected
from refresh until the user leaves it. Stats now mounts descriptor-only in the
normal builder path, and its old section hydrators are no longer invoked.
Evidence is in `test/parity/stats-editor-production.test.js`.

## Misc visible-control package

The existing `world.max-harmony` descriptor now owns both independent Wolfpack
actions and their legacy aliases. Keeping the controls together preserves their
original shared row without sacrificing action-level ownership or parity evidence.
Hybrid-placement coverage verifies that the NPC header and editor remain before
Wolfpack, while the Pregnancy Manager header and descriptors remain after it.
Evidence is in `test/parity/misc-visible-production.test.js`.

## Next package

No legacy-owned cheat remains visible in the original Quick, Stats, or Misc
registries. The retained hidden world tools and read-only diagnostics are now
descriptor-owned, while Package 7D removed the unsafe `ArrayChecker`,
`checkArray`, and `stringJSSet` runtime paths. Automated ownership is complete;
browser smoke remains the final migration acceptance step.

## MC pregnancy and offspring package

All eight previously hidden actions were restored through six descriptors:

- `world.mc-pregnancy` derives pregnancy locations and parasite/baby targets from
  `sexStats`, edits days, and owns its lock scheduler.
- `world.mc-tentacle` derives container locations and creature records, then edits
  the selected creature's speed.
- `world.mc-child-manager` derives `children`, edits names and parent-known flags,
  and requires explicit confirmation for selected or bulk abandonment.
- MC and named-NPC removal descriptors derive fetus lists and reset complete
  pregnancy state when the final fetus is removed.
- `world.stored-npc-abortion` tags base-game and CheatPlus overflow sources
  explicitly, replacing the legacy key-name regex, and owns confirmed removal and
  purge behavior for both stores.

Representative executable shapes cover regular and parasite-capable `sexStats`
pregnancy objects, `container.*.creatures`, `children`, `NPCName.*.pregnancy`,
base-game `storedNPCs`, and CheatPlus `storedNPCs`. The previously registered
`npc_abortion_purge` alias had no corresponding implementation; its restored
behavior intentionally clears both stored-NPC sources. Evidence is in
`test/parity/pregnancy-offspring-production.test.js`.

## Farm and conditional mod tools

Five generated descriptors restore the three farm editors, produce-sales
inspection, and Vrel integration. Animal choices come from live `farm.beasts`;
build and assault timers have independent applicability; all editor inputs hydrate
without overwriting focused text. The produce report discovers every finite entry
in `farmersProduce.selling`, uses deterministic descending totals, and performs no
mutation, covering both minimal/original and extended/modded fixtures. Vrel reset
is available only when `featsBoosts.pointsUsed` is finite and never creates missing
mod data. Evidence is in `test/parity/farm-mod-tools-production.test.js`.

## Developer diagnostics

The legacy `testAll` action is now an alias of the session-gated
`developer.run-diagnostics` descriptor. A dedicated read-only runner executes six
bounded production probes with applicability, exception, invalid-result, and
timeout isolation. Reports contain controlled counts/statuses only, and the UI
uses modern clipboard access with a selectable fallback. The public callback
context exposes only `services.diagnostics`, never the dispatcher or catalog.
Contract and lifecycle details are in `docs/CHEAT_FACTORY_DIAGNOSTICS.md` with
evidence in `test/unit/diagnostic-runner.test.js` and
`test/integration/diagnostics-production.test.js`.

## Wave 7 completion package: NPC pregnancy managers

`world.named-npc-pregnancy` and `world.stored-npc-pregnancy` now own dynamic
pregnancy lists, selected-day hydration, timer mutation, checkbox state, and
descriptor-scoped lock jobs. Their old section hydrators are no longer invoked.

The migration fixes a partially working legacy behavior: removing one named NPC
lock previously unregistered the shared scheduler job even when other NPCs
remained locked. The descriptor retains its lock job until the final lock is
removed. Evidence is in `test/parity/pregnancy-manager-production.test.js`.
