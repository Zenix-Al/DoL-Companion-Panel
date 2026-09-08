import { showToast } from '../../ui/shell/toast.js';
import { openModal } from '../../ui/shell/modal.js';
import {
  Enable_cheat_history,
  Enable_sidebar_button,
  simple_cheat_button,
} from '../../ui/shell/floating-controls.js';
import { showContent } from '../../ui/shell/ui-display.js';
import { registerApplicationShellCommands } from '../commands/shell-commands.js';
import { init_interface } from '../cheat-runtime.js';
import { restoreVariables } from '../settings-safety.js';
import { byUiId } from '../../ui/shell/dom-query.js';
import {
  getIsLoad,
  setIsLoad,
} from '../runtime-state.js';
import { setErrorHook } from '../../core/actions/dispatcher.js';
import { isAtSettings } from '../../platform/sugarcube/quirks.js';
import { on, reset } from '../../core/events/registry.js';
import { initStorage } from '../../platform/sugarcube/config-storage.js';

import { getActiveToggleObserver } from './active-toggle-observer.js';
import { createRuntimeObserverPolicy } from './runtime-observer-policy.js';

let actionsRegistered = false;
let runtimeObserverPolicy = createRuntimeObserverPolicy();

export function configureRuntimeObserverPolicy(overrides = {}) {
  runtimeObserverPolicy = createRuntimeObserverPolicy(overrides);
}

export function registerListenerActions() {
  if (actionsRegistered) return;
  registerApplicationShellCommands({
    openModal,
    showContent,
    showToast,
    initInterface: init_interface,
    enableCheatHistory: Enable_cheat_history,
    enableSidebarButton: Enable_sidebar_button,
    toggleSimpleCheatButton: simple_cheat_button,
  });
  setErrorHook((key) => showToast(`Action "${key}" failed.`, { variant: 'error' }));
  actionsRegistered = true;
}

function initGameObservers() {
  const cheat = byUiId('cheat');
  if (!cheat) return;
  reset(); // teardown previously-attached listeners — safe for idempotent re-injection

  // document listener for toggle cheat
  on(document, 'click', function (event) {
    const target = event.target;
    const observer = getActiveToggleObserver();
    if (runtimeObserverPolicy.detectLoadTrigger(target)) {
      setIsLoad(true);
      return;
    }
    if (getIsLoad()) {
      initStorage();
      setIsLoad(false);
      void observer?.restore('load').then((restored) => {
        if (restored) showToast('Cheat state loaded', { variant: 'success' });
      });
      return;
    }
    if (runtimeObserverPolicy.detectHistoryNavigation(target)) {
      initStorage();
      void observer?.restore('history');
      return;
    }
    if (isAtSettings()) {
      void restoreVariables();
      return;
    }
    observer?.notifyInteraction();
  });

  on(document, 'keyup', function () {
    if (!isAtSettings()) getActiveToggleObserver()?.notifyInteraction({ isLoad: getIsLoad() });
  });
  on(cheat, 'keyup', function (event) {
    event.stopPropagation();
  });
}

function stopGameObservers() {
  reset();
  getActiveToggleObserver()?.stop();
}

export { initGameObservers, stopGameObservers };
