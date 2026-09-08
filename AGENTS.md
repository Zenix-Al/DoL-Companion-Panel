# Repository instructions

## Ownership

- `src/app`: composition, commands, observers, and runtime coordination.
- `src/cheat`: descriptor contract, definitions, catalog, renderer, scheduler, and toggle persistence.
- `src/platform`: runtime-engine detection and engine-specific adapters.
- `src/core`: platform-neutral primitives only.
- `src/ui`: panel shell, themes, and descriptor controls.
- `tools/injector`: launcher and helper source only.
- `docs`: maintained documentation source of truth.

Do not create a generic feature compatibility layer, global cheat action maps, aggregate fetchers, or direct SugarCube access outside its platform adapter.

## Generated files

Do not hand-edit `dist/**`, `src/cheat/catalog/generated.js`, or packaged injector payloads. The package README is derived from `docs/user/LOCAL_INJECTOR.md`.

## Required checks

Run `npm test`, `npm run lint`, `npm run audit:imports`, and `npm run check:docs`. Run `npm run verify:release` for build, injector, version, or release changes.

## Safe editing and completion

Preserve unrelated worktree changes. Keep destructive game actions confirmed and diagnostics read-only. Work is done when focused failure coverage exists, lifecycle cleanup is verified, all guards pass, active docs reference current paths, and generated artifacts come entirely from tracked sources.
