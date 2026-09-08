import test from 'node:test';
import assert from 'node:assert/strict';

import { infiniteArousalCheat } from '../../src/cheat/definitions/player/infinite-arousal.cheat.js';
import { maximumChurchTasksCheat } from '../../src/cheat/definitions/world/maximum-church-tasks.cheat.js';
import { createCheat } from '../../src/cheat/create-cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createCheatToggleRuntime } from '../../src/cheat/runtime/toggle-runtime.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';
import { createMemoryToggleStore } from '../helpers/memory-toggle-store.js';

function setup(initialStore = {}) {
  const scheduler = createFakeCheatScheduler();
  const store = createMemoryToggleStore(initialStore);
  const logs = [];
  const runtime = createCheatToggleRuntime({
    scheduler,
    store,
    logger: { error: (...args) => logs.push(args) },
  });
  return { scheduler, store, runtime, logs };
}

async function mount(descriptor, variables, toggleRuntime) {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: createFakeConfigFacade().config,
    services: { toggle: toggleRuntime },
  });
  return { env, adapter, mounted };
}

async function changeToggle(instance, enabled) {
  const control = instance.mounted.controls.element('enabled');
  control.checked = enabled;
  control.dispatchEvent(new instance.env.window.Event('change', { bubbles: true }));
  await Promise.resolve();
}

