import { createGameContext } from './game-context.js';

function createNarrowConfig(descriptor, provider) {
  const declared = new Set(descriptor.config ?? []);
  const requirePath = (path) => {
    if (!declared.has(path))
      throw new Error(`Cheat "${descriptor.id}" did not declare config path "${path}".`);
  };
  return Object.freeze({
    get(path) {
      requirePath(path);
      return provider.get(path);
    },
    set(path, value) {
      requirePath(path);
      return provider.set(path, value);
    },
    has(path) {
      requirePath(path);
      return provider.has(path);
    },
    scope(path) {
      requirePath(path);
      return provider.scope(path);
    },
  });
}

export function createCheatCallbackContext({
  descriptor,
  adapter,
  config,
  controls,
  signal,
  reason,
  event = null,
  feedback,
  services = {},
}) {
  if (!descriptor?.id) throw new TypeError('Callback context requires a descriptor.');
  if (!signal) throw new TypeError('Callback context requires an operation signal.');
  const allowedServices = Object.freeze({
    scheduler: services.scheduler,
    logger: services.logger,
    diagnostics: services.diagnostics,
  });
  return Object.freeze({
    cheat: descriptor,
    game: createGameContext(adapter),
    config: createNarrowConfig(descriptor, config),
    controls,
    event,
    signal,
    reason,
    feedback,
    services: allowedServices,
  });
}
