import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('production observer and settings safety have no legacy toggle runtime dependency', async () => {
  const [listeners, settingsSafety, storage, bootstrap] = await Promise.all([
    source('../../src/app/observers/game-observers.js'),
    source('../../src/app/settings-safety.js'),
    source('../../src/platform/sugarcube/config-storage.js'),
    source('../../src/app/bootstrap.js'),
  ]);
  const productionSources = [listeners, settingsSafety, storage, bootstrap].join('\n');

  assert.doesNotMatch(productionSources, /cheatActions|reactivateToggles|getBundles/);
  assert.doesNotMatch(productionSources, /allNPCInstaPregnant/);
  assert.match(listeners, /getActiveToggleObserver/);
  assert.match(settingsSafety, /quick\.maximum-npc-pregnancy-rate/);
});
