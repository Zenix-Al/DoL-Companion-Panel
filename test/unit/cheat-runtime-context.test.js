import test from 'node:test';
import assert from 'node:assert/strict';

import { scAdapter } from '../../src/platform/sugarcube/adapter.js';
import { createCheatCallbackContext } from '../../src/cheat/runtime/context.js';
import {
  CheatGamePathError,
  CheatRuntimeUnavailableError,
  createGameContext,
} from '../../src/cheat/runtime/game-context.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

test('normalized game context exposes the complete adapter API against SugarCube', () => {
  const env = createDomWithSugarCube({
    passage: 'Town',
    vars: { money: 10, player: { health: 50 } },
  });
  env.window.SugarCube.setup.NPCNameList = ['Robin'];
  const game = createGameContext(scAdapter);

  try {
    assert.equal(game.variables(), env.window.SugarCube.State.variables);
    assert.equal(game.get('player.health'), 50);
    assert.equal(game.has('player.health'), true);
    assert.equal(game.has('player.missing'), false);
    assert.equal(game.set('player.health', 75), 75);
    assert.equal(env.window.SugarCube.State.variables.player.health, 75);
    assert.deepEqual(game.setup('NPCNameList'), ['Robin']);
    assert.equal(game.passage(), 'Town');
  } finally {
    env.cleanup();
  }
});

test('normalized game context reports stable unavailable and missing-parent errors', () => {
  const harness = createFakeGameAdapter({ ready: false, variables: {} });
  const game = createGameContext(harness.game);
  assert.throws(() => game.variables(), CheatRuntimeUnavailableError);

  harness.setReady(true);
  assert.equal(game.get('missing.path'), undefined);
  assert.equal(game.has('missing.path'), false);
  assert.throws(() => game.set('missing.path', 1), CheatGamePathError);
});

test('callback context config facade permits only descriptor-declared schema paths', () => {
  const configHarness = createFakeConfigFacade({
    schemaEntries: [
      { path: 'angel', scope: 'save' },
      { path: 'arrayCheck', scope: 'save' },
    ],
    values: { angel: 1, arrayCheck: false },
  });
  const controller = new AbortController();
  const context = createCheatCallbackContext({
    descriptor: { id: 'test.narrow-config', config: ['angel'] },
    adapter: createFakeGameAdapter().game,
    config: configHarness.config,
    controls: Object.freeze({}),
    signal: controller.signal,
    reason: 'action',
  });

  assert.equal(context.config.get('angel'), 1);
  context.config.set('angel', 2);
  assert.equal(configHarness.values.angel, 2);
  assert.equal(context.config.scope('angel'), 'save');
  assert.throws(() => context.config.get('arrayCheck'), /did not declare config path/);
  assert.throws(() => context.config.get('money'), /did not declare config path/);
});

test('callback context exposes only allowed services and one operation signal', () => {
  const controller = new AbortController();
  const scheduler = {};
  const logger = {};
  const context = createCheatCallbackContext({
    descriptor: { id: 'test.services' },
    adapter: createFakeGameAdapter().game,
    config: createFakeConfigFacade().config,
    controls: Object.freeze({}),
    signal: controller.signal,
    reason: 'mount',
    services: { scheduler, logger, secret: 'not exposed' },
  });

  assert.deepEqual(Object.keys(context.services).sort(), ['diagnostics', 'logger', 'scheduler']);
  assert.equal(context.services.scheduler, scheduler);
  assert.equal(context.signal.aborted, false);
  controller.abort();
  assert.equal(context.signal.aborted, true);
});
