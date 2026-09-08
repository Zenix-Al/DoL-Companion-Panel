import { getRuntimeWindow } from '../../core/global-bridge.js';

function getRenPyRoot() {
  const runtimeWindow = getRuntimeWindow();
  return runtimeWindow?.RenPyWeb ?? null;
}

function getStore() {
  const root = getRenPyRoot();
  return root?.store ?? null;
}

/**
 * RenPy-web adapter scaffold.
 *
 * This is intentionally minimal and mostly inert until a real backend wiring
 * effort defines canonical store/setup/passage contracts for RenPy-web.
 *
 * @type {import('../../core/adapter-contract.js').EngineAdapter}
 */
export const renpyWebAdapter = {
  getVariables: getStore,
  getVariable(key) {
    const store = getStore();
    return store ? store[key] : undefined;
  },
  setVariable(key, value) {
    const store = getStore();
    if (store) store[key] = value;
  },
  getSetup() {
    return getRenPyRoot()?.setup ?? null;
  },
  getSetupKey(key) {
    const setup = getRenPyRoot()?.setup;
    return setup ? setup[key] : undefined;
  },
  getCurrentPassage() {
    return getRenPyRoot()?.passage ?? null;
  },
  isAtPassage(name) {
    return this.getCurrentPassage() === name;
  },
  isReady() {
    return Boolean(getStore());
  },
};

export default renpyWebAdapter;
