import { ToggleScheduler } from './scheduler.js';

function toggleControlKey(descriptor) {
  return descriptor.meta.controls.find(
    ({ type, action }) => type === 'toggle' || action === 'toggle'
  )?.key;
}

function effectContext(base, reason) {
  return Object.freeze({ ...base, event: null, reason });
}

export function createProductionSchedulerAdapter(scheduler = ToggleScheduler) {
  return Object.freeze({
    register(id, effect, options) {
      scheduler.register(id, effect, {
        daily: options.cadence === 'daily',
        cooldownMs: options.cooldownMs,
        maxFailures: options.maxFailures,
        onFailureThreshold: options.onFailureThreshold,
      });
    },
    unregister(id, options = {}) {
      scheduler.unregister(id, { daily: options.cadence === 'daily' });
    },
    has(id, options = {}) {
      return scheduler.has(id, { daily: options.cadence === 'daily' });
    },
    list() {
      return scheduler.list();
    },
    runFrame(options = {}) {
      return scheduler.runFrame(options);
    },
    runDaily() {
      return scheduler.runDaily();
    },
    reset() {
      return scheduler.reset();
    },
  });
}

export function createCheatToggleRuntime({ scheduler, store, logger = console } = {}) {
  if (!scheduler?.register || !scheduler?.unregister || !scheduler?.has)
    throw new TypeError('Cheat toggle runtime requires a scheduler adapter.');
  if (!store?.read || !store?.write || !store?.remove)
    throw new TypeError('Cheat toggle runtime requires a toggle store.');

  const attached = new Map();

  function render(entry, enabled) {
    const key = toggleControlKey(entry.descriptor);
    if (key) entry.context.controls.setValue(key, enabled);
  }

  async function execute(entry, reason) {
    return entry.descriptor.effect(effectContext(entry.context, reason));
  }

  function quarantine(entry, details) {
    entry.enabled = false;
    render(entry, false);
    store.remove(entry.descriptor.id);
    logger?.error?.('Cheat toggle quarantined.', {
      cheatId: entry.descriptor.id,
      failures: details.failures,
    });
  }

  async function setEntryEnabled(entry, enabled, { restore = false } = {}) {
    const desired = Boolean(enabled);
    const registered = scheduler.has(entry.descriptor.id, entry.descriptor.toggle);
    if (desired === entry.enabled && (!desired || registered)) return desired;

    entry.enabled = desired;
    render(entry, desired);
    if (!desired) {
      scheduler.unregister(entry.descriptor.id, entry.descriptor.toggle);
      if (!restore) store.remove(entry.descriptor.id);
      return false;
    }

    scheduler.register(
      entry.descriptor.id,
      ({ reason } = {}) => execute(entry, reason ?? entry.descriptor.toggle.cadence),
      {
        ...entry.descriptor.toggle,
        onFailureThreshold: (details) => quarantine(entry, details),
      }
    );
    if (!restore) store.write(entry.descriptor.id, true);
    if (entry.descriptor.toggle.runOnActivate !== false) {
      await execute(entry, restore ? 'restore' : entry.descriptor.toggle.cadence);
    }
    return true;
  }

  async function attach(descriptor, context) {
    if (!descriptor.toggle) return null;
    let entry = attached.get(descriptor.id);
    if (entry) {
      entry.context = context;
      render(entry, entry.enabled);
      return () => detach(descriptor);
    }
    entry = { descriptor, context, enabled: false };
    attached.set(descriptor.id, entry);
    if (store.read(descriptor.id)) await setEntryEnabled(entry, true, { restore: true });
    else render(entry, false);
    return () => detach(descriptor);
  }

  async function setEnabled(descriptor, enabled, context) {
    let entry = attached.get(descriptor.id);
    if (!entry) {
      entry = { descriptor, context, enabled: false };
      attached.set(descriptor.id, entry);
    } else entry.context = context;
    return setEntryEnabled(entry, enabled);
  }

  function detach(descriptor, { preserveIntent = true } = {}) {
    const entry = attached.get(descriptor.id);
    if (!entry) return false;
    scheduler.unregister(descriptor.id, descriptor.toggle);
    if (!preserveIntent) store.remove(descriptor.id);
    attached.delete(descriptor.id);
    return true;
  }

  async function restore() {
    for (const entry of attached.values()) {
      entry.enabled = false;
      if (store.read(entry.descriptor.id)) {
        await setEntryEnabled(entry, true, { restore: true });
      } else render(entry, false);
    }
  }

  return Object.freeze({
    attach,
    detach,
    setEnabled,
    setEnabledById(id, enabled) {
      const entry = attached.get(id);
      return entry ? setEntryEnabled(entry, enabled) : false;
    },
    restore,
    isEnabled(id) {
      return attached.get(id)?.enabled ?? false;
    },
    listAttached() {
      return [...attached.keys()];
    },
  });
}

export function createProductionCheatToggleRuntime(options = {}) {
  return createCheatToggleRuntime({
    scheduler: options.scheduler ?? createProductionSchedulerAdapter(),
    store: options.store,
    logger: options.logger,
  });
}
