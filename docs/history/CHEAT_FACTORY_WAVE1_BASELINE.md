# Cheat Factory Wave 1 Baseline (historical)

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

> Frozen migration evidence from before descriptor cutover. Paths and global
> facades described here are intentionally retired and must not be used as
> implementation guidance.

Recorded: 2026-08-29

The executable source of truth is `test/baseline/wave1-baseline.js`. It enriches
every method and toggle registered by the legacy action maps with its role,
migration classification, behavior status, action/method owner, metadata files,
UI identity, fetcher/runtime-path evidence, persistence key, tests, and explicit
unknowns. Empty fields are deliberate audit findings, not inferred behavior.

Application navigation, modal behavior, hydration-only actions, and server-save
transport are outside game-cheat parity. Export and Import remain known broken:
their metadata declares `save_data` and `load_data`, but the dispatcher has no
handlers. Their regression tests remain explicit todos until transport behavior
can be asserted.

## Current execution path

The common path is:

`metadata control -> renderer event wiring -> dispatchUiAction -> dispatcher -> action map -> cheatActions method -> SugarCube accessor -> State.variables/setup -> explicit or later hydration`

The machine-readable trace table covers one-shot, bound editor, dynamic options,
frame toggle, daily toggle, and debug-tool classifications. Money and infinite
arousal have executable behavior characterization. Other examples document the
current route but remain `unverified`; source inspection is not behavior proof.

Dynamic UI remains the riskiest area. Named NPC, stored NPC, player pregnancy,
fetus, offspring, and tentacle options depend on live game shapes. The recursive
debug scanner depends on the complete `State.variables` tree. These require
minimal fixtures or browser evidence before migration.

## Compatibility and collisions

`cheatActions` and `mycode` are module exports of the same facade. `firstload`
and `alt_fetch` are module-export aliases for hydration objects. Despite older
architecture prose referring to `registerGlobals()` and `window.*` compatibility
registration, the current source contains no such registration implementation.
Wave 2 must decide whether those globals are unsupported history or a required
surface; it must not silently invent them.

Multiple UI hydration actions share implementations (for example `npcnames` and
`npctraits` both call `hydrateCheatUi.npccurrent`). These are recorded as shared
implementation collisions and must not become duplicate cheat identities.

## Recorded verification

The unified gate now reports 123 tests, 121 passing, two named server-save todos,
zero skipped, and lint passing. Strict action lint fails only
for `save_data`/`load_data`. Existing generated userscript artifacts measured
230,812 bytes and 119,346 bytes minified. The build was not rerun because it
increments `build/version.json` and regenerates distributions; Wave 12 owns that
mutating release check.
