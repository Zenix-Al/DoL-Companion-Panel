# Phase 3 path migration

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

This table is the approved ownership map for the architecture reorganization.
Moves do not retain compatibility re-exports at old paths.

| Old path | New path | Owner |
| --- | --- | --- |
| `src/cheats/**` | `src/cheat/**` | Cheat contract, catalog, runtime, and definitions |
| `src/generated/cheats.generated.js` | `src/cheat/catalog/generated.js` | Generated cheat catalog |
| `src/core/adapters/types.js` | `src/platform/adapter-contract.js` | Runtime adapter contract |
| `src/core/sugarcube/**` | `src/platform/sugarcube/**` | SugarCube platform integration |
| `src/core/renpy-web/**` | `src/platform/renpy-web/**` | Ren'Py web platform integration |
| `src/core/runtime-engine-sugarcube.js` | `src/platform/sugarcube/runtime-engine.js` | SugarCube engine definition |
| `src/core/runtime-engine-renpy-web.js` | `src/platform/renpy-web/runtime-engine.js` | Ren'Py web engine definition |
| `src/core/runtime-engine-registry.js` | `src/platform/runtime-engine-registry.js` | Platform engine selection |
| `src/core/injection.js` | `src/app/injection.js` | Application startup/composition |
| `src/core/game-context.js` | `src/app/game-context.js` | Application/version presentation context |
| `src/core/runtime-observer-policy.js` | `src/app/observers/runtime-observer-policy.js` | Application observer policy |
| `src/core/runtime-state.js` | `src/app/runtime-state.js` | Application session state facade |
| `src/cheats/runtime/active-builder.js` | `src/app/active-cheat-runtime.js` | Application-owned active builder lifecycle |
| `src/features/bootstrap.js` | `src/app/bootstrap.js` | Application composition root |
| `src/features/cheat-init.js` | `src/app/cheat-runtime.js` | Cheat runtime composition |
| `src/features/application-shell-commands.js` | `src/app/commands/shell-commands.js` | Application shell commands |
| `src/features/active-toggle-observer.js` | `src/app/observers/active-toggle-observer.js` | Active observer ownership |
| `src/features/toggle-observer-driver.js` | `src/app/observers/toggle-observer-driver.js` | Toggle observer driver |
| `src/features/listeners/index.js` | `src/app/observers/game-observers.js` | Browser/game event observers |
| `src/features/search-actions.js` | deleted after Phase 3 | Retired SugarCube variable inspector |
| `src/features/utils/value-tree.js` | deleted after Phase 3 | Inspector-only traversal utility |
| `src/diagnostics/probe.js` + `runner.js` | `src/core/health.js` | Generic health checks and report runner |
| `src/diagnostics/production.js` | `src/app/panel-health.js` | CheatPlus health-check composition |
| `src/services/toggle-scheduler.js` | `src/cheat/runtime/scheduler.js` | Cheat toggle scheduling |
| `src/services/storage.js` | `src/platform/sugarcube/config-storage.js` | SugarCube-backed CheatPlus config initialization |
| `src/services/ui-sync-scheduler.js` | deleted | Unused pre-Phase-1 UI scheduler |
| `src/core/config/cheat-config-schema.js` | `src/cheat/contract/config-schema.js` | Cheat configuration contract |
| `src/config/game-data.js` | `src/cheat/data/game-data.js` | Descriptor data and project links |
| `src/config/action-policy.js` | `src/app/commands/action-policy.js` | Application command policy |
| `src/constants/runtime.js` | `src/core/time.js` | Domain-neutral time constant |
| `src/constants/sugarcube.js` | `src/platform/sugarcube/constants.js` | SugarCube constants |
| `src/constants/ui.js` | `src/ui/constants.js` | UI constants |
| `src/core/styleRegistry.js` | `src/ui/theme/style-registry.js` | UI stylesheet registry |
| `src/core/state/index.js` | `src/core/state.js` | Domain-neutral in-memory state |
| `src/ui/assets/**` | `src/ui/theme/**` | UI styles |
| `src/ui/components/modal.js` | `src/ui/shell/modal.js` | Modal shell behavior |
| `src/ui/components/controls.js` | `src/ui/shell/floating-controls.js` | Floating shell controls |
| `src/ui/components/toast.js` | `src/ui/shell/toast.js` | Shell feedback UI |
| `src/ui/renderers/layout.js` | `src/ui/shell/layout.js` | Shell layout templates |
| `src/ui/renderers/layout-primitives.js` | `src/ui/cheat-controls/layout-primitives.js` | Descriptor layout vocabulary |
| `src/ui/helpers/action-dispatch.js` | `src/app/commands/ui-action-dispatch.js` | Application dispatch of UI-originated actions |
| `src/ui/helpers/css-injector.js` | `src/ui/theme/css-injector.js` | Stylesheet installation |
| `src/ui/helpers/dom-query.js` | `src/ui/shell/dom-query.js` | Shell DOM lookup |
| `src/ui/helpers/modal-hotkey.js` | `src/ui/shell/modal-hotkey.js` | Modal shell hotkey |
| `src/ui/helpers/ui-display.js` | `src/ui/shell/ui-display.js` | Section display behavior |
| `src/ui/renderers/cheat-form.js` | deleted | Retired legacy developer action executor |
| `src/ARCHITECTURE.md` | `docs/architecture/OVERVIEW.md` | Active architecture guide |
| `src/core/runtime-engine-strategy.md` | `docs/architecture/RUNTIME_ENGINES.md` | Runtime-engine guide |
| `src/core/state/architecture.md` | `docs/architecture/STATE.md` | State ownership guide |
| `test/README.md` | `docs/testing/README.md` | Testing guide |
| `test/browser-smoke-checklist.md` | `docs/testing/BROWSER_SMOKE_CHECKLIST.md` | Browser smoke checks |
| `test/BROWSER_ACCEPTANCE_CHECKLIST_UI8.md` | `docs/history/UI8_BROWSER_ACCEPTANCE.md` | Completed UI8 acceptance record |

Top-level source responsibilities after the move:

- `app`: composition, lifecycle, observers, and application commands.
- `cheat`: descriptor contract, catalog, runtime behavior, and definitions.
- `core`: small domain-independent primitives only.
- `platform`: engine adapters and platform-specific state access.
- `ui`: shell, descriptor-control presentation, and theme assets.
