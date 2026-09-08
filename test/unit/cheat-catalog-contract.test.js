import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

import { createCheatCatalog } from '../../src/cheat/catalog.js';
import { createOneShotDescriptor } from '../contracts/cheat-contract-cases.js';

function createPlacedDescriptor(id, section, order, overrides = {}) {
  return createOneShotDescriptor({
    id,
    location: { section, group: 'catalog', order },
    ...overrides,
  });
}

test('catalog order, lookup, and section grouping are deterministic', () => {
  const descriptors = [
    createPlacedDescriptor('test.misc-last', 'misc', 20),
    createPlacedDescriptor('test.quick-second', 'quick', 20),
    createPlacedDescriptor('test.stats-first', 'stats', 10),
    createPlacedDescriptor('test.quick-first', 'quick', 10),
  ];
  const catalog = createCheatCatalog(descriptors);

  assert.deepEqual(
    catalog.listCheats().map((descriptor) => descriptor.id),
    ['test.quick-first', 'test.quick-second', 'test.stats-first', 'test.misc-last']
  );
  assert.equal(catalog.getCheat('test.stats-first'), descriptors[2]);
  assert.equal(catalog.getCheat('test.missing'), null);
  assert.deepEqual(
    catalog.listCheatsForSection('quick').map((descriptor) => descriptor.id),
    ['test.quick-first', 'test.quick-second']
  );
  assert.deepEqual(catalog.listCheatsForSection('unknown'), []);

  const secondCatalog = createCheatCatalog([...descriptors].reverse());
  assert.deepEqual(
    secondCatalog.listCheats().map((descriptor) => descriptor.id),
    catalog.listCheats().map((descriptor) => descriptor.id)
  );
});

test('catalog rejects duplicate descriptor ids and placement keys', () => {
  assert.throws(
    () =>
      createCheatCatalog([
        createPlacedDescriptor('test.duplicate', 'quick', 10),
        createPlacedDescriptor('test.duplicate', 'stats', 20),
      ]),
    /Duplicate cheat descriptor id "test\.duplicate"/
  );

  assert.throws(
    () =>
      createCheatCatalog([
        createPlacedDescriptor('test.first', 'quick', 10),
        createPlacedDescriptor('test.second', 'quick', 10),
      ]),
    /Duplicate cheat placement "quick:catalog:10"/
  );
});

test('catalog validates descriptor config references against the central path index', () => {
  const descriptor = createPlacedDescriptor('test.configured', 'quick', 10, {
    config: ['toggles'],
  });

  assert.equal(
    createCheatCatalog([descriptor], { configPaths: ['toggles'] }).getCheat(descriptor.id),
    descriptor
  );
  assert.throws(
    () => createCheatCatalog([descriptor], { configPaths: [] }),
    /references unknown config path "toggles"/
  );
});

test('contract and catalog modules import under Node without DOM or SugarCube globals', () => {
  const moduleUrl = pathToFileURL(resolve('src/cheat/catalog.js')).href;
  const script = `
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.SugarCube;
    const before = new Set(Reflect.ownKeys(globalThis));
    const contract = await import(${JSON.stringify(moduleUrl)});
    if (typeof contract.createCheatCatalog !== 'function') process.exit(2);
    const added = Reflect.ownKeys(globalThis).filter((key) => !before.has(key));
    if (added.length) throw new Error('Unexpected globals: ' + added.join(','));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