test('production frame descriptor persists once, runs immediately, and uses stable ID scheduling', async () => {
  const toggle = setup();
  const instance = await mount(infiniteArousalCheat, { arousal: 1 }, toggle.runtime);
  try {
    const renderedToggle = instance.mounted.controls.element('enabled');
    assert.equal(renderedToggle.tagName, 'BUTTON');
    assert.equal(renderedToggle.textContent, 'Arousal');
    assert.equal(renderedToggle.getAttribute('aria-pressed'), 'false');
    await changeToggle(instance, true);
    assert.equal(renderedToggle.classList.contains('cp-toggle-active'), true);
    assert.equal(instance.adapter.variables.arousal, 10000);
    assert.deepEqual(toggle.scheduler.list(), ['player.infinite-arousal']);
    assert.deepEqual(toggle.store.snapshot(), { 'player.infinite-arousal': true });
    assert.equal(
      toggle.store.getOperations().filter(({ operation }) => operation === 'write').length,
      1
    );
    instance.adapter.variables.arousal = 2;
    await toggle.scheduler.runFrame(100);
    assert.equal(instance.adapter.variables.arousal, 10000);
    await changeToggle(instance, false);
    assert.deepEqual(toggle.scheduler.list(), []);
    assert.deepEqual(toggle.store.snapshot(), {});
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('production daily descriptor executes once per game day and stops after disable', async () => {
  const toggle = setup();
  const variables = { temple_garden: 1, temple_quarters: 2, grace: 3 };
  const instance = await mount(maximumChurchTasksCheat, variables, toggle.runtime);
  try {
    await changeToggle(instance, true);
    assert.deepEqual(variables, { temple_garden: 100, temple_quarters: 100, grace: 100 });
    variables.grace = 1;
    await toggle.scheduler.runDaily(10);
    assert.equal(variables.grace, 100);
    variables.grace = 2;
    await toggle.scheduler.runDaily(10);
    assert.equal(variables.grace, 2);
    await changeToggle(instance, false);
    await toggle.scheduler.runDaily(11);
    assert.equal(variables.grace, 2);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('retired persisted aliases remain inert and unknown descriptor intent remains untouched', async () => {
  const toggle = setup({ unliarousal: true, 'missing.removed-cheat': true });
  const instance = await mount(infiniteArousalCheat, { arousal: 0 }, toggle.runtime);
  try {
    assert.equal(toggle.runtime.isEnabled(infiniteArousalCheat.id), false);
    assert.equal(instance.mounted.controls.checked('enabled'), false);
    assert.deepEqual(toggle.store.snapshot(), {
      unliarousal: true,
      'missing.removed-cheat': true,
    });
    toggle.store.clearOperations();
    await toggle.runtime.restore();
    assert.equal(
      toggle.store.getOperations().some(({ operation }) => operation === 'write'),
      false
    );
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('stable persisted identity restores after a display-label rename', async () => {
  const descriptor = createCheat({
    id: 'test.stable-label-toggle',
    location: { section: 'quick', order: 1 },
    meta: {
      label: 'Completely New Display Label',
      controls: [{ key: 'enabled', type: 'toggle', action: 'toggle' }],
    },
    toggle: { cadence: 'frame', runOnActivate: false },
    effect() {},
  });
  const toggle = setup({ [descriptor.id]: true });
  const instance = await mount(descriptor, {}, toggle.runtime);
  try {
    assert.equal(toggle.runtime.isEnabled(descriptor.id), true);
    assert.deepEqual(toggle.scheduler.list(), [descriptor.id]);
    assert.equal(instance.mounted.controls.checked('enabled'), true);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('failure quarantine disables only the broken descriptor and preserves a healthy toggle', async () => {
  const toggle = setup();
  const broken = createCheat({
    id: 'test.production-broken-toggle',
    location: { section: 'quick', order: 1 },
    meta: {
      label: 'Renamed display label',
      controls: [{ key: 'enabled', type: 'toggle', action: 'toggle' }],
    },
    toggle: { cadence: 'frame', maxFailures: 2, runOnActivate: false },
    effect() {
      throw new Error('game state must not be logged');
    },
  });
  const brokenInstance = await mount(broken, {}, toggle.runtime);
  const healthyInstance = await mount(infiniteArousalCheat, { arousal: 0 }, toggle.runtime);
  try {
    await changeToggle(brokenInstance, true);
    await changeToggle(healthyInstance, true);
    await toggle.scheduler.runFrame(10);
    await toggle.scheduler.runFrame(20);
    assert.equal(toggle.runtime.isEnabled(broken.id), false);
    assert.equal(brokenInstance.mounted.controls.checked('enabled'), false);
    assert.equal(toggle.runtime.isEnabled(infiniteArousalCheat.id), true);
    assert.equal(toggle.store.snapshot()[infiniteArousalCheat.id], true);
    assert.deepEqual(toggle.logs[0][1], { cheatId: broken.id, failures: 2 });
  } finally {
    await brokenInstance.mounted.dispose();
    await healthyInstance.mounted.dispose();
    brokenInstance.env.cleanup();
    healthyInstance.env.cleanup();
  }
});

test('dispose stops scheduling but preserves intent for one-entry remount restoration', async () => {
  const toggle = setup();
  const first = await mount(infiniteArousalCheat, { arousal: 0 }, toggle.runtime);
  await changeToggle(first, true);
  await first.mounted.dispose();
  first.env.cleanup();
  assert.deepEqual(toggle.scheduler.list(), []);
  assert.equal(toggle.store.snapshot()[infiniteArousalCheat.id], true);

  const second = await mount(infiniteArousalCheat, { arousal: 0 }, toggle.runtime);
  try {
    assert.deepEqual(toggle.scheduler.list(), [infiniteArousalCheat.id]);
    assert.equal(second.mounted.controls.checked('enabled'), true);
  } finally {
    await second.mounted.dispose();
    second.env.cleanup();
  }
});

test('watchdog restoration rebuilds attached descriptors without persistence commits', async () => {
  const toggle = setup();
  const frame = await mount(infiniteArousalCheat, { arousal: 0 }, toggle.runtime);
  const daily = await mount(
    maximumChurchTasksCheat,
    { temple_garden: 0, temple_quarters: 0, grace: 0 },
    toggle.runtime
  );
  try {
    await changeToggle(frame, true);
    await changeToggle(daily, true);
    toggle.store.clearOperations();
    await toggle.scheduler.restore({ onRestore: () => toggle.runtime.restore() });
    assert.deepEqual(
      toggle.scheduler.list().sort(),
      [frame.mounted.descriptor.id, daily.mounted.descriptor.id].sort()
    );
    assert.equal(
      toggle.store
        .getOperations()
        .some(({ operation }) => operation === 'write' || operation === 'remove'),
      false
    );
  } finally {
    await frame.mounted.dispose();
    await daily.mounted.dispose();
    frame.env.cleanup();
    daily.env.cleanup();
  }
});
