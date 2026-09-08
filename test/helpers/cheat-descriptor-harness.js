import { createCheatCallbackContext } from '../../src/cheat/runtime/context.js';

import { createFakeCheatScheduler } from './fake-cheat-scheduler.js';
import { createFakeConfigFacade } from './fake-config-facade.js';
import { createFakeRuntimeEngine } from './fake-game-adapter.js';
import { createMemoryToggleStore } from './memory-toggle-store.js';
import { createMountedControlScope } from './mounted-control-scope.js';

const EVENT_BY_TYPE = Object.freeze({
  button: 'click',
  toggle: 'change',
  select: 'change',
  range: 'input',
  input: 'input',
});

function normalizeOutcome(value) {
  if (value === false) return { ok: false };
  if (value === true || value == null) return { ok: true };
  if (typeof value === 'object') return { ok: value.ok !== false, ...value };
  return { ok: true, value };
}

function getToggleControlKey(descriptor) {
  return descriptor.meta?.controls?.find((control) => control.type === 'toggle')?.key ?? null;
}

export function createCheatDescriptorHarness({
  descriptor,
  document,
  parent = document.body,
  runtimeHarness = createFakeRuntimeEngine(),
  configHarness = createFakeConfigFacade(),
  scheduler = createFakeCheatScheduler(),
  toggleStore = createMemoryToggleStore(),
} = {}) {
  if (!descriptor?.id) throw new Error('Descriptor harness requires a stable cheat id.');
  if (!document) throw new Error('Descriptor harness requires a document.');

  const controller = new AbortController();
  const outcomes = [];
  const feedbackEvents = [];
  const refreshRequests = [];
  const callbackReasons = [];
  const cleanupRegistrations = [];
  const cleanupResults = [];
  const listenerCleanups = [];
  const pendingActions = new Set();
  const logEntries = [];
  let mountedScope = null;
  let mounted = false;
  let disposed = false;
  let toggleEnabled = false;

  const feedback = Object.freeze({
    success(message) {
      feedbackEvents.push(Object.freeze({ variant: 'success', message }));
    },
    error(message) {
      feedbackEvents.push(Object.freeze({ variant: 'error', message }));
    },
    warning(message) {
      feedbackEvents.push(Object.freeze({ variant: 'warning', message }));
    },
    info(message) {
      feedbackEvents.push(Object.freeze({ variant: 'info', message }));
    },
  });

  const logger = Object.freeze({
    log(message, details) {
      logEntries.push(Object.freeze({ message, details }));
    },
  });

  function context(reason, event = null) {
    callbackReasons.push(reason);
    return createCheatCallbackContext({
      descriptor,
      adapter: runtimeHarness.runtimeEngine.adapter,
      config: configHarness.config,
      controls: mountedScope?.controls ?? null,
      signal: controller.signal,
      reason,
      event,
      feedback,
      services: { scheduler, logger },
    });
  }

  function registerCleanup(candidate, source) {
    if (typeof candidate !== 'function') return;
    cleanupRegistrations.push(Object.freeze({ source }));
    cleanupResults.push({ source, cleanup: candidate });
  }

  async function requestRefresh(reason) {
    refreshRequests.push(reason);
    if (typeof descriptor.sync !== 'function') return undefined;
    return descriptor.sync(context(reason));
  }

  async function runEffect(reason) {
    if (typeof descriptor.effect !== 'function') {
      throw new Error(`Cheat "${descriptor.id}" has toggle configuration without effect().`);
    }
    return descriptor.effect(context(reason));
  }

  function validateLocalActions() {
    for (const control of descriptor.meta?.controls ?? []) {
      if (!control.action) continue;
      const isToggleAction = control.action === 'toggle' && descriptor.toggle;
      if (!isToggleAction && typeof descriptor.actions?.[control.action] !== 'function') {
        throw new Error(
          `Cheat "${descriptor.id}" control "${control.key}" references missing local action "${control.action}".`
        );
      }
    }
  }

  async function runAction(actionName, { event = null } = {}) {
    if (disposed) throw new Error(`Cheat "${descriptor.id}" is disposed.`);
    const handler = descriptor.actions?.[actionName];
    if (typeof handler !== 'function') {
      throw new Error(`Cheat "${descriptor.id}" has no local action "${actionName}".`);
    }

    let outcome;
    try {
      outcome = normalizeOutcome(await handler(context('action', event)));
    } catch (error) {
      outcome = { ok: false, message: error.message, variant: 'error', error };
    }
    outcomes.push(outcome);

    if (outcome.message) {
      feedbackEvents.push(
        Object.freeze({
          variant: outcome.variant ?? (outcome.ok ? 'success' : 'error'),
          message: outcome.message,
        })
      );
    }

    if (outcome.ok && (outcome.refresh || descriptor.refresh?.includes('after-action'))) {
      await requestRefresh('after-action');
    }
    return outcome;
  }

  async function setToggleEnabled(enabled, { restore = false } = {}) {
    if (!descriptor.toggle) throw new Error(`Cheat "${descriptor.id}" is not a toggle.`);
    const shouldEnable = Boolean(enabled);
    const controlKey = getToggleControlKey(descriptor);
    const needsRegistration = shouldEnable && !scheduler.has(descriptor.id);

    if (shouldEnable === toggleEnabled && !needsRegistration) return toggleEnabled;
    toggleEnabled = shouldEnable;
    if (controlKey && mountedScope) mountedScope.controls.setValue(controlKey, shouldEnable);

    if (shouldEnable) {
      scheduler.register(descriptor.id, ({ reason }) => runEffect(reason), {
        ...descriptor.toggle,
        onFailureThreshold({ failures, error }) {
          toggleEnabled = false;
          if (controlKey && mountedScope) mountedScope.controls.setValue(controlKey, false);
          toggleStore.remove(descriptor.id);
          logger.log(`Toggle "${descriptor.id}" quarantined after repeated failures.`, {
            failures,
            message: error.message,
          });
        },
      });
      if (!restore) toggleStore.write(descriptor.id, true);
      if (descriptor.toggle.runOnActivate !== false) {
        await runEffect(restore ? 'restore' : descriptor.toggle.cadence ?? 'frame');
      }
    } else {
      scheduler.unregister(descriptor.id);
      if (!restore) toggleStore.remove(descriptor.id);
    }
    return toggleEnabled;
  }

  async function restoreToggle() {
    if (!descriptor.toggle) return false;
    const stored = Boolean(toggleStore.read(descriptor.id));
    if (stored) await setToggleEnabled(true, { restore: true });
    return stored;
  }

  function wireActions() {
    for (const control of descriptor.meta?.controls ?? []) {
      if (!control.action) continue;
      const element = mountedScope.controls.element(control.key);
      const eventType = control.event ?? EVENT_BY_TYPE[control.type] ?? 'click';
      const listener = (event) => {
        const operation =
          control.action === 'toggle' && descriptor.toggle
            ? setToggleEnabled(Boolean(element.checked))
            : runAction(control.action, { event });
        pendingActions.add(operation);
        Promise.resolve(operation).finally(() => pendingActions.delete(operation));
      };
      element.addEventListener(eventType, listener);
      listenerCleanups.push(() => element.removeEventListener(eventType, listener));
    }
  }

  async function mount() {
    if (mounted) return mountedScope;
    if (disposed) throw new Error(`Cheat "${descriptor.id}" is disposed.`);
    validateLocalActions();
    mountedScope = createMountedControlScope({ document, descriptor, parent });
    mounted = true;
    wireActions();

    if (typeof descriptor.onEnable === 'function') {
      registerCleanup(await descriptor.onEnable(context('mount')), 'onEnable');
    }
    if (descriptor.refresh?.includes('mount')) await requestRefresh('mount');
    return mountedScope;
  }

  async function trigger(reason) {
    if (reason === 'section-open') {
      if (!descriptor.refresh?.includes(reason)) return undefined;
      return requestRefresh(reason);
    }
    if (reason === 'manual') return requestRefresh(reason);
    if (reason === 'restore') return restoreToggle();
    if (reason === 'dispose') return dispose();
    throw new Error(`Unsupported descriptor harness trigger "${reason}".`);
  }

  async function waitForIdle() {
    await Promise.all([...pendingActions]);
  }

  async function dispose() {
    if (disposed) return false;
    if (descriptor.toggle && toggleEnabled) {
      scheduler.unregister(descriptor.id);
      toggleEnabled = false;
    }
    if (typeof descriptor.onDisable === 'function') {
      registerCleanup(await descriptor.onDisable(context('dispose')), 'onDisable');
    }
    if (typeof descriptor.dispose === 'function') {
      registerCleanup(await descriptor.dispose(context('dispose')), 'dispose');
    }

    controller.abort(new DOMException('descriptor disposed', 'AbortError'));
    listenerCleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
    cleanupResults
      .splice(0)
      .reverse()
      .forEach(({ cleanup }) => cleanup());
    mountedScope?.unmount();
    disposed = true;
    mounted = false;
    return true;
  }

  return {
    descriptor,
    runtimeHarness,
    configHarness,
    scheduler,
    toggleStore,
    mount,
    runAction,
    requestRefresh,
    runEffect,
    setToggleEnabled,
    restoreToggle,
    trigger,
    waitForIdle,
    dispose,
    get controls() {
      return mountedScope?.controls ?? null;
    },
    get root() {
      return mountedScope?.root ?? null;
    },
    get signal() {
      return controller.signal;
    },
    get isToggleEnabled() {
      return toggleEnabled;
    },
    getSnapshot() {
      return {
        outcomes: [...outcomes],
        feedback: [...feedbackEvents],
        refreshRequests: [...refreshRequests],
        callbackReasons: [...callbackReasons],
        cleanupRegistrations: cleanupRegistrations.map((entry) => ({ ...entry })),
        schedulerMembership: scheduler.list(),
        persistenceOperations: toggleStore.getOperations(),
        logs: [...logEntries],
        mounted,
        disposed,
      };
    },
  };
}

