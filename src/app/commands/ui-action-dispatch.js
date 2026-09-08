import { dispatch, isRegistered } from '../../core/actions/dispatcher.js';
import { isAtStart } from '../../platform/sugarcube/quirks.js';
import { traceEvent } from '../../core/events/tracing.js';
import { getRuntimeWindow } from '../../core/global-bridge.js';
import { showToast } from '../../ui/shell/toast.js';

import {
  DESTRUCTIVE_ACTIONS,
  DESTRUCTIVE_ACTION_CONFIRMATION_MESSAGE,
  START_MENU_ACTION_ALLOWLIST,
} from './action-policy.js';

export function dispatchUiAction(actionKey) {
  if (!actionKey) return true;

  if (!isRegistered(actionKey)) {
    showToast(`Action "${actionKey}" is not registered.`, {
      variant: 'warning',
      title: 'Action Missing',
    });
    return false;
  }

  if (isAtStart() && !START_MENU_ACTION_ALLOWLIST.has(actionKey)) {
    showToast('Still in the main menu!', { variant: 'warning', title: 'Blocked' });
    return false;
  }

  if (DESTRUCTIVE_ACTIONS.has(actionKey)) {
    const runtimeWindow = getRuntimeWindow();
    const ok = runtimeWindow?.confirm
      ? runtimeWindow.confirm(DESTRUCTIVE_ACTION_CONFIRMATION_MESSAGE)
      : true;
    if (!ok) return false;
  }

  traceEvent('render', actionKey);
  dispatch(actionKey);
  return true;
}
