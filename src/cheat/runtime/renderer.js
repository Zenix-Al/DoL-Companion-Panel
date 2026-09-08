import { LAYOUT_CLASSES } from '../../ui/cheat-controls/layout-primitives.js';

import { createCheatCallbackContext } from './context.js';
import { createControlScope } from './control-scope.js';
import { normalizeCheatActionError, normalizeCheatActionOutcome } from './action-outcome.js';
import { syncTelemetry } from './sync-telemetry.js';

const EVENT_BY_TYPE = Object.freeze({
  button: 'click',
  toggle: 'change',
  select: 'change',
  range: 'input',
  input: 'input',
});

function createControl(document, definition) {
  const confirmationToggle =
    definition.type === 'toggle' && definition.intent === 'confirmation';
  const tag =
    definition.type === 'button' || (definition.type === 'toggle' && !confirmationToggle)
      ? 'button'
      : definition.type === 'select'
      ? 'select'
      : definition.type === 'text'
      ? 'span'
      : 'input';
  const element = document.createElement(tag);
  element.dataset.cheatControl = definition.key;
  element.classList.add('cp-cheat-control', `cp-cheat-control--${definition.type}`);
  if (definition.type !== 'text')
    element.setAttribute('aria-label', definition.label ?? definition.key);
  if (definition.tooltip) element.title = definition.tooltip;
  if (definition.type === 'button' || (definition.type === 'toggle' && !confirmationToggle)) {
    element.type = 'button';
    element.textContent = definition.label ?? '';
    element.classList.add('modal-button');
  }
  if (definition.type === 'toggle' && !confirmationToggle) {
    element.dataset.toggleButton = 'true';
    element.setAttribute('aria-pressed', 'false');
    Object.defineProperty(element, 'checked', {
      configurable: true,
      get: () => element.getAttribute('aria-pressed') === 'true',
      set: (next) => {
        element.setAttribute('aria-pressed', String(Boolean(next)));
      },
    });
  }
  if (confirmationToggle) {
    element.type = 'checkbox';
    const wrapper = document.createElement('label');
    wrapper.className = 'modal-toggle cp-cheat-toggle';
    const label = document.createElement('span');
    label.className = 'toggle-label';
    label.textContent = definition.label ?? definition.key;
    wrapper.append(element, label);
    return wrapper;
  }
  if (definition.type === 'range') {
    element.type = 'range';
    element.classList.add('cp-cheat-range');
  }
  if (definition.type === 'input') {
    element.type = 'text';
    element.classList.add('modal-content-width');
    element.autocomplete = 'off';
  }
  if (definition.type === 'select') element.classList.add('cp-cheat-select');
  if (definition.type === 'text') {
    element.textContent = definition.label ?? '';
    element.classList.add('modal-text');
    if (definition.intent === 'status') element.classList.add('cp-status-chip');
  }
  return element;
}

function createTooltip(document, message, className = '') {
  const tooltip = document.createElement('span');
  tooltip.className = `tooltip-small linkBlue ${className}`.trim();
  tooltip.tabIndex = 0;
  tooltip.setAttribute('aria-label', message);
  tooltip.textContent = '(?)';
  const content = document.createElement('span');
  content.textContent = message;
  tooltip.appendChild(content);
  return tooltip;
}

function createControlUnit(document, definition) {
  const unit = document.createElement('span');
  unit.className = 'cp-cheat-control-unit';
  if (definition.intent === 'confirmation') unit.classList.add('cp-confirmation-control');
  if (definition.intent === 'status') unit.classList.add('cp-status-control');
  unit.appendChild(createControl(document, definition));
  if (definition.tooltip)
    unit.appendChild(createTooltip(document, definition.tooltip, 'cp-cheat-tooltip'));
  return unit;
}

function setControlNotice(control, message = '', kind = 'info') {
  const unit = control.closest('.cp-cheat-control-unit');
  if (!unit) return;
  let notice = unit.querySelector('.cp-control-notice');
  if (!message) {
    notice?.remove();
    return;
  }
  if (!notice) {
    notice = control.ownerDocument.createElement('small');
    notice.className = 'cp-control-notice';
    notice.setAttribute('aria-live', 'polite');
    unit.appendChild(notice);
  }
  notice.dataset.noticeKind = kind;
  notice.textContent = message;
}

