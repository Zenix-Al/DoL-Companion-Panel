# Runtime Engine Strategy

This layer is the portability boundary for CheatPlus runtime boot.

## Goal

Adding a second backend should mean:

1. add one engine adapter
2. add one runtime engine profile
3. register that profile

It should not require edits across descriptors, UI modules, or listener wiring.

## Current Shape

- `src/platform/sugarcube/adapter.js`
  - engine data access boundary used by the existing codebase
- `src/app/observers/runtime-observer-policy.js`
  - runtime observer hooks used by document-level listeners
- `src/platform/sugarcube/runtime-engine.js`
  - SugarCube runtime profile: detection, readiness checks, observer policy, adapter
- `src/platform/renpy-web/runtime-engine.js`
  - RenPy-web runtime profile scaffold: registered and inert until backend wiring is defined
- `src/platform/runtime-engine-registry.js`
  - runtime profile registry and active-engine selection
- `src/app/injection.js`
  - waits for a detected runtime profile, then waits for that profile's prerequisites
- `src/app/bootstrap.js`
  - consumes the selected runtime profile and applies its observer policy before starting application observers

## Runtime Engine Profile Contract

A runtime engine profile must provide:

- `id`
- `label`
- `detect()`
- `adapter`
- `observerPolicy`
- `hasCorePrerequisites()`
- `hasRuntimePrerequisites()`
- `describePrerequisiteState()`

## Migration Path For A Second Backend

Example target: `renpy-web`

1. Create a backend adapter

   - Path: `src/platform/renpy-web/adapter.js`
   - Match the adapter contract in `src/platform/adapter-contract.js`
   - Keep all backend globals isolated there

2. Create a backend runtime profile

   - Path: `src/platform/renpy-web/runtime-engine.js`
   - Implement detection logic
   - Define readiness checks for minimal boot and full runtime boot
   - Provide a backend-specific `observerPolicy`

- Example scaffold exists at `src/platform/renpy-web/runtime-engine.js`

3. Register the profile

   - Import it in `src/platform/runtime-engine-registry.js`
   - Call `registerRuntimeEngine(...)`
   - Registration order is the precedence order when multiple profiles detect true

4. Keep descriptors and application commands unchanged

   - descriptors should continue to depend on the normalized callback game API
   - if behavior needs new backend data, extend the adapter surface first
   - do not add backend conditionals in descriptors or UI modules

5. Migrate backend-specific quirks behind the adapter/profile
   - passage/history/load detection belongs in observer policy or backend quirk helpers
   - runtime readiness belongs in the runtime profile

## Non-Goals

- Generic cross-engine gameplay abstraction in one pass
- Rewriting existing DoL-specific feature behavior
- Pretending all engines have identical lifecycle semantics

The portability target here is bootstrap/runtime strategy isolation, not full feature parity across engines.

## Current Scaffold Status

- A no-op RenPy-web profile is already registered.
- It will not affect current DoL/SugarCube boot unless a `RenPyWeb` global is present.
- It exists to prove the registry path and to provide a concrete starting point for full backend integration.
