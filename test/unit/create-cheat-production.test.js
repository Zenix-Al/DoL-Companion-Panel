import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheat } from '../../src/cheat/create-cheat.js';
import {
  createFullDescriptor,
  createOneShotDescriptor,
} from '../contracts/cheat-contract-cases.js';

test('production createCheat validates and freezes definition-owned data', () => {
  const definition = createFullDescriptor();
  const action = definition.actions.run;
  const cheat = createCheat(definition);

  assert.equal(cheat, definition);
  assert.equal(cheat.actions.run, action);
  assert.ok(Object.isFrozen(cheat));
  assert.ok(Object.isFrozen(cheat.meta.controls));
  assert.ok(Object.isFrozen(cheat.meta.controls[0]));
  assert.throws(() => cheat.meta.controls.push({ key: 'late', type: 'text' }));
});

test('production createCheat has no DOM, scheduler, storage, or runtime side effects', () => {
  const before = new Set(Reflect.ownKeys(globalThis));
  const cheat = createCheat(createOneShotDescriptor({ id: 'test.pure-factory' }));
  const added = Reflect.ownKeys(globalThis).filter((key) => !before.has(key));

  assert.equal(cheat.id, 'test.pure-factory');
  assert.deepEqual(added, []);
  assert.equal(Reflect.ownKeys(cheat).includes('runtime'), false);
});
