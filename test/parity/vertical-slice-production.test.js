import test from 'node:test';
import assert from 'node:assert/strict';

import { cheatCatalog } from '../../src/cheat/index.js';
import { bodySizeCheat } from '../../src/cheat/definitions/player/body-size.cheat.js';
import { moneyCheat } from '../../src/cheat/definitions/player/money.cheat.js';
import { maxHarmonyCheat } from '../../src/cheat/definitions/world/max-harmony.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

const config = () => createFakeConfigFacade().config;

async function mount(descriptor, env, variables) {
  return mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter({ variables }).game,
    config: config(),
  });
}

test('production Money descriptor preserves legacy success and validation behavior', async () => {
  const env = createDomWithSugarCube();
  const variables = { money: 10 };
  const mounted = await mount(moneyCheat, env, variables);
  try {
    mounted.controls.setValue('value', '250');
    assert.equal((await mounted.runAction('set')).ok, true);
    assert.equal(variables.money, 250);
    assert.equal(mounted.controls.value('value'), '250');

    mounted.controls.setValue('value', 'not-a-number');
    const invalid = await mounted.runAction('set');
    assert.equal(invalid.kind, 'validation');
    assert.equal(variables.money, 250);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production Body Size descriptor preserves the recorded mutation and hydrates its dropdown', async () => {
  const env = createDomWithSugarCube();
  const variables = { bodysize: 1 };
  const mounted = await mount(bodySizeCheat, env, variables);
  try {
    assert.equal(mounted.controls.value('size'), 'Small');
    mounted.controls.setValue('size', 'Large');
    assert.equal((await mounted.runAction('set')).ok, true);
    assert.equal(variables.bodysize, 3);
    assert.equal(mounted.controls.value('size'), 'Large');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('missing Body Size path disables only its descriptor controls with a useful reason', async () => {
  const env = createDomWithSugarCube();
  const body = await mount(bodySizeCheat, env, {});
  const money = await mount(moneyCheat, env, { money: 10 });
  try {
    assert.equal(body.applicable, false);
    assert.equal(money.applicable, true);
    assert.equal(body.controls.element('set').disabled, true);
    assert.equal(body.controls.element('set').dataset.disabledReason, undefined);
    assert.equal(body.root.querySelectorAll('.cp-cheat-status:not([hidden])').length, 0);
    assert.match(body.root.querySelector('.cp-cheat-status').textContent, /bodysize/);
    assert.equal(body.root.querySelector('.cp-availability-tooltip').hidden, false);
    assert.match(body.root.querySelector('.cp-availability-tooltip').textContent, /bodysize/);
    assert.equal(money.controls.element('set').disabled, false);
    assert.equal((await body.runAction('set')).kind, 'blocked');
  } finally {
    await body.dispose();
    await money.dispose();
    env.cleanup();
  }
});

test('production one-shot harmony descriptor matches legacy mutation and generated catalog ownership', async () => {
  const env = createDomWithSugarCube();
  const variables = {};
  const mounted = await mount(maxHarmonyCheat, env, variables);
  try {
    assert.equal((await mounted.runAction('harmony')).ok, true);
    assert.equal(variables.wolfpackharmony, 22);
    assert.deepEqual(
      cheatCatalog.listCheats().map((cheat) => cheat.id),
      [
        'quick.player-state',
        'quick.arousal',
        'world.maximum-church-tasks',
        'quick.maximum-stray-tasks',
        'player.infinite-arousal',
        'quick.enemy-state',
        'quick.eden-mushrooms',
        'quick.unlimited-cum',
        'quick.eden-garden',
        'quick.maintain-virginity',
        'quick.temple-vow',
        'quick.eden-spring',
        'quick.maintain-purity',
        'quick.hygiene',
        'quick.eden-timer',
        'quick.everyone-horny',
        'quick.infinite-npc-pregnancy',
        'quick.game-cheats',
        'quick.farm-safety',
        'quick.random-encounters',
        'quick.intense-cum',
        'quick.auto-child-interaction',
        'quick.pregnancy-detection',
        'quick.invincible-angel',
        'quick.maximum-npc-pregnancy-rate',
        'quick.multiple-npc-pregnancies',
        'player.enemy-stats',
        'player.stats',
        'player.money',
        'player.unlimited-spray',
        'player.body-size',
        'player.body-type',
        'player.balls',
        'player.virginity',
        'player.crime',
        'player.parasites',
        'player.characteristics',
        'player.lactation',
        'player.milk',
        'player.cum',
        'player.fame',
        'player.exam',
        'player.school-reputation',
        'player.talent',
        'player.hentai-skill',
        'world.npc-trait-editor',
        'world.max-harmony',
        'world.named-npc-pregnancy',
        'world.stored-npc-pregnancy',
        'world.mc-pregnancy',
        'world.mc-tentacle',
        'world.mc-child-manager',
        'world.mc-abortion',
        'world.named-npc-abortion',
        'world.stored-npc-abortion',
        'world.farm-animal-affinity',
        'world.farm-build-time',
        'world.farm-assault-time',
        'world.produce-sales-report',
        'world.vrel-coins-usage',
        'developer.run-diagnostics',
      ]
    );
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});