function coerceBindingValue(value, type = 'string') {
  if (type === 'number') return Number(value);
  if (type === 'integer') return Number.parseInt(value, 10);
  if (type === 'boolean') return Boolean(value);
  return String(value ?? '');
}

export async function mountCheatDescriptor({
  descriptor,
  document,
  parent = document.body,
  adapter,
  config,
  feedback = {},
  services = {},
  confirm = null,
}) {
  if (!descriptor?.id) throw new TypeError('Descriptor renderer requires a cheat descriptor.');
  const root = document.createElement('section');
  root.dataset.cheatId = descriptor.id;
  root.className = `modal-content-padding cp-cheat-descriptor ${LAYOUT_CLASSES.row} ${LAYOUT_CLASSES.cheat}`;
  const label = document.createElement('span');
  label.className = 'modal-text cp-cheat-label';
  label.textContent = descriptor.meta.label;
  const availabilityTooltip = createTooltip(document, '', 'cp-availability-tooltip');
  availabilityTooltip.hidden = true;
  availabilityTooltip.style.display = 'none';
  label.appendChild(availabilityTooltip);
  const controlsRegion = document.createElement('span');
  controlsRegion.className = 'cp-cheat-controls';
  const availabilityStatus = document.createElement('small');
  availabilityStatus.className = 'cp-cheat-status';
  availabilityStatus.setAttribute('role', 'status');
  availabilityStatus.hidden = true;
  root.append(label, controlsRegion, availabilityStatus);
  for (const definition of descriptor.meta.controls)
    controlsRegion.appendChild(createControlUnit(document, definition));
  parent.appendChild(root);
  const controls = createControlScope({ descriptor, root });
  const controller = new AbortController();
  const listeners = [];
  const cleanups = [];
  const pending = new Map();
  const editedControls = new Set();
  let queuedRefresh = null;
  let disposed = false;
  let applicable = true;
  let unavailableReason = '';
  let lifecycleActive = false;
  let enabledCleanup = null;
  let toggleCleanup = null;
  let actionDepth = 0;
  let deferredRefresh = null;
  let warnedUndeclaredSyncWrite = false;
  const canWrite = () => !disposed && !controller.signal.aborted;

  for (const definition of descriptor.meta.controls) {
    if (definition.type === 'select' && Array.isArray(definition.options))
      controls.options(definition.key, definition.options);
    if (definition.value !== undefined) controls.setValue(definition.key, definition.value);
  }

  const context = (reason, event = null, callbackControls = controls) =>
    createCheatCallbackContext({
      descriptor,
      adapter,
      config,
      controls: callbackControls,
      signal: controller.signal,
      reason,
      event,
      feedback,
      services,
    });
  const notify = (outcome) => {
    if (!outcome.message) return;
    const variant =
      outcome.variant ??
      (outcome.ok ? 'success' : outcome.kind === 'blocked' ? 'warning' : 'error');
    feedback[variant]?.(outcome.message);
  };
  const reportSyncFailure = (reason, error) => {
    services.logger?.error?.('Cheat sync failed.', {
      cheatId: descriptor.id,
      trigger: reason,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
  };
  const isVisible = () =>
    !root.hidden && root.getAttribute('aria-hidden') !== 'true' && root.style.display !== 'none';
  const isEditable = (key) => {
    const target = controls.element(key);
    return target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
  };
  const isEditProtected = (key) =>
    isEditable(key) &&
    (editedControls.has(key) || document.activeElement === controls.element(key));
  const warnUndeclaredSyncWrite = (key) => {
    if (warnedUndeclaredSyncWrite || descriptor.refresh?.length || !isEditable(key)) return;
    warnedUndeclaredSyncWrite = true;
    services.logger?.warn?.('Cheat sync writes an editable control without a refresh policy.', {
      cheatId: descriptor.id,
      controlKey: key,
    });
  };
  const assessAvailability = (reason) => {
    try {
      const callbackContext = context(reason);
      const missingPath = (descriptor.requiredPaths ?? []).find(
        (path) => !callbackContext.game.has(path)
      );
      if (missingPath)
        return {
          applicable: false,
          reason: `Required game path "${missingPath}" is unavailable.`,
        };
      if (descriptor.isApplicable && !descriptor.isApplicable(callbackContext))
        return {
          applicable: false,
          reason: 'Cheat is not applicable in the current game state.',
        };
      return { applicable: true, reason: '' };
    } catch (error) {
      return { applicable: false, reason: error?.message ?? 'Cheat availability check failed.' };
    }
  };
  const renderAvailability = (next) => {
    applicable = next.applicable;
    unavailableReason = next.reason;
    root.classList.toggle('cp-cheat-unavailable', !applicable);
    availabilityStatus.hidden = true;
    availabilityStatus.textContent = applicable ? '' : unavailableReason;
    availabilityTooltip.hidden = applicable;
    availabilityTooltip.style.display = applicable ? 'none' : '';
    availabilityTooltip.setAttribute('aria-label', applicable ? '' : unavailableReason);
    availabilityTooltip.querySelector('span').textContent = applicable ? '' : unavailableReason;
    for (const definition of descriptor.meta.controls)
      controls.setEnabled(definition.key, applicable);
  };
  async function activateLifecycle(reason) {
    if (lifecycleActive || !applicable) return;
    lifecycleActive = true;
    enabledCleanup = await descriptor.onEnable?.(context(reason));
    toggleCleanup = await services.toggle?.attach?.(descriptor, context(reason));
  }
  async function deactivateLifecycle(reason) {
    if (!lifecycleActive) return;
    lifecycleActive = false;
    await descriptor.onDisable?.(context(reason));
    if (typeof toggleCleanup === 'function') await toggleCleanup();
    if (typeof enabledCleanup === 'function') await enabledCleanup();
    toggleCleanup = null;
    enabledCleanup = null;
  }
  async function refreshAvailability(reason) {
    const next = assessAvailability(reason);
    const changed = next.applicable !== applicable || next.reason !== unavailableReason;
    if (!changed) return applicable;
    if (!next.applicable) await deactivateLifecycle(reason);
    renderAvailability(next);
    if (next.applicable) await activateLifecycle(reason);
    return applicable;
  }
  const sync = async (reason = 'manual', event = null) => {
    if (disposed) return false;
    const telemetry = services.syncTelemetry ?? syncTelemetry;
    const section = descriptor.location.section;
    if (reason !== 'manual' && reason !== 'mount' && !isVisible()) {
      telemetry.hidden(section);
      return false;
    }
    const startedAt = services.clock?.now?.() ?? globalThis.performance?.now?.() ?? Date.now();
    let suppressedWrites = 0;
    await refreshAvailability(reason);
    if (!applicable) return false;
    const guardedControls = Object.freeze({
      ...controls,
      setValue(key, next) {
        if (!canWrite()) return false;
        if (isEditProtected(key)) {
          suppressedWrites += 1;
          return false;
        }
        warnUndeclaredSyncWrite(key);
        controls.setValue(key, next);
        return true;
      },
      text(key, next) {
        if (!canWrite()) return false;
        if (isEditProtected(key)) {
          suppressedWrites += 1;
          return false;
        }
        warnUndeclaredSyncWrite(key);
        controls.text(key, next);
        return true;
      },
      options(key, options) {
        if (!canWrite()) {
          return Object.freeze({
            previousValue: controls.value(key),
            value: controls.value(key),
            selectionChanged: false,
            suppressed: true,
          });
        }
        if (isEditProtected(key)) {
          suppressedWrites += 1;
          return Object.freeze({
            previousValue: controls.value(key),
            value: controls.value(key),
            selectionChanged: false,
            suppressed: true,
          });
        }
        warnUndeclaredSyncWrite(key);
        return controls.options(key, options);
      },
    });
    const callbackContext = context(reason, event, guardedControls);
    const refreshOptionLists = async () => {
      for (const definition of descriptor.meta.controls) {
        if (definition.type !== 'select' || typeof definition.options !== 'function') continue;
        let options;
        let optionError = false;
        try {
          options = await definition.options(callbackContext);
        } catch (error) {
          options = [];
          optionError = true;
          reportSyncFailure(reason, error);
        }
        const actualOptions = Array.isArray(options) ? options : [];
        const empty = actualOptions.length === 0;
        const result = guardedControls.options(
          definition.key,
          !empty || !definition.fallbackOptions
            ? actualOptions
            : definition.fallbackOptions ?? []
        );
        if (result.suppressed) continue;
        const select = controls.element(definition.key);
        select.disabled = empty;
        select.dataset.optionState = optionError ? 'unavailable' : empty ? 'empty' : 'ready';
        const optionMessage = optionError
          ? 'Options are temporarily unavailable.'
          : empty
          ? definition.fallbackOptions?.[0]?.label ?? 'No options are currently available.'
          : result.selectionChanged
          ? 'The previous selection is no longer available.'
          : '';
        setControlNotice(select);
        select.title = optionMessage || definition.tooltip || '';
        if (optionMessage) select.setAttribute('aria-description', optionMessage);
        else select.removeAttribute('aria-description');
      }
    };
    const refreshBoundValues = () => {
      if (!canWrite()) return;
      for (const definition of descriptor.meta.controls) {
        if (!definition.binding) continue;
        if (isEditProtected(definition.key) && !definition.binding.syncWhileEditing) {
          suppressedWrites += 1;
          continue;
        }
        controls.setValue(definition.key, callbackContext.game.get(definition.binding.path));
      }
    };
    try {
      await refreshOptionLists();
      if (!canWrite()) return false;
      refreshBoundValues();
      await descriptor.sync?.(callbackContext);
      telemetry.record(section, {
        durationMs:
          (services.clock?.now?.() ?? globalThis.performance?.now?.() ?? Date.now()) - startedAt,
        suppressedWrites,
      });
      return true;
    } catch (error) {
      telemetry.record(section, {
        durationMs:
          (services.clock?.now?.() ?? globalThis.performance?.now?.() ?? Date.now()) - startedAt,
        suppressedWrites,
      });
      reportSyncFailure(reason, error);
      return false;
    }
  };
  const requestRefresh = (reason = 'manual', event = null) => {
    if (actionDepth > 0) {
      deferredRefresh = { reason, event };
      return Promise.resolve(false);
    }
    if (queuedRefresh) return queuedRefresh;
    queuedRefresh = Promise.resolve()
      .then(() => sync(reason, event))
      .finally(() => {
        queuedRefresh = null;
      });
    return queuedRefresh;
  };

  async function runAction(name, { event = null, controlKey = null } = {}) {
    if (disposed)
      return normalizeCheatActionError(new Error(`Cheat "${descriptor.id}" is disposed.`));
    if (!applicable) {
      const outcome = Object.freeze({
        ok: false,
        kind: 'blocked',
        variant: 'warning',
        message: unavailableReason,
      });
      if (!disposed) notify(outcome);
      return outcome;
    }
    const pendingKey = controlKey ?? name;
    if (pending.has(pendingKey)) return pending.get(pendingKey);
    const action = descriptor.actions?.[name];
    if (typeof action !== 'function')
      throw new Error(`Cheat "${descriptor.id}" has no local action "${name}".`);
    if (descriptor.meta.confirmation) {
      const accepted =
        typeof confirm === 'function' && (await confirm(descriptor.meta.confirmation, descriptor));
      if (!accepted) {
        const outcome = Object.freeze({
          ok: false,
          kind: 'blocked',
          variant: 'warning',
          message: 'Action cancelled.',
        });
        notify(outcome);
        return outcome;
      }
    }
    const element = controlKey ? controls.element(controlKey) : null;
    const lockDuringAction = element?.tagName === 'BUTTON';
    if (lockDuringAction) element.disabled = true;
    const operation = (async () => {
      let outcome;
      actionDepth += 1;
      try {
        outcome = normalizeCheatActionOutcome(await action(context('action', event)));
      } catch (error) {
        outcome = normalizeCheatActionError(error);
      } finally {
        actionDepth -= 1;
      }
      if (!disposed) notify(outcome);
      const requestedAfterAction =
        outcome.ok && (outcome.refresh || descriptor.refresh?.includes('after-action'));
      const pendingRefresh = deferredRefresh;
      deferredRefresh = null;
      if (requestedAfterAction || pendingRefresh)
        await requestRefresh(
          requestedAfterAction ? 'after-action' : pendingRefresh.reason,
          requestedAfterAction ? event : pendingRefresh.event
        );
      return outcome;
    })();
    pending.set(pendingKey, operation);
    try {
      return await operation;
    } finally {
      pending.delete(pendingKey);
      if (lockDuringAction && !disposed) element.disabled = false;
    }
  }

  async function runToggle(controlKey, event) {
    const enabled = controls.checked(controlKey);
    controls.setValue(controlKey, enabled);
    if (typeof services.toggle?.setEnabled !== 'function') {
      const outcome = Object.freeze({
        ok: false,
        kind: 'blocked',
        variant: 'warning',
        message: 'Toggle runtime is unavailable.',
      });
      notify(outcome);
      return outcome;
    }
    try {
      return normalizeCheatActionOutcome(
        await services.toggle.setEnabled(descriptor, enabled, context('action', event))
      );
    } catch (error) {
      const outcome = normalizeCheatActionError(error);
      notify(outcome);
      return outcome;
    }
  }

  for (const definition of descriptor.meta.controls) {
    const element = controls.element(definition.key);
    if (isEditable(definition.key)) {
      const markEdited = () => editedControls.add(definition.key);
      const clearEdited = () => editedControls.delete(definition.key);
      element.addEventListener('input', markEdited);
      element.addEventListener('change', markEdited);
      element.addEventListener('blur', clearEdited);
      listeners.push(() => element.removeEventListener('input', markEdited));
      listeners.push(() => element.removeEventListener('change', markEdited));
      listeners.push(() => element.removeEventListener('blur', clearEdited));
    }
    if (definition.binding) {
      if (definition.binding.writeOn) {
        const write = () => {
          const value = coerceBindingValue(
            controls.value(definition.key),
            definition.binding.coerce
          );
          context('action').game.set(definition.binding.path, value);
        };
        element.addEventListener(definition.binding.writeOn, write);
        listeners.push(() => element.removeEventListener(definition.binding.writeOn, write));
      }
    }
    if (definition.type === 'toggle' && definition.action === 'toggle') {
      const listener = (event) => {
        if (element.dataset.toggleButton === 'true')
          controls.setValue(definition.key, !controls.checked(definition.key));
        void runToggle(definition.key, event);
      };
      element.addEventListener('click', listener);
      listeners.push(() => element.removeEventListener('click', listener));
      const legacyChangeListener = (event) => void runToggle(definition.key, event);
      element.addEventListener('change', legacyChangeListener);
      listeners.push(() => element.removeEventListener('change', legacyChangeListener));
      continue;
    }
    if (!definition.action) continue;
    if (typeof descriptor.actions?.[definition.action] !== 'function')
      throw new Error(
        `Cheat "${descriptor.id}" control "${definition.key}" references missing local action "${definition.action}".`
      );
    const eventName = definition.event ?? EVENT_BY_TYPE[definition.type] ?? 'click';
    const listener = (event) =>
      void runAction(definition.action, { event, controlKey: definition.key });
    element.addEventListener(eventName, listener);
    listeners.push(() => element.removeEventListener(eventName, listener));
  }

  renderAvailability(assessAvailability('mount'));
  await activateLifecycle('mount');
  if (applicable && descriptor.refresh?.includes('mount')) await requestRefresh('mount');

  return Object.freeze({
    descriptor,
    root,
    controls,
    signal: controller.signal,
    get applicable() {
      return applicable;
    },
    runAction,
    sync,
    requestRefresh,
    sectionOpened(event = null) {
      if (!descriptor.refresh?.includes('section-open')) return Promise.resolve(false);
      return requestRefresh('section-open', event);
    },
    runtimeTick(event = null) {
      if (!descriptor.refresh?.includes('runtime-tick')) return Promise.resolve(false);
      return requestRefresh('runtime-tick', event);
    },
    async waitForIdle() {
      await Promise.all([...pending.values()]);
    },
    async dispose() {
      if (disposed) return false;
      disposed = true;
      controller.abort(new DOMException('descriptor disposed', 'AbortError'));
      listeners
        .splice(0)
        .reverse()
        .forEach((cleanup) => cleanup());
      root.remove();
      await deactivateLifecycle('dispose');
      const disposeCleanup = await descriptor.dispose?.(context('dispose'));
      if (typeof disposeCleanup === 'function') cleanups.push(disposeCleanup);
      cleanups
        .splice(0)
        .reverse()
        .forEach((cleanup) => cleanup());
      return true;
    },
  });
}
