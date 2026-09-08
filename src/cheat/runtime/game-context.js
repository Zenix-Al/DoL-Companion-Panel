export class CheatRuntimeUnavailableError extends Error {
  constructor(message = 'Active game runtime is not ready.') {
    super(message);
    this.name = 'CheatRuntimeUnavailableError';
    this.code = 'CHEAT_RUNTIME_UNAVAILABLE';
  }
}

export class CheatGamePathError extends Error {
  constructor(path) {
    super(`Game path "${path}" cannot be written because its parent is missing.`);
    this.name = 'CheatGamePathError';
    this.code = 'CHEAT_GAME_PATH_MISSING';
    this.path = path;
  }
}

const partsOf = (path) =>
  Array.isArray(path)
    ? path.map(String).filter(Boolean)
    : String(path ?? '')
        .split('.')
        .map((part) => part.trim())
        .filter(Boolean);

function readPath(root, path) {
  let value = root;
  for (const part of partsOf(path)) {
    if (value == null || !Object.hasOwn(value, part)) return undefined;
    value = value[part];
  }
  return value;
}

export function createGameContext(adapter) {
  if (!adapter || typeof adapter !== 'object')
    throw new TypeError('Game context requires an adapter.');

  function variables() {
    if (typeof adapter.isReady === 'function' && !adapter.isReady()) {
      throw new CheatRuntimeUnavailableError();
    }
    const value = adapter.variables?.() ?? adapter.getVariables?.();
    if (!value || typeof value !== 'object') throw new CheatRuntimeUnavailableError();
    return value;
  }

  return Object.freeze({
    variables,
    get(path) {
      return readPath(variables(), path);
    },
    set(path, value) {
      const parts = partsOf(path);
      if (!parts.length) throw new CheatGamePathError(path);
      let parent = variables();
      for (const part of parts.slice(0, -1)) {
        if (!parent?.[part] || typeof parent[part] !== 'object') throw new CheatGamePathError(path);
        parent = parent[part];
      }
      parent[parts.at(-1)] = value;
      return value;
    },
    has(path) {
      return readPath(variables(), path) !== undefined;
    },
    setup(path) {
      const setup = adapter.setup?.() ?? adapter.getSetup?.();
      if (!setup || typeof setup !== 'object')
        throw new CheatRuntimeUnavailableError('Game setup is not ready.');
      return path == null || path === '' ? setup : readPath(setup, path);
    },
    passage() {
      return adapter.passage?.() ?? adapter.getCurrentPassage?.() ?? null;
    },
  });
}
