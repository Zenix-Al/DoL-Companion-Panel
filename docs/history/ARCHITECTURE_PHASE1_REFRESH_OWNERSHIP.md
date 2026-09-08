# Architecture Phase 1 refresh ownership

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

Recorded: 2026-09-08.

## Ownership

`createCheatRuntimeBuilder()` owns one `createUiRefreshCoordinator()` for the
entire mounted UI. Section navigation selects the active section. The
coordinator invokes runtime-tick descriptors only when that section is mounted,
connected, visible, and active. Teardown disposes the timer with the builder.

Refreshes caused by mount, section navigation, control actions, and dirty input
remain event-driven. The 400 ms fallback is retained for the 15 descriptors
whose displayed values can change directly in SugarCube without a reliable DOM
event.

The renderer now owns edit protection for binding hydration, dynamic option
replacement, and descriptor `sync()` writes. Option-list calculation and bound
value hydration are separate stages, and a valid selection is preserved.
Synchronization requested while a local action is running is deferred and
coalesced with at most one post-action refresh.

## Measured improvement

Phase 0 mounted three independent 400 ms timers:

- timer callbacks: 7.5 per second;
- attempted descriptor runtime ticks: 37.5 per second across 15 descriptors;
- hidden descriptors rejected work only after receiving the tick call.

Phase 1 uses one 400 ms timer:

- timer callbacks: 2.5 per second, a 66.7% reduction;
- active Quick section: 7.5 descriptor ticks per second, an 80% reduction;
- active Stat or Misc section: 15 descriptor ticks per second, a 60% reduction;
- hidden sections: zero periodic descriptor calls.

Development telemetry now records coordinator ticks and duration alongside sync
calls, duration, hidden skips, and suppressed writes.

## Regression coverage

- `test/integration/ui-refresh-coordinator.test.js`
- `test/integration/phase0-sync-editing-baseline.test.js`
- existing renderer, builder, farm editor, and pregnancy/offspring integration
  suites

Final gate: 61 descriptors; 195 tests, 193 passing, zero failed/skipped, and
the same two documented server-save TODOs. Both version 3.0.0 artifacts build
successfully. The import audit reports 139 modules, 285 edges, zero cycles, and
only the two Phase 0 composition-root violations assigned to Phase 3.
