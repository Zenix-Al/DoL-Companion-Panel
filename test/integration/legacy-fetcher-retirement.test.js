import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

const retired = [
  '../../src/features/fetchers/index.js',
  '../../src/features/fetchers/core-updates.js',
  '../../src/features/fetchers/misc-updates.js',
  '../../src/features/fetchers/offspring-updates.js',
  '../../src/features/fetchers/pregnancy-updates.js',
  '../../src/ui/helpers/hydrate-utils.js',
];

test('legacy fetcher facade, hydrators, and exclusive UI helpers are absent', async () => {
  for (const path of retired) {
    await assert.rejects(access(new URL(path, import.meta.url)), { code: 'ENOENT' });
  }
});

test('retired SugarCube variable-search implementation remains absent', async () => {
  for (const path of ['../../src/search/actions.js', '../../src/search/value-tree.js']) {
    await assert.rejects(access(new URL(path, import.meta.url)), { code: 'ENOENT' });
  }
});
