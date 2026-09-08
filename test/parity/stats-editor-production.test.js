import test from 'node:test';
import assert from 'node:assert/strict';

import { enemyStatsCheat } from '../../src/cheat/definitions/player/enemy-stats.cheat.js';
import { examCheat } from '../../src/cheat/definitions/player/exam.cheat.js';
import { fameCheat } from '../../src/cheat/definitions/player/fame.cheat.js';
import { hentaiSkillCheat } from '../../src/cheat/definitions/player/hentai-skill.cheat.js';
import { schoolReputationCheat } from '../../src/cheat/definitions/player/school-reputation.cheat.js';
import { talentCheat } from '../../src/cheat/definitions/player/talent.cheat.js';
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

test('Stats editors hydrate selections and preserve their legacy numeric mutations', async () => {
  const enemy = await mount(enemyStatsCheat, {
    enemyhealth: 80,
    enemytrust: 10,
    enemyanger: 4,
  });
  const fame = await mount(fameCheat, { fame: { exhibitionism: 3, social: 7 } });
  const exam = await mount(examCheat, { science_exam: 41, maths_exam: 12 });
  const school = await mount(schoolReputationCheat, { delinquency: 5, cool: 9 });
  const talent = await mount(talentCheat, { danceskill: 2, athletics: 8 });
  const hentai = await mount(hentaiSkillCheat, { seductionskill: 6, oralskill: 1 });
  try {
    assert.equal(enemy.mounted.controls.value('value'), '80');
    enemy.mounted.controls.setValue('field', 'enemytrust');
    await enemy.mounted.runAction('select');
    assert.equal(enemy.mounted.controls.value('value'), '10');

    const cases = [
      [enemy, 'enemyanger', 'enemyanger'],
      [fame, 'social', 'fame.social'],
      [exam, 'maths_exam', 'maths_exam'],
      [school, 'cool', 'cool'],
      [talent, 'athletics', 'athletics'],
      [hentai, 'oralskill', 'oralskill'],
    ];
    for (const [instance, field, path] of cases) {
      instance.mounted.controls.setValue('field', field);
      await instance.mounted.runAction('select');
      instance.mounted.controls.setValue('value', '99');
      assert.equal((await instance.mounted.runAction('set')).ok, true);
      assert.equal(instance.adapter.game.get(path), 99);
      instance.mounted.controls.setValue('value', 'not-a-number');
      assert.equal((await instance.mounted.runAction('set')).kind, 'validation');
      assert.equal(instance.adapter.game.get(path), 99);
    }
  } finally {
    await dispose(enemy, fame, exam, school, talent, hentai);
  }
});

test('Stats runtime refresh follows live values without overwriting active editor input', async () => {
  const instance = await mount(enemyStatsCheat, {
    enemyhealth: 80,
    enemytrust: 10,
    enemyanger: 4,
  });
  try {
    const input = instance.mounted.controls.element('value');
    input.focus();
    instance.mounted.controls.setValue('value', '123');
    instance.adapter.game.set('enemyhealth', 55);
    await instance.mounted.runtimeTick();
    assert.equal(instance.mounted.controls.value('value'), '123');

    input.blur();
    await instance.mounted.runtimeTick();
    assert.equal(instance.mounted.controls.value('value'), '55');
  } finally {
    await dispose(instance);
  }
});
