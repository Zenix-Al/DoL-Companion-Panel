# Wave 11 legacy retirement handoff

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

Status date: 2026-09-07

Wave 11 status: **complete** on 2026-09-08.

This document is the durable handoff for completing Wave 11 before a separate
project-structure cleanup. Do not mix directory reshaping or broad renames into
this retirement pass.

## Completed

- All 61 production cheat descriptors are catalog-owned and render through the
  descriptor runtime.
- The `legacy` property was removed from every `createCheat()` object and from
  contract validation, runtime types, catalog validation, builder composition,
  toggle restoration, and test helpers.
- Stable descriptor IDs are the only supported cheat action, control, scheduler,
  and persistence identity.
- Descriptor action aliases and old persisted toggle-key migration were removed.
- Dead hybrid registry/filter/slot helpers were removed from the catalog builder.
- The unused `features/listeners/runtime-observer-policy.js` compatibility
  re-export was deleted; `core/runtime-observer-policy.js` is canonical.
- The generated catalog contains 61 cheats. The last complete factory gate after
  descriptor retirement reported 181 tests, 179 passing, zero failed/skipped,
  and two tracked server-save TODOs.
- Distribution version `2.0.44` contains the descriptor-property retirement.

## Current legacy dependency root

`core/injection.js -> features/bootstrap.js -> features/registry.js ->
features/listeners/index.js`

The listener index still imports:

- `features/actions.js` (`cheatActions`/`mycode` aggregate);
- `features/fetchers/index.js` (`hydrateCheatUi`, `hydratePregnancy`, and section
  wrappers);
- `features/listeners/action-maps.js`, which imports `METHOD_ACTIONS`,
  `TOGGLE_DEFINITIONS`, and cheat-specific `BOUND_ACTIONS`;
- old toggle-domain and mutation modules reachable through the aggregate facade.

These modules are reachable today because the old listener framework imports
them. Reachability is not evidence that they should survive Wave 11.

## Verified disentangling inventory

Do not delete `src/features/cheat`, `src/features/fetchers`, or
`src/features/utils` as undifferentiated folders. The current production import
graph mixes four different ownership classes:

| Current code | Classification | Wave 11 treatment |
| --- | --- | --- |
| `features/cheat/player-*.js` | Legacy cheat implementations | Delete after every supported behavior is descriptor-owned and listener action maps no longer reference old methods. |
| `features/cheat/pregnancy-*.js` | Legacy cheat implementations, lock state, and hydration coupling | Delete after pregnancy descriptors and the production scheduler own all manager, removal, lock, and overflow behavior. Do not preserve the old parallel lock arrays. |
| `features/cheat/toggle-*.js` | Legacy toggle runtime/domain actions | Delete after observers drive `createProductionCheatToggleRuntime()` directly and stable descriptor toggles restore without old IDs. |
| `features/cheat/debug-actions.js` | Superseded legacy developer action | Delete after confirming the catalog-owned Developer Tools descriptor covers the supported diagnostic workflow. |
| Cheat-like exports in `features/cheat/world-actions.js` | Legacy implementations already represented by descriptors | Delete with the other global cheat actions. This includes farm, hygiene, school, game-cheat, random-encounter, child-purge, and similar mutations. |
| `sidebar_cheat`, `cheat_backwards`, `cheat_forwards`, and `update_history` in `world-actions.js` | Live application-shell commands trapped in a cheat module | Relocate to an application command owner before deleting `world-actions.js`. Preserve behavior and IDs only where the rendered shell still uses them. |
| `features/fetchers/core-updates.js`, `misc-updates.js`, `offspring-updates.js`, and `pregnancy-updates.js` | Legacy DOM hydrators for old controls | Delete after `BOUND_ACTIONS`, old action implementations, and aggregate hydrator imports are gone. Descriptor `sync()`/options own equivalent cheat UI behavior. |
| `features/fetchers/index.js` section wrappers | Mixed integration and legacy facade | Replace navigation wrappers with direct builder `sectionOpened(section)` calls; delete `hydrateCheatUi`, `hydratePregnancy`, `fetcherActions`, and toggle-class repair logic. |
| `features/utils/value-tree.js` | Used search traversal utility, not a cheat | Retain during Wave 11. Moving it to the future `support/search` domain belongs to the architecture reorganization. |
| `features/search-actions.js` | Live non-cheat application feature | Retain, but remove its dependency on legacy toggle IDs/actions in `restoreVariables()` as part of scheduler cutover. |
| `features/cheat-init.js`, `bootstrap.js`, `registry.js`, and listeners | Live application composition/lifecycle | Retain and narrow during Wave 11. Renaming/moving them belongs to the later architecture plan. |
| `ui/helpers/hydrate-utils.js` | Utility coupled to legacy fetchers | Delete only if production import search is empty after fetcher retirement; otherwise relocate the surviving capability to its actual owner. |
| Characterization/parity tests importing `features/cheat/**` | Migration scaffolding, not production ownership | Replace with descriptor/runtime behavior tests or archive immutable fixtures; a test import must not keep a retired implementation alive. |

