import test from 'node:test';
import assert from 'node:assert/strict';

import { createUiRefreshCoordinator } from '../../src/cheat/runtime/refresh-coordinator.js';

function fakeTimers() {
  let callback = null;
  let created = 0;
  let cleared = 0;
  return {
    window: {
      setInterval(next) {
        callback = next;
        created += 1;
        return created;
      },
      clearInterval() {
        callback = null;
        cleared += 1;
      },
    },
    get created() {
      return created;
    },
    get cleared() {
      return cleared;
    },
    fire: () => callback?.(),
  };
}

test('one coordinator timer refreshes only the active visible section', async () => {
  const timers = fakeTimers();
  const calls = { quick: 0, stats: 0, misc: 0 };
  const visible = { quick: true, stats: true, misc: false };
  const coordinator = createUiRefreshCoordinator({ timerApi: timers.window });

  for (const section of Object.keys(calls)) {
    coordinator.register(section, {
      isVisible: () => visible[section],
      refresh: async () => {
        calls[section] += 1;
      },
    });
  }
  assert.equal(timers.created, 1);
  assert.equal(coordinator.snapshot().timerCount, 1);

  coordinator.setActiveSection('quick');
  await coordinator.tick();
  assert.deepEqual(calls, { quick: 1, stats: 0, misc: 0 });

  coordinator.setActiveSection('misc');
  await coordinator.tick();
  assert.deepEqual(calls, { quick: 1, stats: 0, misc: 0 });

  coordinator.setActiveSection('stats');
  await coordinator.tick();
  assert.deepEqual(calls, { quick: 1, stats: 1, misc: 0 });

  coordinator.dispose();
  assert.equal(timers.cleared, 1);
  assert.equal(coordinator.snapshot().timerCount, 0);
});
