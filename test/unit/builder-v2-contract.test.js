import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILDER_LIFECYCLE_METHODS,
  createBuilderLifecycleHandle,
  isBuilderHealth,
} from '../../src/cheat/runtime/builder-contract.js';
import { compileCatalogPlan } from '../../src/cheat/runtime/catalog-plan.js';

test('Builder v2 contract imports without DOM or SugarCube and validates lifecycle handles', () => {
  const implementation = Object.fromEntries(BUILDER_LIFECYCLE_METHODS.map((name) => [name, () => name]));
  const handle = createBuilderLifecycleHandle(implementation);
  assert.equal(Object.isFrozen(handle), true);
  assert.deepEqual(BUILDER_LIFECYCLE_METHODS.map((name) => handle[name]()), BUILDER_LIFECYCLE_METHODS);
  assert.throws(() => createBuilderLifecycleHandle({}), /requires compile/);
});

test('catalog plan compiles without DOM and health has a stable contract', () => {
  const descriptor = { id: 'test.contract', location: { section: 'quick' } };
  const plan = compileCatalogPlan({ listCheats: () => [descriptor] });
  assert.deepEqual(plan.listSection('quick'), [descriptor]);
  assert.deepEqual(plan.listSection('stats'), []);
  assert.equal(Object.isFrozen(plan.descriptors), true);
  assert.equal(
    isBuilderHealth({ total: 1, mounted: 0, failed: 0, mountedSections: [], failures: [] }),
    true
  );
  assert.equal(isBuilderHealth({ total: 1 }), false);
});
