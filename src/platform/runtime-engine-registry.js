import { sugarcubeRuntimeEngine } from './sugarcube/runtime-engine.js';
import { renpyWebRuntimeEngine } from './renpy-web/runtime-engine.js';

const runtimeEngines = [sugarcubeRuntimeEngine, renpyWebRuntimeEngine];
let activeRuntimeEngine = null;

function isValidRuntimeEngine(engine) {
  return Boolean(
    engine &&
      typeof engine.id === 'string' &&
      engine.id.trim() &&
      typeof engine.detect === 'function' &&
      engine.adapter &&
      typeof engine.hasCorePrerequisites === 'function' &&
      typeof engine.hasRuntimePrerequisites === 'function'
  );
}

export function registerRuntimeEngine(engine) {
  if (!isValidRuntimeEngine(engine)) {
    throw new Error('[CheatPlus] Runtime engine profile is invalid.');
  }

  if (runtimeEngines.some((entry) => entry.id === engine.id)) {
    return false;
  }

  runtimeEngines.push(engine);
  return true;
}

export function getRegisteredRuntimeEngines() {
  return [...runtimeEngines];
}

export function resolveRuntimeEngine() {
  return (
    runtimeEngines.find((engine) => {
      try {
        return engine.detect();
      } catch (_) {
        return false;
      }
    }) ?? null
  );
}

export function getActiveRuntimeEngine() {
  return activeRuntimeEngine;
}

export function setActiveRuntimeEngine(engine) {
  activeRuntimeEngine = engine ?? null;
  return activeRuntimeEngine;
}

export function ensureActiveRuntimeEngine() {
  if (activeRuntimeEngine) return activeRuntimeEngine;

  const resolved = resolveRuntimeEngine();
  if (resolved) activeRuntimeEngine = resolved;
  return activeRuntimeEngine;
}
