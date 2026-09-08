import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const retiredModules = [
  '../../src/features/actions.js',
  '../../src/features/listeners/action-maps.js',
  '../../src/features/listeners/action-map-methods.js',
  '../../src/features/listeners/action-map-toggle.js',
  '../../src/features/listeners/action-map-ui.js',
  '../../src/features/listeners/action-map-schema.js',
  '../../src/features/cheat/debug-actions.js',
  '../../src/features/cheat/player-actions.js',
  '../../src/features/cheat/pregnancy-actions.js',
  '../../src/features/cheat/toggle-runtime.js',
  '../../src/features/cheat/world-actions.js',
  '../../src/features/cheat/pregnancy-lock-state.js',
  '../../src/core/toggle/engine.js',
  '../../src/core/toggle/state-repository.js',
];

test('legacy global action registries, facades, and shared state are absent', async () => {
  for (const path of retiredModules) {
    await assert.rejects(access(new URL(path, import.meta.url)), { code: 'ENOENT' });
  }
});

test('production app root references only descriptor and application ownership', async () => {
  const files = [
    '../../src/app/observers/game-observers.js',
    '../../src/app/commands/shell-commands.js',
    '../../src/app/cheat-runtime.js',
    '../../src/app/bootstrap.js',
  ];
  const source = (
    await Promise.all(files.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  ).join('\n');

  assert.doesNotMatch(source, /cheatActions|\bmycode\b|action-map-|features\/cheat\//);
});
