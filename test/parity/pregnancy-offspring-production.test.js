import test from 'node:test';
import assert from 'node:assert/strict';

import { mcAbortionCheat } from '../../src/cheat/definitions/world/mc-abortion.cheat.js';
import { mcChildManagerCheat } from '../../src/cheat/definitions/world/mc-child-manager.cheat.js';
import { mcPregnancyCheat } from '../../src/cheat/definitions/world/mc-pregnancy.cheat.js';
import { mcTentacleCheat } from '../../src/cheat/definitions/world/mc-tentacle.cheat.js';
import { namedNpcAbortionCheat } from '../../src/cheat/definitions/world/named-npc-abortion.cheat.js';
import { storedNpcAbortionCheat } from '../../src/cheat/definitions/world/stored-npc-abortion.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { CHEAT_CONFIG_SCHEMA } from '../../src/cheat/contract/config-schema.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

const storedNpcSchema = CHEAT_CONFIG_SCHEMA.filter(({ path }) => path === 'storedNPCs');

async function mount(
  descriptor,
  variables,
  configValues = { storedNPCs: {} },
  services = {}
) {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables });
  const config = createFakeConfigFacade({ schemaEntries: storedNpcSchema, values: configValues });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: config.config,
    services,
  });
  return { env, adapter, config, mounted };
}

