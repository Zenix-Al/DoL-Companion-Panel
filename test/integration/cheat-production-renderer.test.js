import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheat } from '../../src/cheat/create-cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

const location = (order) => ({ section: 'quick', group: 'renderer', order });
const emptyConfig = () => createFakeConfigFacade().config;

test('production renderer binds local async button actions and suppresses duplicate execution', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables: { money: 1 } });
  let release;
  let calls = 0;
  const descriptor = createCheat({
    id: 'test.renderer-async',
    location: location(1),
    meta: { label: 'Async', controls: [{ key: 'run', type: 'button', action: 'run' }] },
    actions: {
      async run({ game }) {
        calls += 1;
        await new Promise((resolve) => {
          release = resolve;
        });
        game.set('money', 5);
        return { ok: true, refresh: true };
      },
    },
    sync({ game, controls }) {
      controls.text('run', game.get('money'));
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });

  try {
    const button = mounted.controls.element('run');
    button.click();
    button.click();
    assert.equal(button.disabled, true);
    assert.equal(calls, 1);
    release();
    await mounted.waitForIdle();
    assert.equal(adapter.variables.money, 5);
    assert.equal(button.textContent, '5');
    assert.equal(button.disabled, false);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production renderer wires keyboard, input, select, range, and toggle events locally', async () => {
  const env = createDomWithSugarCube();
  const seen = [];
  const liveControlDisabledStates = [];
  const descriptor = createCheat({
    id: 'test.renderer-events',
    location: location(2),
    meta: {
      label: 'Events',
      controls: [
        { key: 'keyboard', type: 'input', action: 'record', event: 'keyup' },
        { key: 'input', type: 'input', action: 'record' },
        { key: 'select', type: 'select', action: 'record', options: ['a'] },
        { key: 'range', type: 'range', action: 'record' },
        { key: 'enabled', type: 'toggle', action: 'toggle' },
      ],
    },
    actions: {
      record({ event }) {
        seen.push(event.type);
        if (event.target.dataset.cheatControl === 'range')
          liveControlDisabledStates.push(event.target.disabled);
      },
    },
    toggle: { cadence: 'frame' },
    effect() {},
  });
  const toggles = [];
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
    services: {
      toggle: {
        setEnabled(_cheat, enabled) {
          toggles.push(enabled);
          return true;
        },
      },
    },
  });

  try {
    mounted.controls
      .element('keyboard')
      .dispatchEvent(new env.window.KeyboardEvent('keyup', { bubbles: true }));
    mounted.controls
      .element('input')
      .dispatchEvent(new env.window.Event('input', { bubbles: true }));
    mounted.controls
      .element('select')
      .dispatchEvent(new env.window.Event('change', { bubbles: true }));
    mounted.controls
      .element('range')
      .dispatchEvent(new env.window.Event('input', { bubbles: true }));
    mounted.controls.setValue('enabled', true);
    mounted.controls
      .element('enabled')
      .dispatchEvent(new env.window.Event('change', { bubbles: true }));
    await mounted.waitForIdle();
    await Promise.resolve();
    assert.deepEqual(seen.sort(), ['change', 'input', 'input', 'keyup'].sort());
    assert.deepEqual(liveControlDisabledStates, [false]);
    assert.deepEqual(toggles, [true]);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('descriptor controls use shared styled and accessible primitives', async () => {
  const env = createDomWithSugarCube();
  const descriptor = createCheat({
    id: 'test.renderer-primitives',
    location: location(20),
    meta: {
      label: 'Primitives',
      controls: [
        { key: 'button', type: 'button', label: 'Run', action: 'run' },
        { key: 'input', type: 'input', label: 'Value', tooltip: 'Enter a value' },
        { key: 'select', type: 'select', label: 'Choice', options: ['a'] },
        { key: 'range', type: 'range', label: 'Amount' },
        { key: 'text', type: 'text', label: 'Status' },
        {
          key: 'toggle',
          type: 'toggle',
          label: 'Enabled',
          action: 'toggle',
          intent: 'confirmation',
        },
      ],
    },
    actions: { run() {} },
    toggle: { cadence: 'frame' },
    effect() {},
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
    services: { toggle: { setEnabled: () => true } },
  });

  try {
    const button = mounted.controls.element('button');
    const input = mounted.controls.element('input');
    const select = mounted.controls.element('select');
    const range = mounted.controls.element('range');
    const text = mounted.controls.element('text');
    const toggle = mounted.controls.element('toggle');
    const wrapper = toggle.closest('label');

    assert.equal(button.classList.contains('modal-button'), true);
    assert.equal(input.classList.contains('modal-content-width'), true);
    assert.equal(input.autocomplete, 'off');
    assert.equal(input.title, 'Enter a value');
    assert.equal(
      input.closest('.cp-cheat-control-unit').querySelector('.cp-cheat-tooltip').textContent,
      '(?)Enter a value'
    );
    assert.equal(select.classList.contains('cp-cheat-select'), true);
    assert.equal(range.classList.contains('cp-cheat-range'), true);
    assert.equal(text.classList.contains('modal-text'), true);
    assert.equal(wrapper.classList.contains('modal-toggle'), true);
    assert.equal(wrapper.querySelector('.toggle-label').textContent, 'Enabled');
    assert.equal(
      toggle.closest('.cp-cheat-control-unit').classList.contains('cp-confirmation-control'),
      true
    );
    assert.equal(toggle.getAttribute('aria-label'), 'Enabled');
    assert.equal(mounted.root.querySelectorAll('.cp-cheat-separator').length, 0);
    assert.equal(mounted.root.classList.contains('cp-layout-cheat-row'), true);
    const controlsRegion = mounted.root.querySelector('.cp-cheat-controls');
    const units = [...controlsRegion.children];
    assert.equal(units.length, 6);
    assert.deepEqual(
      units.map((unit) => unit.querySelector('[data-cheat-control]').dataset.cheatControl),
      ['button', 'input', 'select', 'range', 'text', 'toggle']
    );
    const controlOrder = () =>
      [...controlsRegion.querySelectorAll('[data-cheat-control]')].map(
        ({ dataset }) => dataset.cheatControl
      );
    Object.defineProperty(env.window, 'innerWidth', { configurable: true, value: 1024 });
    env.window.dispatchEvent(new env.window.Event('resize'));
    assert.deepEqual(controlOrder(), ['button', 'input', 'select', 'range', 'text', 'toggle']);
    Object.defineProperty(env.window, 'innerWidth', { configurable: true, value: 420 });
    env.window.dispatchEvent(new env.window.Event('resize'));
    assert.deepEqual(controlOrder(), ['button', 'input', 'select', 'range', 'text', 'toggle']);
    assert.equal(units.every((unit) => unit.classList.contains('cp-cheat-control-unit')), true);
    assert.equal(
      units.every((unit) => unit.querySelector('[data-cheat-control]')),
      true
    );

    mounted.controls.setValue('toggle', true);
    assert.equal(wrapper.classList.contains('cp-toggle-active'), true);
    mounted.controls.setEnabled('toggle', false, 'Unavailable');
    assert.equal(wrapper.getAttribute('aria-disabled'), 'true');
    assert.equal(toggle.dataset.disabledReason, 'Unavailable');
    button.hidden = true;
    assert.equal(button.hidden, true);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production renderer distinguishes validation, cancellation, unavailable runtime, and thrown errors', async () => {
  const env = createDomWithSugarCube();
  const messages = [];
  const descriptor = createCheat({
    id: 'test.renderer-outcomes',
    location: location(3),
    meta: {
      label: 'Outcomes',
      confirmation: 'Proceed?',
      controls: [
        { key: 'run', type: 'button', action: 'run' },
        { key: 'invalid', type: 'button', action: 'invalid' },
        { key: 'explode', type: 'button', action: 'explode' },
      ],
    },
    actions: {
      run({ game }) {
        game.set('money', 2);
      },
      invalid() {
        return false;
      },
      explode() {
        throw new Error('boom');
      },
    },
  });
  let accepted = false;
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter({ ready: false }).game,
    config: emptyConfig(),
    confirm: () => accepted,
    feedback: {
      error: (message) => messages.push(message),
      warning: (message) => messages.push(message),
    },
  });

  try {
    assert.equal((await mounted.runAction('run')).kind, 'blocked');
    accepted = true;
    assert.equal((await mounted.runAction('run')).kind, 'blocked');
    assert.equal((await mounted.runAction('invalid')).kind, 'validation');
    assert.equal((await mounted.runAction('explode')).kind, 'error');
    assert.deepEqual(messages, ['Action cancelled.', 'Active game runtime is not ready.', 'boom']);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production renderer teardown removes only its root and listeners and aborts its instance', async () => {
  const env = createDomWithSugarCube();
  let calls = 0;
  const descriptor = createCheat({
    id: 'test.renderer-dispose',
    location: location(4),
    meta: { label: 'Dispose', controls: [{ key: 'run', type: 'button', action: 'run' }] },
    actions: {
      run() {
        calls += 1;
      },
    },
  });
  const first = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
  });
  const second = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
  });
  const oldButton = first.controls.element('run');
  await first.dispose();
  oldButton.click();
  second.controls.element('run').click();
  await second.waitForIdle();
  assert.equal(first.signal.aborted, true);
  assert.equal(second.signal.aborted, false);
  assert.equal(calls, 1);
  assert.equal(env.document.querySelectorAll('[data-cheat-id]').length, 1);
  await second.dispose();
  env.cleanup();
});

test('disposed renderer suppresses control writes from an in-flight async sync', async () => {
  const env = createDomWithSugarCube();
  let release;
  let started;
  const didStart = new Promise((resolve) => {
    started = resolve;
  });
  const descriptor = createCheat({
    id: 'test.renderer-cancel-sync',
    location: location(5),
    meta: { label: 'Cancel sync', controls: [{ key: 'status', type: 'text' }] },
    sync: async ({ controls, signal }) => {
      started(signal);
      await new Promise((resolve) => {
        release = resolve;
      });
      controls.text('status', 'late write');
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
  });
  const status = mounted.controls.element('status');
  const refresh = mounted.requestRefresh('manual');
  const signal = await didStart;

  await mounted.dispose();
  assert.equal(signal.aborted, true);
  release();
  assert.equal(await refresh, true);
  assert.equal(status.textContent, '');
  env.cleanup();
});
