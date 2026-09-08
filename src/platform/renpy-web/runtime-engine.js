import { getRuntimeWindow } from '../../core/global-bridge.js';

import { renpyWebAdapter } from './adapter.js';

export function hasRenPyWebCorePrerequisites() {
  return renpyWebAdapter.isReady();
}

export function hasRenPyWebRuntimePrerequisites() {
  // Scaffold behavior: runtime prerequisites currently mirror core readiness
  // until concrete RenPy-web UI/runtime hooks are implemented.
  return hasRenPyWebCorePrerequisites();
}

export function describeRenPyWebPrerequisiteState() {
  const runtimeWindow = getRuntimeWindow();
  const renpyWeb = runtimeWindow?.RenPyWeb;

  return {
    renpyWebDefined: Boolean(renpyWeb),
    storeDefined: Boolean(renpyWeb?.store),
    setupDefined: Boolean(renpyWeb?.setup),
    passageDefined: Boolean(renpyWeb?.passage),
  };
}

export const renpyWebRuntimeEngine = Object.freeze({
  id: 'renpy-web',
  label: 'RenPy-web',
  detect() {
    return Boolean(getRuntimeWindow()?.RenPyWeb);
  },
  adapter: renpyWebAdapter,
  hasCorePrerequisites: hasRenPyWebCorePrerequisites,
  hasRuntimePrerequisites: hasRenPyWebRuntimePrerequisites,
  describePrerequisiteState: describeRenPyWebPrerequisiteState,
});

export default renpyWebRuntimeEngine;