export async function mountCheatCatalog(
  descriptors,
  {
    document,
    parent = document.body,
    runtimeHarness = createFakeRuntimeEngine(),
    configHarness = createFakeConfigFacade(),
    scheduler = createFakeCheatScheduler(),
    toggleStore = createMemoryToggleStore(),
  } = {}
) {
  const harnesses = new Map();
  for (const descriptor of descriptors ?? []) {
    if (harnesses.has(descriptor.id)) {
      throw new Error(`Duplicate cheat descriptor id "${descriptor.id}".`);
    }
    const harness = createCheatDescriptorHarness({
      descriptor,
      document,
      parent,
      runtimeHarness,
      configHarness,
      scheduler,
      toggleStore,
    });
    await harness.mount();
    harnesses.set(descriptor.id, harness);
  }

  return {
    runtimeHarness,
    configHarness,
    scheduler,
    toggleStore,
    get(id) {
      return harnesses.get(id) ?? null;
    },
    list() {
      return [...harnesses.values()];
    },
    async trigger(reason) {
      return Promise.all([...harnesses.values()].map((harness) => harness.trigger(reason)));
    },
    async dispose() {
      await Promise.all([...harnesses.values()].reverse().map((harness) => harness.dispose()));
      harnesses.clear();
    },
  };
}
