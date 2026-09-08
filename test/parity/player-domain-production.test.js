import test from 'node:test';
import assert from 'node:assert/strict';

import { ballsCheat } from '../../src/cheat/definitions/player/balls.cheat.js';
import { bodyTypeCheat } from '../../src/cheat/definitions/player/body-type.cheat.js';
import { characteristicsCheat } from '../../src/cheat/definitions/player/characteristics.cheat.js';
import { cumCheat } from '../../src/cheat/definitions/player/cum.cheat.js';
import { crimeCheat } from '../../src/cheat/definitions/player/crime.cheat.js';
import { parasitesCheat } from '../../src/cheat/definitions/player/parasites.cheat.js';
import { lactationCheat } from '../../src/cheat/definitions/player/lactation.cheat.js';
import { milkCheat } from '../../src/cheat/definitions/player/milk.cheat.js';
import { playerStatsCheat } from '../../src/cheat/definitions/player/stats.cheat.js';
import { playerStateCheat } from '../../src/cheat/definitions/quick/player-state.cheat.js';
import { unlimitedSprayCheat } from '../../src/cheat/definitions/player/unlimited-spray.cheat.js';
import { virginityCheat } from '../../src/cheat/definitions/player/virginity.cheat.js';
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

const stats = () => ({
  pain: 1,
  arousal: 2,
  tiredness: 3,
  stress: 4,
  trauma: 5,
  control: 6,
  drunk: 7,
  drugged: 8,
  hallucinogen: 9,
});

test('player stat editor and Quick player state remain separate descriptors', async () => {
  const values = stats();
  const instance = await mount(playerStatsCheat, values);
  const quickState = await mount(playerStateCheat, values);
  try {
    assert.equal(instance.mounted.controls.value('value'), '1');
    instance.mounted.controls.setValue('stat', 'stress');
    await instance.mounted.runAction('select');
    assert.equal(instance.mounted.controls.value('value'), '4');
    instance.mounted.controls.setValue('value', '12.5');
    assert.equal((await instance.mounted.runAction('set')).ok, true);
    assert.equal(values.stress, 12.5);
    await quickState.mounted.runAction('recover');
    assert.deepEqual(values, {
      pain: 0,
      arousal: 0,
      tiredness: 0,
      stress: 0,
      trauma: 0,
      control: 1000,
      drunk: 0,
      drugged: 0,
      hallucinogen: 0,
    });
    await quickState.mounted.runAction('ruin');
    assert.equal(values.arousal, 10000);
    assert.equal(values.control, 0);
  } finally {
    await instance.mounted.dispose();
    await quickState.mounted.dispose();
    instance.env.cleanup();
    quickState.env.cleanup();
  }
});

test('player body package preserves spray, body type, balls, and virginity behavior', async () => {
  const spray = await mount(unlimitedSprayCheat, { infinitespray: 0 });
  const body = await mount(bodyTypeCheat, { player: { gender_body: 'm' } });
  const balls = await mount(ballsCheat, { player: { ballsExist: true } });
  const virginityValues = Object.fromEntries(
    ['anal', 'oral', 'penile', 'vaginal', 'temple', 'handholding', 'kiss'].map((key) => [
      key,
      false,
    ])
  );
  const virginity = await mount(virginityCheat, { player: { virginity: virginityValues } });
  try {
    await spray.mounted.runAction('toggle');
    assert.equal(spray.adapter.variables.infinitespray, 1);
    assert.equal(spray.mounted.controls.element('toggle').textContent, 'Unset');
    assert.equal(body.mounted.controls.value('type'), 'Masculine');
    body.mounted.controls.setValue('type', 'Feminine');
    await body.mounted.runAction('set');
    assert.equal(body.adapter.variables.player.gender_body, 'f');
    await balls.mounted.runAction('toggle');
    assert.equal(balls.adapter.variables.player.ballsExist, false);
    virginity.mounted.controls.setValue('type', 'temple');
    await virginity.mounted.runAction('restore');
    assert.equal(
      virginity.mounted.controls.element('current').classList.contains('cp-status-chip'),
      true
    );
    assert.equal(virginityValues.temple, true);
    await virginity.mounted.runAction('pure');
    assert.equal(Object.values(virginityValues).every(Boolean), true);
  } finally {
    for (const instance of [spray, body, balls, virginity]) {
      await instance.mounted.dispose();
      instance.env.cleanup();
    }
  }
});

test('crime descriptor preserves asymmetric legacy reduction and increase mutations', async () => {
  const crime = {
    theft: { current: 50, count: 1, countHistory: 2, history: 3 },
    assault: { current: 150, count: 4, countHistory: 5, history: 6 },
    events: {},
  };
  const instance = await mount(crimeCheat, { crime });
  try {
    assert.equal(instance.mounted.controls.element('current').classList.contains('cp-status-chip'), true);
    await instance.mounted.runAction('reduce');
    assert.deepEqual(crime.theft, { current: 50, count: 50, countHistory: 50, history: 50 });
    assert.deepEqual(crime.assault, { current: 50, count: 50, countHistory: 50, history: 50 });
    await instance.mounted.runAction('increase');
    assert.equal(crime.theft.current, 100);
    assert.equal(crime.theft.count, 50);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('characteristics, lactation, milk, cum, and parasites use independent rows', async () => {
  const characteristicValues = Object.fromEntries(
    [
      'beauty',
      'purity',
      'physique',
      'willpower',
      'awareness',
      'promiscuity',
      'exhibitionism',
      'deviancy',
      'grace',
      'submissive',
      'masochism',
      'sadism',
    ].map((key) => [key, 1])
  );
  const characteristics = await mount(characteristicsCheat, {
    ...characteristicValues,
  });
  const lactation = await mount(lactationCheat, { lactating: 0 });
  const milk = await mount(milkCheat, { milk_volume: 10, milk_amount: 0 });
  const cum = await mount(cumCheat, { semen_volume: 20, semen_amount: 0 });
  const parasites = await mount(parasitesCheat, {
    parasite: { urchin: [], slime: [], maggot: [], nipples: [] },
  });
  try {
    characteristics.mounted.controls.setValue('characteristicValue', '9');
    await characteristics.mounted.runAction('setCharacteristic');
    assert.equal(characteristics.adapter.variables.beauty, 9);
    await lactation.mounted.runAction('toggle');
    assert.equal(lactation.adapter.variables.lactating, 1);
    milk.mounted.controls.setValue('volume', '30');
    await milk.mounted.runAction('set');
    await milk.mounted.runAction('refill');
    assert.equal(milk.adapter.variables.milk_amount, 30);
    cum.mounted.controls.setValue('volume', '40');
    await cum.mounted.runAction('set');
    await cum.mounted.runAction('refill');
    assert.equal(cum.adapter.variables.semen_amount, 40);
    parasites.mounted.controls.setValue('parasite', 'urchin');
    parasites.mounted.controls.setValue('body', 'nipples');
    await parasites.mounted.runAction('infect');
    assert.deepEqual(parasites.adapter.variables.parasite.urchin, ['nipples']);
    assert.equal(parasites.adapter.variables.parasite.nipples.name, 'urchin');
    await parasites.mounted.runAction('remove');
    assert.deepEqual(parasites.adapter.variables.parasite.urchin, []);
  } finally {
    await characteristics.mounted.dispose();
    for (const instance of [lactation, milk, cum, parasites]) await instance.mounted.dispose();
    characteristics.env.cleanup();
    for (const instance of [lactation, milk, cum, parasites]) instance.env.cleanup();
  }
});
