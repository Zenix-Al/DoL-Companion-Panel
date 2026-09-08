import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheatDescriptorHarness } from '../helpers/cheat-descriptor-harness.js';
import { runCheatParity } from '../helpers/cheat-parity-harness.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { applyLegacyInfiniteArousal } from '../fixtures/legacy-toggle-effects.js';
import { createFakeCheatScheduler } from '../helpers/fake-cheat-scheduler.js';
import { createFakeRuntimeEngine } from '../helpers/fake-game-adapter.js';

function observation({ state, outcome, controls, refresh = [], applicable = true, cleanup }) {
  return { state, outcome, controls, refresh, applicable, cleanup };
}

async function runLegacyMoney({ initialState, inputValue }) {
  const state = structuredClone(initialState);
  const value = Number.parseInt(inputValue, 10);
  if (!Number.isNaN(value)) state.money = value;
  return observation({
    state: { money: state.money },
    outcome: { ok: !Number.isNaN(value) },
    controls: { value: inputValue },
    applicable: Object.prototype.hasOwnProperty.call(state, 'money'),
    cleanup: { disposed: true, ownedResources: 0 },
  });
}

async function runDescriptorMoney({ initialState, inputValue }) {
  const env = createDomWithSugarCube();
  const runtimeHarness = createFakeRuntimeEngine({ variables: initialState });
  const descriptor = {
    id: 'player.money',
    meta: {
      controls: [
        { key: 'value', type: 'input' },
        { key: 'set', type: 'button', action: 'set' },
      ],
    },
    actions: {
      set({ game, controls }) {
        const value = controls.number('value');
        if (!Number.isFinite(value)) return { ok: false };
        game.set('money', value);
        return { ok: true };
      },
    },
    isApplicable: ({ game }) => game.has('money'),
  };
  const harness = createCheatDescriptorHarness({
    descriptor,
    document: env.document,
    runtimeHarness,
  });

  try {
    await harness.mount();
    harness.controls.setValue('value', inputValue);
    const outcome = await harness.runAction('set');
    const applicable = descriptor.isApplicable({ game: runtimeHarness.game });
    const controls = { value: harness.controls.value('value') };
    await harness.dispose();
    return observation({
      state: { money: runtimeHarness.variables.money },
      outcome: { ok: outcome.ok },
      controls,
      refresh: harness.getSnapshot().refreshRequests,
      applicable,
      cleanup: { disposed: true, ownedResources: harness.scheduler.list().length },
    });
  } finally {
    await harness.dispose();
    env.cleanup();
  }
}

test('working Money descriptor matches legacy success behavior from equivalent state', async () => {
  const result = await runCheatParity({
    id: 'moneyset',
    status: 'working',
    initialState: { money: 10 },
    runLegacy: ({ initialState }) => runLegacyMoney({ initialState, inputValue: '250' }),
    runDescriptor: ({ initialState }) => runDescriptorMoney({ initialState, inputValue: '250' }),
  });

  assert.equal(result.mode, 'parity');
  assert.deepEqual(result.descriptor.state, { money: 250 });
  assert.deepEqual(result.descriptor.controls, { value: '250' });
});

test('working Money descriptor matches legacy invalid-input behavior without mutation', async () => {
  const result = await runCheatParity({
    id: 'moneyset.invalid-number',
    status: 'working',
    initialState: { money: 10 },
    runLegacy: ({ initialState }) => runLegacyMoney({ initialState, inputValue: 'not-a-number' }),
    runDescriptor: ({ initialState }) =>
      runDescriptorMoney({ initialState, inputValue: 'not-a-number' }),
  });

  assert.equal(result.mode, 'parity');
  assert.deepEqual(result.descriptor.state, { money: 10 });
  assert.deepEqual(result.descriptor.outcome, { ok: false });
});

async function runLegacyInfiniteArousal({ initialState }) {
  const env = createDomWithSugarCube({ vars: initialState });
  try {
    applyLegacyInfiniteArousal(env.variables);
    env.variables.arousal = 40;
    applyLegacyInfiniteArousal(env.variables);
    return observation({
      state: { arousal: env.variables.arousal },
      outcome: { ok: true, executions: 2 },
      controls: { enabled: true },
      applicable: Object.prototype.hasOwnProperty.call(env.variables, 'arousal'),
      cleanup: { disposed: true, ownedResources: 0 },
    });
  } finally {
    env.cleanup();
  }
}

