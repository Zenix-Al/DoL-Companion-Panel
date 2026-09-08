# Builder v2 reference review

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

Phase 4 compared the DoL descriptor runtime with
`D:\programming\js\userscript\latest highlighter`. The comparison concerns
runtime construction, not that project's release build script.

## Adopted ideas

- Keep composition, registry/catalog data, lifecycle orchestration, rendering,
  and health reporting as separate owners.
- Treat teardown and repeated startup as ordinary lifecycle paths.
- Isolate a failed unit and retain structured health information instead of
  failing the entire mounted surface.
- Inject time and runtime collaborators so lifecycle tests do not depend on real
  timers or browser-global state.

## Adapted for DoL

- The static cheat catalog replaces the other project's dynamic add-on registry.
- A section is mounted lazily on first navigation because the panel has three
  stable sections and many descriptors.
- Descriptor `AbortSignal` and guarded controls prevent asynchronous work from
  updating a disposed row.
- SugarCube access remains behind the runtime adapter; configuration and toggle
  persistence remain injected services.

## Rejected ideas

- Add-on command events, registration handshakes, teardown acknowledgements, and
  watchdog hard cleanup are unnecessary for in-bundle cheat descriptors.
- Global window-owned lifecycle registries would weaken the existing descriptor
  boundary and complicate reinjection.
- Copying the other project's directory names would not reflect DoL's catalog,
  section placement, refresh cadence, or persistent toggle model.

## Builder v2 module ownership

- `catalog-plan.js`: immutable compiled descriptor/section plan.
- `section-orchestrator.js`: lazy mount, remount, section refresh, and teardown.
- `descriptor-placement.js`: placement relative to shell group anchors.
- `builder-health.js`: stable health summary and typed failure details.
- `renderer.js`: one descriptor's DOM, actions, synchronization, and cancellation.
- `refresh-coordinator.js`: one injected timer coordinating the active section.
- `builder.js`: small public facade assembling those collaborators.
