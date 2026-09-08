import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheatCatalog } from '../../src/cheat/catalog.js';
import { createCheat } from '../../src/cheat/create-cheat.js';
import { createCheatRuntimeBuilder } from '../../src/cheat/runtime/builder.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

function descriptor(id, order) {
  return createCheat({
    id,
    location: { section: 'quick', group: 'state', order },
    meta: {
      label: id,
      controls: [{ key: 'run', type: 'button', label: 'Run', action: 'run' }],
    },
    actions: {
      run({ game }) {
        game.set('counter', (game.get('counter') ?? 0) + 1);
        return { ok: true };
      },
    },
  });
}

test('catalog builder compiles once and owns direct mount, remount, health, and teardown', async () => {
  const env = createDomWithSugarCube();
  const container = env.document.createElement('section');
  env.document.body.appendChild(container);
  const adapter = createFakeGameAdapter({ variables: { counter: 0 } });
  const catalog = createCheatCatalog([
    descriptor('test.builder-second', 20),
    descriptor('test.builder-first', 10),
  ]);
  const builder = createCheatRuntimeBuilder({
    catalog,
    adapter: adapter.game,
    config: createFakeConfigFacade().config,
    document: env.document,
  });
  const shellRows = [
    {
      key: 'state',
      role: 'heading',
      groups: ['state'],
      controls: [{ type: 'heading', text: 'State' }],
    },
  ];

  try {
    assert.equal(builder.compile(), true);
    assert.equal(builder.compile(), false);

    await builder.mountSection('quick', container, shellRows);
    assert.deepEqual(
      [...container.querySelectorAll('[data-cheat-id]')].map(({ dataset }) => dataset.cheatId),
      ['test.builder-first', 'test.builder-second']
    );
    assert.deepEqual(builder.health(), {
      total: 2,
      applicable: 2,
      mounted: 2,
      disabled: 0,
      failed: 0,
      mountedSections: ['quick'],
      failures: [],
    });

    const firstRoot = builder.getMounted('test.builder-first').root;
    builder.getMounted('test.builder-first').controls.element('run').click();
    await builder.getMounted('test.builder-first').waitForIdle();
    assert.equal(adapter.variables.counter, 1);

    await builder.mountSection('quick', container, shellRows);
    assert.equal(firstRoot.isConnected, false);
    assert.equal(container.querySelectorAll('[data-cheat-id]').length, 2);

    assert.equal(await builder.teardown(), true);
    assert.equal(container.children.length, 0);
    assert.equal(builder.health().mounted, 0);
    assert.equal(await builder.teardown(), false);

    builder.configureSections({ quick: { container, rows: shellRows } });
    assert.equal(await builder.sectionOpened('quick'), true);
    assert.equal(container.querySelectorAll('[data-cheat-id]').length, 2);
  } finally {
    await builder.teardown();
    env.cleanup();
  }
});

test('builder lazily mounts only a section when it is first opened', async () => {
  const env = createDomWithSugarCube();
  const quick = env.document.createElement('section');
  const stats = env.document.createElement('section');
  env.document.body.append(quick, stats);
  const quickCheat = descriptor('test.lazy-quick', 1);
  const statsCheat = createCheat({
    ...descriptor('test.lazy-stats', 1),
    location: { section: 'stats', group: 'player', order: 1 },
  });
  const builder = createCheatRuntimeBuilder({
    catalog: createCheatCatalog([quickCheat, statsCheat]),
    adapter: createFakeGameAdapter({ variables: {} }).game,
    config: createFakeConfigFacade().config,
    document: env.document,
  });

  try {
    builder.configureSections({ quick: { container: quick }, stats: { container: stats } });
    assert.equal(builder.health().mounted, 0);
    await builder.sectionOpened('quick');
    assert.equal(quick.querySelectorAll('[data-cheat-id]').length, 1);
    assert.equal(stats.children.length, 0);
    assert.deepEqual(builder.health().mountedSections, ['quick']);
    await builder.sectionOpened('stats');
    assert.equal(stats.querySelectorAll('[data-cheat-id]').length, 1);
    assert.deepEqual(builder.health().mountedSections, ['quick', 'stats']);
  } finally {
    await builder.teardown();
    env.cleanup();
  }
});

