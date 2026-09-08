# Architecture Phase 0 baseline

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

Recorded: 2026-09-08, after Wave 11 completion and before refresh or directory
reorganization.

## Behavior and build

- Generated catalog: 61 descriptors.
- Full factory gate before Phase 0 instrumentation: 190 tests, 188 passing,
  zero failed/skipped, and two tracked server-save TODOs.
- Full factory gate after Phase 0 instrumentation: 192 tests, 190 passing,
  zero failed/skipped, and the same two tracked server-save TODOs.
- Production artifacts: `dist/DoL-Companion-Panel.user.js` and
  `dist/DoL-Companion-Panel.uglified.user.js`, version 3.0.0.
- Source inventory: 146 files under `src` before Phase 0 additions; 7,212 lines
  across JavaScript source files.

## Import graph

Run `npm run audit:imports` to reproduce the report.

- 138 JavaScript modules after adding telemetry.
- 283 internal static import/export edges.
- Zero cycles.
- Two target-boundary violations:
  - `src/app/injection.js -> src/app/bootstrap.js`
  - `src/app/injection.js -> src/ui/index.js`

Both violations reflect composition-root code living under `core`; Phase 3 must
move that ownership to `app` before enabling `audit:imports -- --check` as a
hard gate.

## Refresh cost and edit safety

The current builder creates one 400 ms interval for every mounted section that
contains a `runtime-tick` descriptor. All three sections mount eagerly. Renderer
visibility checks suppress actual hidden-section sync callbacks, but the three
timers still wake and attempt every descriptor lookup/tick.

Development sync telemetry records, per section:

- completed sync call count and total duration;
- hidden-section skips;
- binding writes suppressed for active/dirty controls.

`test/integration/phase0-sync-editing-baseline.test.js` proves that binding-owned
text, select, and checkbox edits survive runtime ticks, section refresh, and
post-action refresh. It also reproduces the remaining defect deterministically:
a descriptor's custom `sync()` can call `controls.setValue()` and overwrite a
focused dirty input. Phase 1 must centralize this protection and change that
characterization expectation from `game` to the preserved `draft` value.

## Injector package

The current hand-corrected package is `dist/companion-panel-injector` and contains:

```text
inject-linux.sh
inject-macos.command
inject-windows.bat
README.md
Companion-Panel/companion-panel-injector.ps1
Companion-Panel/companion-panel.user.js
Companion-Panel/inject-local-html.cjs
Companion-Panel/injector-ui.ps1
Companion-Panel/restore-local-html.cjs
```

The built payload exists, but the repository's ignored build tooling still does
not reproducibly generate this corrected layout. Phase 5 owns that repair and
its fixture/platform tests.