async function dispose(...instances) {
  for (const instance of instances) {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
}

function pregnancy(fetuses) {
  return {
    fetus: fetuses,
    potentialFathers: ['Alex'],
    timer: 3,
    timerEnd: 30,
    type: 'human',
    waterBreaking: true,
    waterBreakingTimer: 2,
  };
}

test('MC pregnancy and tentacle managers derive live options and mutate selected records', async () => {
  const scheduler = createFakeCheatScheduler();
  const mc = await mount(
    mcPregnancyCheat,
    { sexStats: { vagina: { pregnancy: pregnancy([{ mother: 'PC' }]) } } },
    { storedNPCs: {} },
    { scheduler }
  );
  const tentacle = await mount(mcTentacleCheat, {
    container: {
      womb: { creatures: { one: { creature: 'Slime', stats: { speed: 4 } } } },
    },
  });
  try {
    assert.equal(mc.mounted.controls.value('hole'), 'vagina');
    assert.equal(mc.mounted.controls.value('pregnancy'), 'baby');
    assert.equal(mc.mounted.controls.value('days'), '9');
    mc.mounted.controls.setValue('days', '5');
    mc.mounted.controls.setValue('locked', true);
    assert.equal((await mc.mounted.runAction('set')).ok, true);
    assert.equal(mc.adapter.variables.sexStats.vagina.pregnancy.timer, 15);
    assert.equal(scheduler.has('world.mc-pregnancy.lock'), true);
    mc.adapter.variables.sexStats.vagina.pregnancy.timer = 0;
    await scheduler.runFrame(200);
    assert.equal(mc.adapter.variables.sexStats.vagina.pregnancy.timer, 15);
    mc.mounted.controls.setValue('locked', false);
    await mc.mounted.runAction('set');
    assert.equal(scheduler.has('world.mc-pregnancy.lock'), false);

    assert.equal(tentacle.mounted.controls.value('creature'), 'one');
    assert.equal(tentacle.mounted.controls.value('speed'), '4');
    tentacle.mounted.controls.setValue('speed', '12');
    assert.equal((await tentacle.mounted.runAction('set')).ok, true);
    assert.equal(tentacle.adapter.variables.container.womb.creatures.one.stats.speed, 12);
  } finally {
    await dispose(mc, tentacle);
  }
});

test('MC child manager edits, confirms selected abandonment, and confirms purge-all', async () => {
  const instance = await mount(mcChildManagerCheat, {
    children: {
      first: { name: 'A', mother: 'PC', father: 'Robin', birthLocation: 'Farm' },
      second: { name: 'B', mother: 'PC', father: 'Alex', birthLocation: 'Home' },
    },
  });
  try {
    instance.mounted.controls.setValue('property', 'name');
    await instance.mounted.runAction('select');
    instance.mounted.controls.setValue('value', 'Renamed');
    await instance.mounted.runAction('set');
    assert.equal(instance.adapter.variables.children.first.name, 'Renamed');

    instance.mounted.controls.setValue('property', 'abandon');
    await instance.mounted.runAction('select');
    assert.equal((await instance.mounted.runAction('set')).kind, 'blocked');
    instance.mounted.controls.setValue('confirm', true);
    assert.equal((await instance.mounted.runAction('set')).ok, true);
    assert.equal(instance.adapter.variables.children.first, undefined);

    instance.mounted.controls.setValue('confirm', true);
    assert.equal((await instance.mounted.runAction('purge')).ok, true);
    assert.deepEqual(instance.adapter.variables.children, {});
  } finally {
    await dispose(instance);
  }
});

test('MC child manager hides child-specific controls when no children exist', async () => {
  const instance = await mount(mcChildManagerCheat, { children: {} });
  try {
    const child = instance.mounted.controls.element('child');
    assert.equal(child.disabled, true);
    assert.equal(child.options[0].textContent, 'No children');
    assert.equal(child.title, 'No children');
    for (const key of ['property', 'value', 'summary', 'confirm', 'set', 'purge']) {
      assert.equal(
        instance.mounted.controls.element(key).closest('.cp-cheat-control-unit').hidden,
        true,
        `${key} should be hidden without a selected child`
      );
    }
  } finally {
    await dispose(instance);
  }
});

test('abortion managers require confirmation and reset or splice the selected pregnancy', async () => {
  const mc = await mount(mcAbortionCheat, {
    sexStats: { vagina: { pregnancy: pregnancy([{ name: 'One' }]) } },
  });
  const named = await mount(namedNpcAbortionCheat, {
    NPCName: [{ nam: 'Robin', pregnancy: pregnancy([{ name: 'One' }, { name: 'Two' }]) }],
  });
  try {
    assert.equal((await mc.mounted.runAction('remove')).kind, 'blocked');
    mc.mounted.controls.setValue('confirm', true);
    assert.equal((await mc.mounted.runAction('remove')).ok, true);
    assert.deepEqual(mc.adapter.variables.sexStats.vagina.pregnancy.fetus, []);
    assert.equal(mc.adapter.variables.sexStats.vagina.pregnancy.type, null);

    named.mounted.controls.setValue('confirm', true);
    named.mounted.controls.setValue('fetus', '1');
    assert.equal((await named.mounted.runAction('remove')).ok, true);
    assert.deepEqual(
      named.adapter.variables.NPCName[0].pregnancy.fetus.map(({ name }) => name),
      ['One']
    );
  } finally {
    await dispose(mc, named);
  }
});

test('stored NPC removal distinguishes game and CheatPlus stores and purge clears both', async () => {
  const instance = await mount(
    storedNpcAbortionCheat,
    { storedNPCs: { pregnancy_0: { pregnancy: pregnancy([{ mother: 'Robin' }]) } } },
    { storedNPCs: { stored_0: { pregnancy: pregnancy([{ mother: 'Alex' }]) } } }
  );
  try {
    assert.equal(instance.mounted.controls.value('npc'), 'game:pregnancy_0');
    instance.mounted.controls.setValue('confirm', true);
    assert.equal((await instance.mounted.runAction('remove')).ok, true);
    assert.deepEqual(instance.adapter.variables.storedNPCs, {});
    assert.ok(instance.config.values.storedNPCs.stored_0);

    instance.mounted.controls.setValue('confirm', true);
    assert.equal((await instance.mounted.runAction('purge')).ok, true);
    assert.deepEqual(instance.adapter.variables.storedNPCs, {});
    assert.deepEqual(instance.config.values.storedNPCs, {});
  } finally {
    await dispose(instance);
  }
});