test('builder isolates mount failures and reports typed failure details', async () => {
  const env = createDomWithSugarCube();
  const container = env.document.createElement('section');
  env.document.body.appendChild(container);
  const errors = [];
  const builder = createCheatRuntimeBuilder({
    catalog: createCheatCatalog([descriptor('test.failure-one', 1), descriptor('test.failure-two', 2)]),
    adapter: createFakeGameAdapter({ variables: {} }).game,
    config: createFakeConfigFacade().config,
    document: env.document,
    logger: { error: (_message, detail) => errors.push(detail) },
    mountDescriptor: async (options) => {
      if (options.descriptor.id === 'test.failure-one') throw new TypeError('broken fixture');
      const root = options.document.createElement('section');
      options.parent.appendChild(root);
      return {
        root,
        applicable: true,
        sectionOpened: async () => true,
        runtimeTick: async () => true,
        dispose: async () => root.remove(),
      };
    },
  });

  try {
    await builder.mountSection('quick', container);
    const health = builder.health();
    assert.equal(health.mounted, 1);
    assert.equal(health.failed, 1);
    assert.deepEqual(health.failures, [
      {
        cheatId: 'test.failure-one',
        phase: 'mount',
        code: 'CHEAT_MOUNT_FAILED',
        errorType: 'TypeError',
        message: 'broken fixture',
      },
    ]);
    assert.deepEqual(errors, health.failures);
  } finally {
    await builder.teardown();
    env.cleanup();
  }
});

test('builder accepts injected renderer, refresh coordinator, timer, and clock', async () => {
  const env = createDomWithSugarCube();
  const calls = [];
  const coordinator = {
    register: () => calls.push('register'),
    unregister: () => calls.push('unregister'),
    setActiveSection: () => calls.push('active'),
    dispose: () => calls.push('dispose'),
  };
  const timerApi = {};
  const clock = { now: () => 42 };
  const scheduler = { id: 'injected-scheduler' };
  const builder = createCheatRuntimeBuilder({
    catalog: createCheatCatalog([descriptor('test.injected-builder', 1)]),
    adapter: createFakeGameAdapter({ variables: {} }).game,
    config: createFakeConfigFacade().config,
    document: env.document,
    timerApi,
    clock,
    scheduler,
    mountDescriptor: async ({ document, parent, services }) => {
      assert.equal(services.scheduler, scheduler);
      assert.equal(services.clock, clock);
      const root = document.createElement('section');
      parent.appendChild(root);
      return {
        root,
        applicable: true,
        sectionOpened: async () => true,
        runtimeTick: async () => true,
        dispose: async () => root.remove(),
      };
    },
    createRefreshCoordinator(options) {
      assert.equal(options.timerApi, timerApi);
      assert.equal(options.clock, clock);
      return coordinator;
    },
  });
  const container = env.document.createElement('section');
  env.document.body.appendChild(container);

  try {
    builder.configureSections({ quick: { container } });
    await builder.sectionOpened('quick');
    assert.deepEqual(calls, ['unregister', 'active']);
  } finally {
    await builder.teardown();
    env.cleanup();
  }
  assert.deepEqual(calls, ['unregister', 'active', 'dispose']);
});

test('teardown invalidates an in-flight lazy mount and removes its late instance', async () => {
  const env = createDomWithSugarCube();
  const container = env.document.createElement('section');
  env.document.body.appendChild(container);
  let release;
  let started;
  const didStart = new Promise((resolve) => {
    started = resolve;
  });
  const builder = createCheatRuntimeBuilder({
    catalog: createCheatCatalog([descriptor('test.cancel-mount', 1)]),
    adapter: createFakeGameAdapter({ variables: {} }).game,
    config: createFakeConfigFacade().config,
    document: env.document,
    mountDescriptor: async ({ document, parent }) => {
      started();
      await new Promise((resolve) => {
        release = resolve;
      });
      const root = document.createElement('section');
      parent.appendChild(root);
      return {
        root,
        applicable: true,
        sectionOpened: async () => true,
        runtimeTick: async () => true,
        dispose: async () => root.remove(),
      };
    },
  });
  builder.configureSections({ quick: { container } });
  const opening = builder.sectionOpened('quick');
  await didStart;
  assert.equal(await builder.teardown(), false);
  release();
  assert.equal(await opening, false);
  assert.equal(container.children.length, 0);
  assert.deepEqual(builder.health().mountedSections, []);
  env.cleanup();
});
