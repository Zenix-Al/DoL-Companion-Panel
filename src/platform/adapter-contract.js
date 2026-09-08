/**
 * Engine adapter contract for CheatPlus.
 *
 * An adapter is a plain object that satisfies this interface.
 * All engine-specific behaviour must live inside an adapter module;
 * `app/`, `cheat/`, and `ui/` must never import engine globals directly.
 *
 * To add a new engine adapter (e.g. renpy-web):
 *   1. Create `platform/<engine>/adapter.js` that exports a default adapter object.
 *   2. Make sure every method signature matches the types below.
 *   3. Register it at startup via the bootstrap layer.
 *
 * The SugarCube adapter lives in `platform/sugarcube/adapter.js`.
 *
 * @typedef {Object} EngineAdapter
 *
 * --- State access ---
 * @property {() => Record<string, any> | null}  getVariables
 *   Returns the mutable player-variables object (`SugarCube.State.variables`).
 *
 * @property {(key: string) => any}              getVariable
 *   Read a single top-level variable by key.
 *
 * @property {(key: string, value: any) => void} setVariable
 *   Write a single top-level variable by key.
 *
 * --- Setup (read-only engine config) ---
 * @property {() => Record<string, any> | null}  getSetup
 *   Returns the engine setup object (`SugarCube.setup`).
 *
 * @property {(key: string) => any}              getSetupKey
 *   Read a single key from the setup object.
 *
 * --- Passage / navigation ---
 * @property {() => string | null}               getCurrentPassage
 *   Returns the name of the currently rendered passage.
 *
 * @property {(name: string) => boolean}         isAtPassage
 *   Returns true if the current passage name equals `name`.
 *
 * --- Lifecycle ---
 * @property {() => boolean}                     isReady
 *   Returns true if the engine is fully initialized and variables are accessible.
 *
 * @typedef {Object} RuntimeObserverPolicy
 * @property {(target: EventTarget | null | undefined) => boolean} detectLoadTrigger
 * @property {(target: EventTarget | null | undefined) => boolean} detectHistoryNavigation
 *
 * @typedef {Object} RuntimeEngineProfile
 * @property {string}               id
 * @property {string}               label
 * @property {() => boolean}        detect
 * @property {EngineAdapter}        adapter
 * @property {RuntimeObserverPolicy} [observerPolicy]
 * @property {() => boolean}        hasCorePrerequisites
 * @property {() => boolean}        hasRuntimePrerequisites
 * @property {() => Record<string, boolean>} describePrerequisiteState
 */

// This file contains no runtime code — it is purely a JSDoc contract.
// Consumers import adapter instances, not this file directly.