### Inventory rule for every export

Before implementation, record each exported symbol from the three target trees
as exactly one of:

1. **delete** — behavior is obsolete or already descriptor-owned;
2. **replace** — a new descriptor/runtime path exists but callers still use the
   old symbol;
3. **relocate** — supported non-cheat behavior is trapped in a legacy module;
4. **retain temporarily** — still needed and explicitly outside Wave 11 scope.

An unclassified export blocks deletion. A test-only import does not automatically
change a symbol from **delete** to **retain**.

## Required retirement order

### Package 11-0 — export classification and behavior ownership

- [x] Generate the symbol inventory for `features/cheat/**`,
  `features/fetchers/**`, and `features/utils/**`; assign every export one of the
  four classifications above. See `docs/WAVE11_EXPORT_CLASSIFICATION.md`.
- [x] Map every **replace** item to its stable descriptor ID and local
  action/sync/toggle owner.
- [x] Map every **relocate** item to an application-shell or observer owner without
  doing broad directory restructuring.
- [x] Identify production imports separately from test-only imports.
- [x] Add or identify a focused behavior test for every supported **relocate**
  item before moving it. Shell rendering and command execution are covered by
  `section-shell-renderer.test.js` and
  `legacy-shell-command-classification.test.js`.
- [x] Freeze the current full-suite counts and catalog count before deletion:
  61 descriptors; 181 tests; 179 pass; 0 fail/skipped; 2 existing TODOs.

Acceptance: no export in the target trees is unclassified, and no deletion is
justified only by filename or folder membership.

### Package 11A — application-shell commands

- [x] Replace production use of `action-maps.js` with the narrowly named
  `features/application-shell-commands.js` module. Legacy maps remain reachable
  only for retirement tests until Package 11C.
- [x] Keep only modal lifecycle, section navigation, search, floating history,
  sidebar, settings controls, and `init_interface` in application ownership.
  Modal close controls remain directly owned by `ui/components/modal.js`.
- [x] Move history/sidebar helpers out of `world-actions.js`; they are application
  commands, not cheats.
- [x] Confirm whether `update_history` remains necessary after the shell controls
  own history state. Its behavior remains required and is now the exported
  `ui/components/controls.js#syncHistoryButtons` helper.
- [x] Keep server save/import commands outside cheat ownership. No implementation
  currently exists, so their application handlers return false with explicit
  unavailable feedback; the two server-save behavior TODOs remain open.
- [x] Add a test proving all declared application command IDs and every rendered
  shell `data-shell-action` value resolve.

### Package 11B — observer and scheduler ownership

- [x] Replace `cheatActions.runitall()` calls with a focused runtime scheduler
  driver owned by the observer/bootstrap layer.
- [x] Preserve frame coalescing, load suppression, daily boundary detection, and
  watchdog restoration through `createProductionCheatToggleRuntime().restore()`.
- [x] On save/load/history transitions, reinitialize config and restore attached
  descriptor toggles without dispatching old toggle IDs.
- [x] Remove `services/storage.js#reactivateToggles` and old toggle-state
  repository/engine dependencies after parity tests pass.
  The legacy engine/state files remain physically present only because the dead
  `features/actions.js` facade still imports them; Package 11C deletes that
  quarantined graph together. They are no longer reachable from production
  bootstrap, listeners, storage, settings safety, or descriptor restoration.
- [x] Remove the old toggle-ID dependency from
  `features/search-actions.js#restoreVariables`; settings safety must query or
  invoke the stable descriptor runtime instead.

Package 11B verification: full lint and strict action validation pass; the full
suite reports 187 tests, 185 passing, zero failed/skipped, and the same two
tracked server-save TODOs. A no-version-bump 3.0.0 build also passes.

### Package 11C — global registries and facades

- [x] Delete `METHOD_ACTIONS` and `action-map-methods.js`.
- [x] Delete `TOGGLE_DEFINITIONS` and `action-map-toggle.js`.
- [x] Delete cheat-specific `BOUND_ACTIONS`; descriptor controls already own
  change/input events and refresh.
- [x] Reduce `action-map-schema.js` to application-command validation or delete it
  if direct registration is clearer and covered.
- [x] Delete `features/actions.js`, including `cheatActions` and `mycode`.
- [x] Delete old player, pregnancy, world, and toggle-domain action modules once
  no production import remains.
- [x] Delete the old pregnancy lock arrays/state rather than relocating them; the
  descriptor runtime is the sole lock/scheduler owner.
- [x] Confirm `debug-actions.js#testAll` is superseded by the Developer Tools
  descriptor and production diagnostics before deletion.

Historical method, toggle, navigation, and bound-action IDs now live only in a
frozen baseline fixture. The action lint validates the 15 directly registered
application commands; cheat controls are validated by the descriptor contract
and catalog tests. Removing the pregnancy lock arrays also removed their unused
legacy fetcher checkbox hydration, while descriptor-owned pregnancy locks and
their scheduler tests remain intact.

