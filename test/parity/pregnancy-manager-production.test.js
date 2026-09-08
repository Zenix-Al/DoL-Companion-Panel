import test from 'node:test';
import assert from 'node:assert/strict';

import { namedNpcPregnancyCheat } from '../../src/cheat/definitions/world/named-npc-pregnancy.cheat.js';
import { storedNpcPregnancyCheat } from '../../src/cheat/definitions/world/stored-npc-pregnancy.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

async function mount(descriptor, variables, scheduler) {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: createFakeConfigFacade().config,
    services: { scheduler },
  });
  return { env, adapter, mounted };
}

test('named NPC manager owns dynamic options, day hydration, mutation, and lock scheduling', async () => {
  const scheduler = createFakeCheatScheduler();
  const variables = {
    NPCName: [
      { description: 'Robin', pregnancy: { timer: 9, timerEnd: 30 } },
      { description: 'Whitney', pregnancy: { timer: 12, timerEnd: 36 } },
      { description: 'Skipped' },
    ],
  };
  const instance = await mount(namedNpcPregnancyCheat, variables, scheduler);
  try {
    assert.deepEqual(
      [...instance.mounted.controls.element('npc').options].map(({ textContent }) => textContent),
      ['Robin', 'Whitney']
    );
    assert.equal(instance.mounted.controls.value('days'), '7');
    instance.mounted.controls.setValue('days', '4');
    instance.mounted.controls.setValue('locked', true);
    await instance.mounted.runAction('set');
    assert.equal(variables.NPCName[0].pregnancy.timer, 18);

    instance.mounted.controls.setValue('npc', '1');
    await instance.mounted.runAction('select');
    instance.mounted.controls.setValue('days', '5');
    instance.mounted.controls.setValue('locked', true);
    await instance.mounted.runAction('set');
    assert.equal(scheduler.has('world.named-npc-pregnancy.lock'), true);

    instance.mounted.controls.setValue('npc', '0');
    await instance.mounted.runAction('select');
    instance.mounted.controls.setValue('locked', false);
    await instance.mounted.runAction('set');
    assert.equal(
      scheduler.has('world.named-npc-pregnancy.lock'),
      true,
      'unlocking one NPC must not disable the remaining lock'
    );
    variables.NPCName[1].pregnancy.timer = 0;
    await scheduler.runFrame(100);
    assert.equal(variables.NPCName[1].pregnancy.timer, 21);

    instance.mounted.controls.setValue('npc', '1');
    await instance.mounted.runAction('select');
    instance.mounted.controls.setValue('locked', false);
    await instance.mounted.runAction('set');
    assert.equal(scheduler.has('world.named-npc-pregnancy.lock'), false);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('stored NPC manager uses stable fallback, selected pregnancy hydration, and scoped mutation', async () => {
  const scheduler = createFakeCheatScheduler();
  const variables = {
    storedNPCs: {
      pregnancy_0: {
        pregnancy: { timer: 6, timerEnd: 24, fetus: [{ mother: 'Alex' }] },
      },
      ignored: { pregnancy: { fetus: [] } },
    },
  };
  const instance = await mount(storedNpcPregnancyCheat, variables, scheduler);
  try {
    assert.equal(instance.mounted.controls.value('npc'), 'pregnancy_0');
    assert.equal(instance.mounted.controls.value('days'), '6');
    instance.mounted.controls.setValue('days', '3');
    await instance.mounted.runAction('set');
    assert.equal(variables.storedNPCs.pregnancy_0.pregnancy.timer, 15);
    assert.equal(scheduler.has('world.stored-npc-pregnancy.lock'), false);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});
