import test from 'node:test';
import assert from 'node:assert/strict';

import { createToggleObserverDriver } from '../../src/app/observers/toggle-observer-driver.js';

function createHarness(timestamp = 0) {
  const calls = [];
  let currentTimestamp = timestamp;
  let watchdogRestore = null;
  const scheduler = {
    runFrame(options) {
      calls.push('frame');
      watchdogRestore = options.onWatchdogRestore;
      return true;
    },
    runDaily() {
      calls.push('daily');
    },
    reset() {
      calls.push('reset');
    },
  };
  const toggleRuntime = {
    async restore() {
      calls.push('restore');
    },
    setEnabledById(id, enabled) {
      calls.push(`enabled:${id}:${enabled}`);
      return enabled;
    },
    isEnabled(id) {
      return id === 'quick.maximum-npc-pregnancy-rate';
    },
  };
  const driver = createToggleObserverDriver({
    scheduler,
    toggleRuntime,
    getTimestamp: () => currentTimestamp,
  });
  return {
    calls,
    driver,
    setTimestamp(value) {
      currentTimestamp = value;
    },
    triggerWatchdog() {
      watchdogRestore();
    },
  };
}

test('observer driver suppresses loads and delegates frame and daily scheduling', () => {
  const harness = createHarness(0);

  assert.equal(harness.driver.notifyInteraction({ isLoad: true }), false);
  assert.deepEqual(harness.calls, []);

  assert.equal(harness.driver.notifyInteraction(), true);
  assert.deepEqual(harness.calls, ['frame']);

  harness.setTimestamp(86400);
  harness.driver.notifyInteraction();
  assert.deepEqual(harness.calls, ['frame', 'frame', 'daily']);
});

test('watchdog restoration resets scheduler and restores attached descriptor toggles', async () => {
  const harness = createHarness();
  harness.driver.notifyInteraction();
  harness.triggerWatchdog();
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(harness.calls, ['frame', 'reset', 'restore']);
});

test('observer settings API uses stable descriptor IDs', async () => {
  const harness = createHarness();

  assert.equal(harness.driver.isEnabled('quick.maximum-npc-pregnancy-rate'), true);
  assert.equal(await harness.driver.disable('quick.maximum-npc-pregnancy-rate'), false);
  assert.deepEqual(harness.calls, [
    'enabled:quick.maximum-npc-pregnancy-rate:false',
  ]);
});
