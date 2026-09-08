import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheat } from '../../src/cheat/create-cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { npcTraitEditorCheat } from '../../src/cheat/definitions/world/npc-trait-editor.cheat.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

const location = { section: 'misc', group: 'refresh', order: 1 };
const emptyConfig = () => createFakeConfigFacade().config;

test('scalar bindings hydrate, protect active edits, and opt into typed writes', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables: { score: 12 } });
  const descriptor = createCheat({
    id: 'test.scalar-binding',
    location,
    meta: {
      label: 'Scalar binding',
      controls: [
        {
          key: 'score',
          type: 'input',
          binding: { path: 'score', coerce: 'integer', writeOn: 'change' },
        },
      ],
    },
    refresh: ['mount', 'section-open'],
    sync() {},
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });

  try {
    const input = mounted.controls.element('score');
    assert.equal(input.value, '12');
    input.focus();
    input.value = '99';
    input.dispatchEvent(new env.window.Event('input', { bubbles: true }));
    adapter.variables.score = 20;
    await mounted.sectionOpened();
    assert.equal(input.value, '99');
    input.dispatchEvent(new env.window.Event('change', { bubbles: true }));
    assert.equal(adapter.variables.score, 99);
    input.blur();
    adapter.variables.score = 21;
    await mounted.sectionOpened();
    assert.equal(input.value, '21');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('dynamic options receive runtime context and use a stable failure fallback', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({
    variables: { NPCName: [{ description: 'Robin' }, { description: 'Whitney' }] },
  });
  const logs = [];
  let fail = false;
  const descriptor = createCheat({
    id: 'test.dynamic-npc-options',
    location: { ...location, order: 2 },
    meta: {
      label: 'NPC lookup',
      controls: [
        {
          key: 'npc',
          type: 'select',
          fallbackOptions: [{ value: '', label: 'No NPC data' }],
          options({ game, reason }) {
            assert.equal(reason, 'mount');
            if (fail) throw new Error('NPC_SECRET_VALUE');
            return game.get('NPCName').map(({ description }) => description);
          },
        },
      ],
    },
    refresh: ['mount'],
    sync() {},
  });
  const first = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
    services: { logger: { error: (...args) => logs.push(args) } },
  });
  try {
    assert.deepEqual(
      [...first.controls.element('npc').options].map(({ value }) => value),
      ['Robin', 'Whitney']
    );
    first.controls.setValue('npc', 'Whitney');
    adapter.variables.NPCName = [{ description: 'Robin' }];
    await first.requestRefresh('mount');
    assert.equal(first.controls.element('npc').dataset.optionState, 'ready');
    assert.equal(first.controls.element('npc').disabled, false);
    assert.match(first.controls.element('npc').title, /previous selection/i);
    assert.equal(first.root.querySelector('.cp-control-notice'), null);
    fail = true;
    await first.requestRefresh('mount');
    assert.deepEqual(
      [...first.controls.element('npc').options].map(({ value }) => value),
      ['']
    );
    assert.equal(first.controls.element('npc').dataset.optionState, 'unavailable');
    assert.equal(first.controls.element('npc').disabled, true);
    assert.match(first.controls.element('npc').title, /temporarily unavailable/i);
    assert.equal(logs[0][1].cheatId, descriptor.id);
    assert.equal(logs[0][1].trigger, 'mount');
    assert.equal(JSON.stringify(logs[0][1]).includes('NPC_SECRET_VALUE'), false);
  } finally {
    await first.dispose();
    env.cleanup();
  }
});

