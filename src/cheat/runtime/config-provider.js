import {
  CHEAT_CONFIG_SCHEMA,
  isCheatConfigValueValid,
} from '../contract/config-schema.js';

export function createAdapterCheatConfigProvider(adapter) {
  const schema = new Map(CHEAT_CONFIG_SCHEMA.map((entry) => [entry.path, entry]));
  const config = () => adapter.getVariables?.()?.cheatPlus ?? adapter.variables?.()?.cheatPlus;
  const definition = (path) => {
    const found = schema.get(path);
    if (!found) throw new Error(`Unknown CheatPlus config path "${path}".`);
    return found;
  };
  return Object.freeze({
    get(path) {
      definition(path);
      return config()?.[path];
    },
    set(path, value) {
      const entry = definition(path);
      if (!isCheatConfigValueValid(entry, value))
        throw new TypeError(`Invalid value for CheatPlus config path "${path}".`);
      const target = config();
      if (!target) throw new Error('CheatPlus config is unavailable.');
      target[path] = value;
      return value;
    },
    has(path) {
      definition(path);
      return Object.hasOwn(config() ?? {}, path);
    },
    scope(path) {
      return definition(path).scope;
    },
  });
}
