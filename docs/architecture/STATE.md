# State architecture

State has three owners with different lifetimes.

## Transient application state

`src/core/state.js` owns the in-memory store and subscription mechanism. Modal and runtime execution state is reset with the application and is never serialized into a game save. `src/app/runtime-state.js` provides named application-level accessors backed by that store; it must not create a second store.

## Save-backed panel configuration

`src/cheat/contract/config-schema.js` declares every supported path, type, scope, and default. `src/platform/sugarcube/cheat-config.js` is the SugarCube persistence facade. Descriptors may access only paths declared in their own `config` list through the callback context.

## Game state

Game variables remain owned by the selected platform adapter. Descriptors use `context.game.get`, `set`, `has`, `setup`, and `passage`; they do not import SugarCube selectors or runtime globals.

Use save-backed configuration only when a value must survive save/load. Use core state for UI and execution coordination. Use the game adapter for actual game variables.