Package 11C verification: full lint and strict action validation pass; the full
suite reports 189 tests, 187 passing, zero failed/skipped, and the same two
tracked server-save TODOs. A no-version-bump 3.0.0 build also passes.

### Package 11D — fetchers and utility cleanup

- [x] Make Quick/Stats/Misc navigation call only
  `getActiveCheatBuilder()?.sectionOpened(section)`.
- [x] Delete `hydrateCheatUi`, `hydratePregnancy`, and
  the aggregate/default exports from `features/fetchers/index.js`.
- [x] Delete the unused `firstload` and `alt_fetch` compatibility aliases and the
  unused default fetcher export.
- [x] Delete fetcher modules whose behavior is fully descriptor-local:
  `core-updates.js`, `misc-updates.js`, `offspring-updates.js`, and
  `pregnancy-updates.js` after confirming no production imports.
- [x] Delete UI hydration utilities used only by those fetchers.
- [x] Treat `ui/helpers/hydrate-utils.js` as conditional: prove it has no surviving
  production consumer before deletion.
- [x] Keep `features/utils/value-tree.js` while search actions use it; it is not a
  legacy cheat utility.
- [x] Remove or rewrite characterization tests that import deleted implementations;
  retain frozen parity fixtures only where they still protect intended behavior.

Package 11D removes the complete `features/fetchers` facade and its exclusive
`ui/helpers/hydrate-utils.js` dependency. Section-open hydration and local
select/input refresh remain descriptor-owned through builder/renderer lifecycle
callbacks. Historical behavior needed for migration evidence lives only in
test fixtures, while search retains the independent value-tree traversal.

Package 11D verification: manifest check, full factory gate, lint, strict
application-command validation, and a no-version-bump 3.0.0 build all pass. The
factory gate reports 191 tests, 189 passing, zero failed/skipped, and the same
two tracked server-save TODOs.

### Package 11E — broad feature factory and documentation

- [x] Decide whether `core/feature-factory.js` remains useful for storage/listener
  lifecycle. If retained, rename it in the later structure project—not during
  this pass—and document that it is unrelated to `createCheat()`.
  Decision: delete it. Two fixed lifecycle entries did not justify a generic
  factory or side-effect registry; `features/bootstrap.js` now composes the
  lifecycle explicitly.
- [x] Delete obsolete source-regex action validation after catalog/shell command
  tests cover all executable ownership.
- [x] Update `src/ARCHITECTURE.md`, `README.md`, contributor/testing/debugging
  documentation, and current factory docs to remove active legacy instructions.
- [x] Keep Wave 1/baseline documents clearly marked as historical rather than
  silently rewriting migration evidence.

Package 11E verification: the manifest check and full factory gate pass with 61
descriptors and 190 tests (188 passing, zero failed/skipped, two tracked
server-save TODOs). Lint and the no-version-bump 3.0.0 production build pass.

## Deletion gate

Before deleting a module:

1. `rg` must show no production import after the replacement path is implemented.
2. A descriptor or application-shell module must own every still-supported
   behavior.
3. Relevant focused tests must pass before and after deletion.
4. The complete factory gate must pass without new skips or TODOs.
5. Every exported symbol in the target module has a recorded **delete**,
   **replace**, **relocate**, or **retain temporarily** decision.
6. Test-only reachability is handled by rewriting the test or preserving a data
   fixture; it does not justify shipping a second implementation.

Never delete all of `src/features`: bootstrap, catalog setup, observers, search,
and application commands still require a feature-level integration boundary.

## Verification commands

```powershell
npm run lint
npm run check:cheat-manifest
npm run verify:cheat-factory
git diff --check
npm run build -- --no-bump
```

Also verify production retirement directly:

```powershell
rg -n "METHOD_ACTIONS|TOGGLE_DEFINITIONS|BOUND_ACTIONS|cheatActions|mycode|hydrateCheatUi|hydratePregnancy|firstload|alt_fetch" src
rg -n "legacy\s*:|descriptor\.legacy|legacyStorageKey" src/cheats test
```

## Completion checkpoint

Wave 11 is complete when the generated manifest feeds one validated catalog and
one descriptor runtime; the dispatcher contains application-shell commands only;
no global cheat action/toggle/bound map or aggregate cheat/fetcher facade is
required; stable descriptor IDs are the sole persistence identity; and the full
verification/build gates pass.

Project directory restructuring, naming cleanup, and larger module moves belong
to `TODO_PROJECT_ARCHITECTURE_REORGANIZATION.md` after this retirement is stable.

The completion checkpoint is satisfied. The generated manifest feeds one
validated catalog and descriptor runtime; the dispatcher is application-only;
stable descriptor IDs are the sole cheat persistence identity; and no global
cheat/fetcher facade remains in production.
