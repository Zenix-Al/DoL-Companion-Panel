import test from 'node:test';
import assert from 'node:assert/strict';

import { edenGardenCheat } from '../../src/cheat/definitions/quick/eden-garden.cheat.js';
import { edenMushroomsCheat } from '../../src/cheat/definitions/quick/eden-mushrooms.cheat.js';
import { edenSpringCheat } from '../../src/cheat/definitions/quick/eden-spring.cheat.js';
import { edenTimerCheat } from '../../src/cheat/definitions/quick/eden-timer.cheat.js';
import { infiniteNpcPregnancyCheat } from '../../src/cheat/definitions/quick/infinite-npc-pregnancy.cheat.js';
import { maximumStrayTasksCheat } from '../../src/cheat/definitions/quick/maximum-stray-tasks.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createCheatToggleRuntime } from '../../src/cheat/runtime/toggle-runtime.js';
import { CHEAT_CONFIG_SCHEMA } from '../../src/cheat/contract/config-schema.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';
import { createMemoryToggleStore } from '../helpers/memory-toggle-store.js';

const descriptors = [
  maximumStrayTasksCheat,
  edenMushroomsCheat,
  edenGardenCheat,
  edenSpringCheat,
  edenTimerCheat,
  infiniteNpcPregnancyCheat,
];

const persistedToggles = Object.fromEntries(descriptors.map((descriptor) => [descriptor.id, true]));

function pregnancy(timer, timerEnd) {
  return { pregnancy: { timer, timerEnd, fetus: [{ mother: 'Test NPC' }] } };
}

test('Quick daily-toggle package restores stable IDs, runs once per day, and tears down', async () => {
  const env = createDomWithSugarCube();
  const variables = {
    stray_happiness: 1,
    edenshrooms: 1,
    edengarden: 1,
    edenspring: 1,
    edendays: 9,
    timeStamp: 4 * 86400,
    storedNPCs: Object.fromEntries(
      Array.from({ length: 9 }, (_, index) => [`pregnancy_${index}`, pregnancy(7, 10)])
    ),
  };
  const config = createFakeConfigFacade({
    schemaEntries: CHEAT_CONFIG_SCHEMA,
    values: {
      storedNPCs: { waiting_0: pregnancy(0, 30) },
      storedNPCsDate: 0,
      storedNPCsPriority: 0,
    },
  });
  const scheduler = createFakeCheatScheduler();
  const store = createMemoryToggleStore(persistedToggles);
  const runtime = createCheatToggleRuntime({ scheduler, store });
  const adapter = createFakeGameAdapter({ variables });
  const mounted = [];

  try {
    for (const descriptor of descriptors) {
      mounted.push(
        await mountCheatDescriptor({
          descriptor,
          document: env.document,
          adapter: adapter.game,
          config: config.config,
          services: { toggle: runtime },
        })
      );
    }

    assert.deepEqual(new Set(scheduler.list()), new Set(descriptors.map(({ id }) => id)));
    assert.deepEqual(Object.keys(store.snapshot()).sort(), descriptors.map(({ id }) => id).sort());
    assert.equal(variables.stray_happiness, 100);
    assert.equal(variables.edenshrooms, 4);
    assert.equal(variables.edengarden, 4);
    assert.equal(variables.edenspring, 4);
    assert.equal(variables.edendays, 0);
    assert.equal(Object.keys(variables.storedNPCs).length, 9);
    assert.equal(config.values.storedNPCsPriority, 9);
    assert.equal(Object.values(config.values.storedNPCs)[0].pregnancy.timer, 0);

    variables.stray_happiness = 2;
    variables.edenshrooms = 2;
    await scheduler.runDaily(5);
    assert.equal(variables.stray_happiness, 100);
    assert.equal(variables.edenshrooms, 4);
    variables.stray_happiness = 3;
    await scheduler.runDaily(5);
    assert.equal(variables.stray_happiness, 3);

    for (const instance of mounted.splice(0)) await instance.dispose();
    assert.deepEqual(scheduler.list(), []);
    assert.equal(Object.keys(store.snapshot()).length, descriptors.length);
  } finally {
    for (const instance of mounted) await instance.dispose();
    env.cleanup();
  }
});
