/**
 * SugarCube adapter — implements the EngineAdapter contract (core/adapters/types.js)
 * using the thin modules in this directory.
 *
 * This is the **single, recommended import point** for consumers that need
 * any engine interaction:
 *
 *   import { scAdapter } from './adapter.js';
 *   const vars = scAdapter.getVariables();
 *
 * Alternatively, import the individual helpers directly for tree-shaking:
 *   import { getVars, getPassage } from './state.js';
 *   import { isAtStart } from './quirks.js';
 */
import { getSugarCube, getVars, getSetup, getPassage, isReady } from './state.js';
import { getVariable, setVariable, getSetupKey } from './selectors.js';
import { isAtPassage, isAtStart, isAtSettings } from './quirks.js';

/**
 * SugarCube adapter object.
 * Satisfies the EngineAdapter typedef from core/adapters/types.js.
 *
 * @type {import('../../core/adapter-contract.js').EngineAdapter}
 */
export const scAdapter = {
  // --- State access ---
  getVariables: getVars,
  getVariable,
  setVariable,

  // --- Setup ---
  getSetup,
  getSetupKey,

  // --- Passage / navigation ---
  getCurrentPassage: getPassage,
  isAtPassage,

  // --- Lifecycle ---
  isReady,
};

// Named re-exports so callers can `import { getVars, isAtStart } from './adapter.js'`
// without needing to know which sub-module each function lives in.
export { getSugarCube, getVars, getSetup, getPassage, isReady };
export { isAtPassage, isAtStart, isAtSettings };
export * from './selectors.js';

export default scAdapter;
