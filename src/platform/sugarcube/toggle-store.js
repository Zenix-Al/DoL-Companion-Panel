import { activateToggle, deactivateToggle, getToggles } from './cheat-config.js';

export function createSugarCubeToggleStore() {
  return Object.freeze({
    read(id) {
      return Boolean(getToggles()?.[id]);
    },
    has(id) {
      return Object.hasOwn(getToggles() ?? {}, id);
    },
    write(id, enabled) {
      if (enabled) activateToggle(id);
      else deactivateToggle(id);
      return Boolean(enabled);
    },
    remove(id) {
      const existed = Object.hasOwn(getToggles() ?? {}, id);
      deactivateToggle(id);
      return existed;
    },
    snapshot() {
      return { ...(getToggles() ?? {}) };
    },
  });
}
