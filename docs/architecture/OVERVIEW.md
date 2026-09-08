# Runtime architecture

This document describes the active architecture after the Wave 11 legacy
retirement. Migration snapshots under `docs/history/` are historical evidence and are
not instructions for adding new functionality.

## Composition root

The userscript starts at `src/main.js` and follows one explicit path:

```text
main.js
  -> app/injection.js
     -> mount the Shadow DOM interface
     -> detect and wait for a supported runtime engine
     -> app/bootstrap.js
        -> register application-shell commands
        -> compile the generated descriptor catalog
        -> normalize save-backed CheatPlus config
        -> attach load/history/toggle observers
```

`src/app/bootstrap.js` is deliberately explicit. There is no generic feature
factory, side-effect registry, or generic feature compatibility layer.

## Cheat ownership

Every cheat is a `createCheat()` descriptor under `src/cheat/definitions/`.
The generated manifest feeds `src/cheat/index.js`, which creates one validated
catalog. A descriptor owns its stable ID, placement, controls, actions, required
game paths, refresh lifecycle, and optional repeating-toggle effect.

The global dispatcher is only for application-shell commands such as opening
the modal, changing tabs, history/sidebar controls, and server command
placeholders. Descriptor controls call descriptor-local actions directly.

## Rendering and fetching current values

`src/cheat/runtime/builder.js` mounts catalog descriptors through
`src/cheat/runtime/renderer.js`.

- Application startup defines all section containers, but only the active section
  mounts. First navigation calls `builder.sectionOpened(section)` and lazily
  mounts that section.
- Catalog compilation, section orchestration, descriptor placement, health, and
  refresh timing have separate runtime modules.
- A descriptor `sync()` reads current game values when its declared refresh
  reason runs.
- Select/input actions may return `{ refresh: true }` to update dependent
  controls after the local value changes.
- Automatic runtime refresh is opt-in through the descriptor's `refresh` list.
- Active text editing is protected from sync overwrites by the scoped control
  helpers.

There is no aggregate fetcher/hydrator facade. Each descriptor owns the reads
needed to hydrate its controls.

## Runtime access

Descriptors receive a normalized callback context instead of reading globals:

```js
{
  game,       // adapter-safe game state access
  config,     // descriptor-declared save-backed config paths
  controls,   // controls scoped to this mounted descriptor
  services,   // approved scheduler/diagnostic/logging services
  signal,
  event,
  reason,
}
```

SugarCube detection and compatibility quirks belong under `src/platform/sugarcube/`
and the runtime-engine registry. UI and descriptors must not detect SugarCube
independently.

## Repeating toggles

`src/cheat/runtime/toggle-runtime.js` owns stable-ID persistence and descriptor
toggle attachment. `src/app/observers/toggle-observer-driver.js` owns interaction
ticks, daily-boundary detection, load suppression, and watchdog restoration.
The shared scheduler provides frame coalescing and failure thresholds.

Load and history transitions normalize config and restore only attached
descriptor toggles. Retired button IDs and action aliases are intentionally
ignored.

## Application lifecycle and cleanup

Modal close disposes mounted descriptor instances, event listeners, refresh
work, and scheduler entries while preserving saved toggle intent. Remounting
restores that intent once controls are available. Document observers are owned
by `src/app/observers/game-observers.js` and use the central event registry for cleanup.

## Adding a cheat

1. Add one `*.cheat.js` descriptor under the appropriate definition domain.
2. Declare controls and local actions in that descriptor.
3. Use `sync()` and refresh reasons for current-value display.
4. Add focused behavior tests using the descriptor harness.
5. Regenerate/check the manifest and run the checks in the
   [descriptor authoring guide](../contributing/CHEAT_DESCRIPTORS.md).

Do not add global cheat action maps, compatibility aliases, aggregate fetchers,
or direct SugarCube access.
