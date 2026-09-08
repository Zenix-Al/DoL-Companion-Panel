import { CHEAT_ROOT_ID } from '../ui/constants.js';
import { byUiId } from '../ui/shell/dom-query.js';
import { initStorage } from '../platform/sugarcube/config-storage.js';

import {
  configureRuntimeObserverPolicy,
  initGameObservers,
  registerListenerActions,
} from './observers/game-observers.js';
import { configureCheatRuntime } from './cheat-runtime.js';

let bootstrapped = false;

function canBootstrap(runtimeEngine) {
  return Boolean(runtimeEngine?.adapter?.isReady?.() && byUiId(CHEAT_ROOT_ID));
}

function bootstrap({ runtimeEngine } = {}) {
  if (bootstrapped) return false;
  if (!canBootstrap(runtimeEngine)) return false;

  configureRuntimeObserverPolicy(runtimeEngine?.observerPolicy ?? {});

  registerListenerActions();
  configureCheatRuntime(runtimeEngine);
  initStorage();
  initGameObservers();

  bootstrapped = true;
  return true;
}

export function bootstrapCheat(options = {}) {
  return bootstrap(options);
}
