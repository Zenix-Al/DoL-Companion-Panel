import { SHADOW_HOST_ID } from '../ui/constants.js';
import { mountInterface } from '../ui/index.js';
import debugLog from '../core/logger.js';
import { ensureActiveRuntimeEngine } from '../platform/runtime-engine-registry.js';

import { bootstrapCheat } from './bootstrap.js';

const injectionState = {
  started: false,
  ready: false,
};

function getInjectionState() {
  return injectionState;
}

function getDetectedRuntimeEngine() {
  return ensureActiveRuntimeEngine();
}

function waitForCondition(check, { intervalMs = 50, timeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    if (check()) {
      resolve();
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error('Injection prerequisites timed out.'));
      }
    }, intervalMs);
  });
}

async function waitForRuntimeEngine() {
  await waitForCondition(() => Boolean(getDetectedRuntimeEngine()), { timeoutMs: 30000 });
  const runtimeEngine = getDetectedRuntimeEngine();
  if (!runtimeEngine) {
    throw new Error('No supported runtime engine detected.');
  }
  return runtimeEngine;
}

async function waitForPrerequisites(runtimeEngine) {
  await waitForCondition(() => runtimeEngine.hasRuntimePrerequisites(), { timeoutMs: 30000 }).catch(
    async () => {
      console.warn(
        `[CheatPlus] ${runtimeEngine.label} runtime prerequisites not met within 30s — dumping status and retrying.`
      );
      console.warn('[CheatPlus] status:', runtimeEngine.describePrerequisiteState());

      // Extended wait; fall back to core-only readiness if optional fields stay missing.
      await waitForCondition(() => runtimeEngine.hasRuntimePrerequisites(), {
        timeoutMs: 60000,
      }).catch(async () => {
        await waitForCondition(() => runtimeEngine.hasCorePrerequisites(), { timeoutMs: 60000 });
        console.warn(`[CheatPlus] Continuing with core ${runtimeEngine.label} readiness only.`);
      });
    }
  );
}

export async function startCheatInjection() {
  const state = getInjectionState();
  if (state.started) return;
  state.started = true;

  try {
    debugLog('injection', 'startCheatInjection:before-mount', {
      data: { bodyPresent: !!document.body },
    });
    await waitForCondition(() => Boolean(document.body), { timeoutMs: 20000 });

    mountInterface();
    debugLog('injection', 'mountInterface() called', {
      data: { hostPresent: !!document.getElementById(SHADOW_HOST_ID) },
    });

    const runtimeEngine = await waitForRuntimeEngine();
    debugLog('injection', 'runtime-engine-detected', {
      data: { runtimeEngine: runtimeEngine.id },
    });

    await waitForPrerequisites(runtimeEngine);

    bootstrapCheat({ runtimeEngine });
    debugLog('injection', 'after-bootstrap', { data: { ready: true } });
    state.ready = true;
  } catch (error) {
    state.started = false;
    console.error('[CheatPlus] Injection failed:', error);
  }
}