async function runDescriptorInfiniteArousal({ initialState }) {
  const env = createDomWithSugarCube();
  const runtimeHarness = createFakeRuntimeEngine({ variables: initialState });
  const scheduler = createFakeCheatScheduler();
  let executions = 0;
  const descriptor = {
    id: 'player.infinite-arousal',
    meta: { controls: [{ key: 'enabled', type: 'toggle', action: 'toggle' }] },
    toggle: { cadence: 'frame', cooldownMs: 0, runOnActivate: true },
    effect({ game }) {
      executions += 1;
      game.set('arousal', 10000);
    },
    isApplicable: ({ game }) => game.has('arousal'),
  };
  const harness = createCheatDescriptorHarness({
    descriptor,
    document: env.document,
    runtimeHarness,
    scheduler,
  });

  try {
    await harness.mount();
    await harness.setToggleEnabled(true);
    runtimeHarness.variables.arousal = 40;
    await scheduler.runFrame(100);
    const applicable = descriptor.isApplicable({ game: runtimeHarness.game });
    const controls = { enabled: harness.controls.checked('enabled') };
    await harness.setToggleEnabled(false);
    await harness.dispose();
    return observation({
      state: { arousal: runtimeHarness.variables.arousal },
      outcome: { ok: true, executions },
      controls,
      refresh: harness.getSnapshot().refreshRequests,
      applicable,
      cleanup: { disposed: true, ownedResources: scheduler.list().length },
    });
  } finally {
    await harness.dispose();
    env.cleanup();
  }
}

test('working infinite-arousal descriptor matches repeated legacy effect behavior', async () => {
  const result = await runCheatParity({
    id: 'unliarousal',
    status: 'working',
    initialState: { arousal: 25 },
    runLegacy: runLegacyInfiniteArousal,
    runDescriptor: runDescriptorInfiniteArousal,
  });

  assert.equal(result.mode, 'parity');
  assert.deepEqual(result.descriptor.state, { arousal: 10000 });
  assert.deepEqual(result.descriptor.cleanup, { disposed: true, ownedResources: 0 });
});

test('known-broken parity compares the descriptor with documented intent, not broken output', async () => {
  const broken = observation({
    state: { exportedSlots: 0 },
    outcome: { ok: false },
    controls: { status: 'No handler' },
    applicable: true,
    cleanup: { disposed: true, ownedResources: 0 },
  });
  const intended = observation({
    state: { exportedSlots: 2 },
    outcome: { ok: true },
    controls: { status: 'Exported 2 saves' },
    applicable: true,
    cleanup: { disposed: true, ownedResources: 0 },
  });
  const result = await runCheatParity({
    id: 'synthetic.known-broken-export',
    status: 'known-broken',
    initialState: { exportedSlots: 0 },
    runLegacy: async () => broken,
    runDescriptor: async () => intended,
    intended,
  });

  assert.equal(result.mode, 'intent-correction');
  assert.deepEqual(result.descriptor, intended);
  assert.notDeepEqual(result.legacy, intended);
});

test('parity harness rejects unexplained divergence and incomplete observations', async () => {
  const complete = observation({
    state: { value: 1 },
    outcome: { ok: true },
    controls: {},
    applicable: true,
    cleanup: { disposed: true, ownedResources: 0 },
  });
  await assert.rejects(
    runCheatParity({
      id: 'test.divergent',
      status: 'working',
      initialState: {},
      runLegacy: async () => complete,
      runDescriptor: async () => ({ ...complete, state: { value: 2 } }),
    }),
    /failed legacy parity comparison/
  );
  await assert.rejects(
    runCheatParity({
      id: 'test.incomplete',
      status: 'working',
      initialState: {},
      runLegacy: async () => complete,
      runDescriptor: async () => ({ state: {} }),
    }),
    /missing "outcome"/
  );
});
