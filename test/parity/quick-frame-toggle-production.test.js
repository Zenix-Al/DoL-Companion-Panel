import test from 'node:test';
import assert from 'node:assert/strict';

import { autoChildInteractionCheat } from '../../src/cheat/definitions/quick/auto-child-interaction.cheat.js';
import { everyoneHornyCheat } from '../../src/cheat/definitions/quick/everyone-horny.cheat.js';
import { farmSafetyCheat } from '../../src/cheat/definitions/quick/farm-safety.cheat.js';
import { intenseCumCheat } from '../../src/cheat/definitions/quick/intense-cum.cheat.js';
import { invincibleAngelCheat } from '../../src/cheat/definitions/quick/invincible-angel.cheat.js';
import { maintainPurityCheat } from '../../src/cheat/definitions/quick/maintain-purity.cheat.js';
import { maintainVirginityCheat } from '../../src/cheat/definitions/quick/maintain-virginity.cheat.js';
import { maximumNpcPregnancyRateCheat } from '../../src/cheat/definitions/quick/maximum-npc-pregnancy-rate.cheat.js';
import { multipleNpcPregnanciesCheat } from '../../src/cheat/definitions/quick/multiple-npc-pregnancies.cheat.js';
import { pregnancyDetectionCheat } from '../../src/cheat/definitions/quick/pregnancy-detection.cheat.js';
import { unlimitedCumCheat } from '../../src/cheat/definitions/quick/unlimited-cum.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createCheatToggleRuntime } from '../../src/cheat/runtime/toggle-runtime.js';
import { CHEAT_CONFIG_SCHEMA } from '../../src/cheat/contract/config-schema.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';
import { createMemoryToggleStore } from '../helpers/memory-toggle-store.js';

const descriptors = [
  unlimitedCumCheat,
  maintainVirginityCheat,
  maintainPurityCheat,
  everyoneHornyCheat,
  farmSafetyCheat,
  intenseCumCheat,
  invincibleAngelCheat,
  autoChildInteractionCheat,
  pregnancyDetectionCheat,
  maximumNpcPregnancyRateCheat,
  multipleNpcPregnanciesCheat,
];

const persistedToggles = Object.fromEntries(descriptors.map((descriptor) => [descriptor.id, true]));

test('Quick frame-toggle package restores stable IDs, preserves effects, and tears down', async () => {
  const env = createDomWithSugarCube();
  const child = { localVariables: { event: true, interactions: 1, interactionsTotal: 2 } };
  const variables = {
    semen_amount: 1,
    semen_volume: 10,
    orgasmcount: 3,
    player: { virginity: { penile: false, vaginal: false } },
    purity: 1,
    NPCName: [
      { nam: 'Robin', lust: 1, pregnancy: { fetus: [{ mother: 'Robin' }] } },
      { nam: 'Ivory Wraith', lust: 2, pregnancy: { fetus: [] } },
    ],
    farm: { aggro: 10 },
    orgasmcurrent: 1,
    orgasmdown: 0,
    arousal: 321,
    penisstate: 1,
    vaginastate: 0,
    angel: 12,
    angelbuild: 1,
    demon: 0,
    fallenangel: 0,
    children: { child_0: child },
    storedNPCs: {},
    sexStats: {
      vagina: { pregnancy: { fetus: [] } },
      anus: { pregnancy: { fetus: [] } },
    },
    timeStamp: 86400,
    baseNpcPregnancyChance: 6,
    NPCList: [
      { pregnancyAvoidance: 4, pregnancy: 1 },
      { pregnancyAvoidance: 0, pregnancy: 0 },
    ],
  };
  const config = createFakeConfigFacade({
    schemaEntries: CHEAT_CONFIG_SCHEMA,
    values: {
      storedNPCs: {},
      storedNPCsDate: 0,
      storedNPCsPriority: 0,
      orgasmCount: 0,
      unlicumMode: false,
      angel: 0,
      angelMode: true,
      baseNpcPregnancyChance: null,
    },
  });
  const scheduler = createFakeCheatScheduler();
  const store = createMemoryToggleStore(persistedToggles);
  const runtime = createCheatToggleRuntime({ scheduler, store, logger: { error() {} } });
  const adapter = createFakeGameAdapter({ variables });
  const notices = [];
  const mounted = [];

  try {
    for (const descriptor of descriptors) {
      mounted.push(
        await mountCheatDescriptor({
          descriptor,
          document: env.document,
          adapter: adapter.game,
          config: config.config,
          feedback: { info: (message) => notices.push(message) },
          services: { toggle: runtime },
        })
      );
    }

    assert.deepEqual(new Set(scheduler.list()), new Set(descriptors.map(({ id }) => id)));
    assert.deepEqual(Object.keys(store.snapshot()).sort(), descriptors.map(({ id }) => id).sort());
    assert.equal(variables.semen_amount, 10);
    assert.equal(variables.orgasmcount, 0);
    assert.equal(variables.player.virginity.penile, true);
    assert.equal(variables.player.virginity.vaginal, true);
    assert.equal(variables.purity, 1000);
    assert.equal(variables.NPCName[0].lust, 100);
    assert.equal(variables.NPCName[1].lust, 2);
    assert.equal(variables.farm.aggro, 0);
    assert.equal(child.localVariables.event, false);
    assert.equal(child.localVariables.interactions, 2);
    assert.equal(variables.angel, 0);
    assert.equal(variables.angelbuild, 100);
    assert.equal(variables.baseNpcPregnancyChance, 19);
    assert.equal(variables.NPCList[0].pregnancyAvoidance, 0);
    assert.equal(variables.NPCList[0].pregnancy, 0);
    assert.equal(config.values.baseNpcPregnancyChance, 6);
    assert.equal(config.values.unlicumMode, true);

    variables.storedNPCs.pregnancy_0 = {
      pregnancy: { timer: 0, timerEnd: 20, fetus: [{ mother: 'New NPC' }] },
    };
    await scheduler.runFrame(250);
    assert.equal(notices.includes('An NPC became pregnant.'), true);

    const purityInstance = mounted.find(
      ({ descriptor }) => descriptor.id === maintainPurityCheat.id
    );
    const purityControl = purityInstance.controls.element('enabled');
    purityControl.checked = false;
    purityControl.dispatchEvent(new env.window.Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(scheduler.has(maintainPurityCheat.id), false);

    for (const instance of mounted.splice(0)) await instance.dispose();
    assert.deepEqual(scheduler.list(), []);
    assert.equal(Object.keys(store.snapshot()).length, descriptors.length - 1);
  } finally {
    for (const instance of mounted) await instance.dispose();
    env.cleanup();
  }
});
