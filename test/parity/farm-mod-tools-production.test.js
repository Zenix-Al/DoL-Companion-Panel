import test from 'node:test';
import assert from 'node:assert/strict';

import { farmAnimalAffinityCheat } from '../../src/cheat/definitions/world/farm-animal-affinity.cheat.js';
import { farmAssaultTimeCheat } from '../../src/cheat/definitions/world/farm-assault-time.cheat.js';
import { farmBuildTimeCheat } from '../../src/cheat/definitions/world/farm-build-time.cheat.js';
import { produceSalesReportCheat } from '../../src/cheat/definitions/world/produce-sales-report.cheat.js';
import { vrelCoinsUsageCheat } from '../../src/cheat/definitions/world/vrel-coins-usage.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

async function mount(descriptor, variables) {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: createFakeConfigFacade().config,
  });
  return { env, adapter, mounted };
}

async function dispose(...instances) {
  for (const instance of instances) {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
}

test('farm editors hydrate independently, validate integers, and protect active input', async () => {
  const animal = await mount(farmAnimalAffinityCheat, {
    farm: { beasts: { pigs: 2, cattle: 7 }, build_timer: 12 },
  });
  const build = await mount(farmBuildTimeCheat, { farm: { build_timer: 12 } });
  const assault = await mount(farmAssaultTimeCheat, { farm_attack_timer: 5 });
  try {
    assert.deepEqual(
      [...animal.mounted.controls.element('animal').options].map(({ value }) => value),
      ['cattle', 'pigs']
    );
    assert.equal(animal.mounted.controls.value('value'), '7');
    animal.mounted.controls.setValue('animal', 'pigs');
    await animal.mounted.runAction('select');
    animal.mounted.controls.setValue('value', '9');
    assert.equal((await animal.mounted.runAction('set')).ok, true);
    assert.equal(animal.adapter.variables.farm.beasts.pigs, 9);

    build.mounted.controls.setValue('value', '3.5');
    assert.equal((await build.mounted.runAction('set')).kind, 'validation');
    assert.equal(build.adapter.variables.farm.build_timer, 12);
    build.mounted.controls.setValue('value', '');
    assert.equal((await build.mounted.runAction('set')).kind, 'validation');
    assert.equal(build.adapter.variables.farm.build_timer, 12);
    build.mounted.controls.setValue('value', '3');
    await build.mounted.runAction('set');
    assert.equal(build.adapter.variables.farm.build_timer, 3);

    const input = assault.mounted.controls.element('value');
    input.focus();
    assault.mounted.controls.setValue('value', '44');
    assault.adapter.variables.farm_attack_timer = 18;
    await assault.mounted.runtimeTick();
    assert.equal(assault.mounted.controls.value('value'), '44');
    input.blur();
    await assault.mounted.runtimeTick();
    assert.equal(assault.mounted.controls.value('value'), '18');
  } finally {
    await dispose(animal, build, assault);
  }
});

test('produce report supports minimal and extended shapes without mutating either', async () => {
  const minimalState = { farmersProduce: { selling: { cabbage: 2, potato: 5 } } };
  const extendedState = {
    farmersProduce: { selling: { modded_berry: 8, cabbage: 8, turnip: 1, note: 'n/a' } },
  };
  const minimalBefore = structuredClone(minimalState);
  const extendedBefore = structuredClone(extendedState);
  const minimal = await mount(produceSalesReportCheat, minimalState);
  const extended = await mount(produceSalesReportCheat, extendedState);
  try {
    assert.equal(minimal.mounted.controls.element('report').textContent, '1. potato: 5 | 2. cabbage: 2');
    assert.equal(
      extended.mounted.controls.element('report').textContent,
      '1. cabbage: 8 | 2. modded_berry: 8 | 3. turnip: 1'
    );
    await minimal.mounted.runAction('refresh');
    await extended.mounted.runtimeTick();
    assert.deepEqual(minimalState, minimalBefore);
    assert.deepEqual(extendedState, extendedBefore);
  } finally {
    await dispose(minimal, extended);
  }
});

test('Vrel integration resets only supported state and disables itself when absent', async () => {
  const supported = await mount(vrelCoinsUsageCheat, { featsBoosts: { pointsUsed: 17 } });
  const absent = await mount(vrelCoinsUsageCheat, {});
  try {
    assert.equal(supported.mounted.applicable, true);
    assert.equal(supported.mounted.controls.element('current').textContent, '17');
    assert.equal((await supported.mounted.runAction('reset')).ok, true);
    assert.equal(supported.adapter.variables.featsBoosts.pointsUsed, 0);

    assert.equal(absent.mounted.applicable, false);
    assert.equal((await absent.mounted.runAction('reset')).kind, 'blocked');
    assert.equal(absent.adapter.variables.featsBoosts, undefined);
  } finally {
    await dispose(supported, absent);
  }
});
