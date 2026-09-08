import test from 'node:test';
import assert from 'node:assert/strict';

import { arousalCheat } from '../../src/cheat/definitions/quick/arousal.cheat.js';
import { enemyStateCheat } from '../../src/cheat/definitions/quick/enemy-state.cheat.js';
import { gameCheatsCheat } from '../../src/cheat/definitions/quick/game-cheats.cheat.js';
import { hygieneCheat } from '../../src/cheat/definitions/quick/hygiene.cheat.js';
import { randomEncountersCheat } from '../../src/cheat/definitions/quick/random-encounters.cheat.js';
import { templeVowCheat } from '../../src/cheat/definitions/quick/temple-vow.cheat.js';
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

test('Quick arousal and enemy-state descriptors preserve legacy mutations', async () => {
  const arousal = await mount(arousalCheat, {
    arousal: 0,
    enemyarousal: 0,
    enemyarousalmax: 800,
  });
  const enemy = await mount(enemyStateCheat, {
    enemyhealth: 20,
    enemyhealthmax: 100,
    enemytrust: 0,
    enemyanger: 50,
  });
  try {
    assert.equal(arousal.mounted.controls.element('current').classList.contains('cp-status-chip'), true);
    arousal.mounted.controls.setValue('percentage', '25');
    await arousal.mounted.runAction('preview');
    assert.equal(arousal.mounted.controls.element('current').textContent, '25%');
    await arousal.mounted.runAction('player');
    await arousal.mounted.runAction('enemy');
    assert.equal(arousal.adapter.variables.arousal, 2500);
    assert.equal(arousal.adapter.variables.enemyarousal, 200);
    await enemy.mounted.runAction('recover');
    assert.deepEqual(enemy.adapter.variables, {
      enemyhealth: 100,
      enemyhealthmax: 100,
      enemytrust: 100,
      enemyanger: 0,
    });
    await enemy.mounted.runAction('ruin');
    assert.equal(enemy.adapter.variables.enemyhealth, 0);
  } finally {
    await dispose(arousal, enemy);
  }
});

test('Quick temple-vow and hygiene descriptors preserve nested game mutations', async () => {
  const vow = await mount(templeVowCheat, { player: { virginity: { temple: false } } });
  const hygiene = await mount(hygieneCheat, {
    player: { bodyliquid: { face: { semen: 4, slime: 3 }, chest: { semen: 2 } } },
    sexStats: { vagina: { sperm: [{ volume: 10 }] } },
  });
  try {
    assert.equal(vow.mounted.controls.element('current').classList.contains('cp-status-chip'), true);
    await vow.mounted.runAction('toggle');
    assert.equal(vow.adapter.variables.player.virginity.temple, true);
    assert.equal(vow.mounted.controls.element('current').textContent, 'Virgin');
    await hygiene.mounted.runAction('clean');
    assert.equal(hygiene.adapter.variables.player.bodyliquid.face.semen, 0);
    await hygiene.mounted.runAction('dirty');
    assert.equal(hygiene.adapter.variables.player.bodyliquid.chest.semen, 100);
    await hygiene.mounted.runAction('urethra');
    assert.deepEqual(hygiene.adapter.variables.sexStats.vagina.sperm, []);
  } finally {
    await dispose(vow, hygiene);
  }
});

test('Quick game-cheat and random-encounter descriptors own state-derived labels and actions', async () => {
  const gameCheats = await mount(gameCheatsCheat, { debug: 0 });
  const encounters = await mount(randomEncountersCheat, { alluremod: 0 });
  try {
    assert.equal(gameCheats.mounted.controls.element('toggle').textContent, 'Enable');
    await gameCheats.mounted.runAction('toggle');
    assert.equal(gameCheats.adapter.variables.debug, 1);
    assert.equal(gameCheats.mounted.controls.element('toggle').textContent, 'Disable');

    const overlay = gameCheats.env.document.createElement('div');
    overlay.id = 'overlayButtons';
    const cheatButton = gameCheats.env.document.createElement('button');
    cheatButton.className = 'link-internal';
    cheatButton.textContent = 'CHEATS';
    let clicks = 0;
    cheatButton.addEventListener('click', () => (clicks += 1));
    overlay.appendChild(cheatButton);
    gameCheats.env.document.body.appendChild(overlay);
    assert.equal((await gameCheats.mounted.runAction('open')).ok, true);
    assert.equal(clicks, 1);

    encounters.mounted.controls.element('toggle').click();
    await encounters.mounted.waitForIdle();
    assert.equal(encounters.adapter.variables.alluremod, 1);
    assert.equal(encounters.mounted.controls.element('toggle').textContent, 'Enabled');
    encounters.mounted.controls.element('toggle').click();
    await encounters.mounted.waitForIdle();
    assert.equal(encounters.adapter.variables.alluremod, 0);
    assert.equal(encounters.mounted.controls.element('toggle').textContent, 'Disabled');
  } finally {
    await dispose(gameCheats, encounters);
  }
});