test('pregnancy-list option source derives only eligible NPCs with a missing-data fallback', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({
    variables: {
      NPCName: [
        { description: 'Pregnant', pregnancy: { timer: 3, timerEnd: 30 } },
        { description: 'Not pregnant' },
      ],
    },
  });
  const descriptor = createCheat({
    id: 'test.pregnancy-list-options',
    location: { ...location, order: 3 },
    meta: {
      label: 'Pregnancy list',
      controls: [
        {
          key: 'npc',
          type: 'select',
          fallbackOptions: [{ value: '', label: 'No pregnancies' }],
          options: ({ game }) =>
            (game.get('NPCName') ?? [])
              .map((npc, index) => ({ npc, index }))
              .filter(({ npc }) => npc.pregnancy)
              .map(({ npc, index }) => ({ value: index, label: npc.description })),
        },
        { key: 'inspect', type: 'button', label: 'Inspect', action: 'inspect' },
      ],
    },
    refresh: ['mount'],
    actions: { inspect() {} },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });
  try {
    assert.deepEqual(
      [...mounted.controls.element('npc').options].map(({ value, textContent }) => [
        value,
        textContent,
      ]),
      [['0', 'Pregnant']]
    );
    adapter.variables.NPCName = [];
    await mounted.requestRefresh('mount');
    assert.equal(mounted.controls.element('npc').options[0].textContent, 'No pregnancies');
    assert.equal(mounted.controls.element('npc').dataset.optionState, 'empty');
    assert.equal(mounted.controls.element('npc').disabled, true);
    assert.equal(mounted.controls.element('inspect').disabled, false);
    assert.equal(mounted.root.querySelector('.cp-control-notice'), null);
    assert.equal(mounted.controls.element('npc').title, 'No pregnancies');
    assert.equal(
      mounted.controls.element('npc').getAttribute('aria-description'),
      'No pregnancies'
    );
    adapter.variables.NPCName = [
      { description: 'Recovered', pregnancy: { timer: 3, timerEnd: 30 } },
    ];
    await mounted.requestRefresh('mount');
    assert.equal(mounted.controls.element('npc').dataset.optionState, 'ready');
    assert.equal(mounted.controls.element('npc').disabled, false);
    assert.equal(mounted.root.querySelector('.cp-control-notice'), null);
    assert.equal(mounted.controls.element('npc').title, '');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('unavailable descriptor presents one row reason and recovers with its lifecycle', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({ variables: {} });
  let enabled = 0;
  let disabled = 0;
  let cleaned = 0;
  const descriptor = createCheat({
    id: 'test.availability-recovery',
    location: { ...location, order: 3.5 },
    meta: {
      label: 'Optional editor',
      controls: [{ key: 'run', type: 'button', label: 'Run', action: 'run' }],
    },
    requiredPaths: ['feature.value'],
    refresh: ['manual'],
    actions: { run() {} },
    onEnable() {
      enabled += 1;
      return () => {
        cleaned += 1;
      };
    },
    onDisable() {
      disabled += 1;
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });
  try {
    const button = mounted.controls.element('run');
    const status = mounted.root.querySelector('.cp-cheat-status');
    const tooltip = mounted.root.querySelector('.cp-availability-tooltip');
    assert.equal(mounted.applicable, false);
    assert.equal(mounted.root.classList.contains('cp-cheat-unavailable'), true);
    assert.equal(status.hidden, true);
    assert.match(status.textContent, /feature\.value/);
    assert.equal(tooltip.hidden, false);
    assert.equal(tooltip.style.display, '');
    assert.match(tooltip.getAttribute('aria-label'), /feature\.value/);
    assert.equal(button.disabled, true);
    assert.equal(button.dataset.disabledReason, undefined);

    adapter.variables.feature = { value: 1 };
    await mounted.requestRefresh('manual');
    assert.equal(mounted.applicable, true);
    assert.equal(status.hidden, true);
    assert.equal(tooltip.hidden, true);
    assert.equal(tooltip.style.display, 'none');
    assert.equal(button.disabled, false);
    assert.equal(enabled, 1);

    delete adapter.variables.feature;
    await mounted.requestRefresh('manual');
    assert.equal(mounted.applicable, false);
    assert.equal(status.hidden, true);
    assert.equal(tooltip.hidden, false);
    assert.equal(button.disabled, true);
    assert.equal(disabled, 1);
    assert.equal(cleaned, 1);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('refresh requests coalesce and hidden sections skip automatic sync', async () => {
  const env = createDomWithSugarCube();
  let syncCalls = 0;
  const descriptor = createCheat({
    id: 'test.refresh-ownership',
    location: { ...location, order: 4 },
    meta: { label: 'Refresh', controls: [{ key: 'value', type: 'text' }] },
    refresh: ['section-open', 'runtime-tick'],
    async sync() {
      syncCalls += 1;
      await Promise.resolve();
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config: emptyConfig(),
  });
  try {
    const first = mounted.sectionOpened();
    const second = mounted.sectionOpened();
    assert.equal(first, second);
    await first;
    assert.equal(syncCalls, 1);
    mounted.root.hidden = true;
    assert.equal(await mounted.runtimeTick(), false);
    assert.equal(syncCalls, 1);
    assert.equal(await mounted.sync('manual'), true);
    assert.equal(syncCalls, 2);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production NPC editor owns dynamic lookup, selection hydration, and mutation locally', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({
    setup: { NPCNameList: ['Robin', 'Whitney'] },
    variables: {
      NPCName: [
        { description: 'Robin', trust: 10 },
        { description: 'Whitney', trust: 20 },
      ],
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor: npcTraitEditorCheat,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });
  try {
    assert.equal(mounted.controls.value('npc'), 'Robin');
    assert.equal(mounted.controls.value('trait'), 'trust');
    assert.equal(mounted.controls.value('value'), '10');
    mounted.controls.setValue('npc', 'Whitney');
    await mounted.runAction('select');
    assert.equal(mounted.controls.value('value'), '20');
    mounted.controls.setValue('value', '31');
    await mounted.runAction('set');
    assert.equal(adapter.variables.NPCName[1].trust, 31);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('production NPC editor matches the live NPCName nam field to setup NPCNameList', async () => {
  const env = createDomWithSugarCube();
  const adapter = createFakeGameAdapter({
    setup: { NPCNameList: ['Robin', 'Whitney'] },
    variables: {
      NPCName: [
        { nam: 'Robin', trust: 10 },
        { nam: 'Whitney', trust: 20 },
      ],
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor: npcTraitEditorCheat,
    document: env.document,
    adapter: adapter.game,
    config: emptyConfig(),
  });
  try {
    assert.deepEqual(
      [...mounted.controls.element('npc').options].map(({ value }) => value),
      ['Robin', 'Whitney']
    );
    assert.equal(mounted.controls.value('value'), '10');
    mounted.controls.setValue('npc', 'Whitney');
    await mounted.runAction('select');
    assert.equal(mounted.controls.value('value'), '20');
    mounted.controls.setValue('value', '100');
    const outcome = await mounted.runAction('set');
    assert.equal(outcome.ok, true);
    assert.equal(adapter.variables.NPCName[1].trust, 100);
    adapter.variables.NPCName[1].trust = 73;
    await mounted.runtimeTick();
    assert.equal(mounted.controls.value('value'), '73');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});
