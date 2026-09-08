/**
 * Central app state store for CheatPlus.
 *
 * API:
 *   get(path)               – read a value by dot-path
 *   set(path, value)        – write a value; notifies subscribers
 *   subscribe(path, cb)     – listen for changes; returns unsubscribe fn
 *   snapshot()              – serializable deep copy of current state
 *   resetState()            – restore all keys to defaults (useful for re-inject)
 */

const store = {
  state: null,
  subscribers: new Map(),
};

/** Default values. Add new keys here as phases introduce more managed state. */
const initialState = () => ({
  modal: {
    open: false,
    isDelete: false,
    isCheatPressed: false,
  },
  runtime: {
    isLoad: false,
    clickCounter: 0,
    curDate: 0,
    errorFunctions: 0,
    progressFunctions: 0,
    totalFunctions: 0,
    extraNotif: false,
    reactivatingToggles: false,
    isTestingAllFunction: false,
    pcPregnant: 0,
    totalNpcPregnant: 0,
  },
});

function getStore() {
  if (!store.state) {
    store.state = initialState();
  }
  return store;
}

function getByPath(obj, path) {
  return path.split('.').reduce((cur, key) => (cur != null ? cur[key] : undefined), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((cur, key) => {
    if (cur[key] == null) cur[key] = {};
    return cur[key];
  }, obj);
  parent[last] = value;
}

/**
 * Read a state value by dot-path (e.g. `get('modal.open')`).
 * @param {string} path
 * @returns {*}
 */
export function get(path) {
  return getByPath(getStore().state, path);
}

/**
 * Write a state value. Notifies all subscribers registered for this path.
 * No-ops if the value hasn't changed (strict equality).
 * @param {string} path
 * @param {*} value
 */
export function set(path, value) {
  const store = getStore();
  const oldValue = getByPath(store.state, path);
  if (oldValue === value) return;
  setByPath(store.state, path, value);
  const callbacks = store.subscribers.get(path);
  if (callbacks) {
    callbacks.forEach((cb) => {
      try {
        cb(value, oldValue, path);
      } catch (e) {
        /* no-op */
      }
    });
  }
}

/**
 * Subscribe to changes at a specific dot-path.
 * @param {string} path
 * @param {(newValue: *, oldValue: *, path: string) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribe(path, callback) {
  const store = getStore();
  if (!store.subscribers.has(path)) store.subscribers.set(path, new Set());
  store.subscribers.get(path).add(callback);
  return () => store.subscribers.get(path)?.delete(callback);
}

/**
 * Returns a serializable deep copy of the entire state (useful for debug snapshots).
 * @returns {object}
 */
export function snapshot() {
  return JSON.parse(JSON.stringify(getStore().state));
}

/**
 * Restore all state keys to defaults. Useful when the cheat is re-injected
 * without a full page reload.
 */
export function resetState() {
  const store = getStore();
  store.state = initialState();
}
