import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHEAT_CONFIG_CLASSIFICATION,
  CHEAT_CONFIG_DEFAULTS,
  CHEAT_CONFIG_SCHEMA,
  normalizeCheatConfig,
  resetCheatConfig,
  serializeCheatConfig,
} from '../../src/cheat/contract/config-schema.js';
import { configContractFixture, createFullDescriptor } from '../contracts/cheat-contract-cases.js';
import { validateCheatConfigContract } from '../helpers/cheat-contract.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';

test('config contract gives every declared path one typed default and persistence scope', () => {
  const contract = validateCheatConfigContract({
    ...configContractFixture,
    descriptors: [createFullDescriptor()],
  });

  assert.deepEqual(contract.paths, [
    'debug.arrayCheck',
    'toggleBaselines.npcPregnancyChance',
    'toggles',
  ]);
});

const invalidConfigCases = [
  {
    name: 'duplicate schema path',
    defaults: { 'toggles.enabled': {} },
    schemaEntries: [
      { path: 'toggles.enabled', type: 'object', scope: 'save' },
      { path: 'toggles.enabled', type: 'object', scope: 'save' },
    ],
    error: /Duplicate cheat config path "toggles\.enabled"/,
  },
  {
    name: 'missing default',
    defaults: {},
    schemaEntries: [{ path: 'toggles.enabled', type: 'object', scope: 'save' }],
    error: /has no default/,
  },
  {
    name: 'orphan default',
    defaults: { 'toggles.enabled': {}, 'debug.orphan': false },
    schemaEntries: [{ path: 'toggles.enabled', type: 'object', scope: 'save' }],
    error: /default "debug\.orphan" has no schema entry/,
  },
  {
    name: 'invalid default type',
    defaults: { 'toggles.enabled': [] },
    schemaEntries: [{ path: 'toggles.enabled', type: 'object', scope: 'save' }],
    error: /default does not match object/,
  },
  {
    name: 'invalid scope',
    defaults: { 'toggles.enabled': {} },
    schemaEntries: [{ path: 'toggles.enabled', type: 'object', scope: 'global-magic' }],
    error: /has invalid scope/,
  },
  {
    name: 'invalid declared type',
    defaults: { 'toggles.enabled': {} },
    schemaEntries: [{ path: 'toggles.enabled', type: 'map', scope: 'save' }],
    error: /has invalid type/,
  },
  {
    name: 'game variable masquerading as config',
    defaults: { money: 0 },
    schemaEntries: [{ path: 'money', type: 'number', scope: 'save' }],
    error: /Game-state path "money" cannot be declared as CheatPlus config/,
  },
  {
    name: 'unknown descriptor config reference',
    defaults: { 'toggles.enabled': {} },
    schemaEntries: [{ path: 'toggles.enabled', type: 'object', scope: 'save' }],
    descriptors: [{ id: 'test.unknown-config', config: ['game.money'] }],
    error: /references unknown config path "game\.money"/,
  },
];

test('config contract rejects incomplete, duplicated, and game-state definitions', async (t) => {
  for (const contractCase of invalidConfigCases) {
    await t.test(contractCase.name, () => {
      assert.throws(
        () =>
          validateCheatConfigContract({
            defaults: contractCase.defaults,
            schemaEntries: contractCase.schemaEntries,
            descriptors: contractCase.descriptors,
          }),
        contractCase.error
      );
    });
  }
});

test('fake config facade exposes only declared paths and records save-scoped operations', () => {
  const harness = createFakeConfigFacade({
    schemaEntries: configContractFixture.schemaEntries,
    values: { toggles: {} },
  });

  assert.equal(harness.config.has('toggles'), true);
  assert.equal(harness.config.scope('toggles'), 'save');
  assert.deepEqual(harness.config.get('toggles'), {});
  harness.config.set('toggles', { 'player.infinite-arousal': true });
  assert.deepEqual(harness.values.toggles, { 'player.infinite-arousal': true });
  assert.throws(() => harness.config.get('money'), /Unknown CheatPlus config path "money"/);
  assert.deepEqual(
    harness.getCalls().map((entry) => entry.operation),
    ['has', 'scope', 'get', 'set']
  );
});

test('production config schema has one value-only default for every save-backed path', () => {
  assert.deepEqual(
    Object.keys(CHEAT_CONFIG_DEFAULTS).sort(),
    CHEAT_CONFIG_SCHEMA.map((entry) => entry.path).sort()
  );
  assert.deepEqual(
    CHEAT_CONFIG_CLASSIFICATION.saveBackedConfig,
    CHEAT_CONFIG_SCHEMA.map((entry) => entry.path)
  );
  CHEAT_CONFIG_SCHEMA.forEach((entry) => {
    assert.equal(entry.scope, 'save');
    assert.ok(entry.description);
    assert.ok(Array.isArray(entry.migrationAliases));
  });
});

test('config normalization backfills partial saves, repairs invalid values, and clones objects', () => {
  const oldSave = { angel: 12, toggles: { unliarousal: 'unliarousal' }, orgasmCount: 'bad' };
  const normalized = normalizeCheatConfig(oldSave, { baseNpcPregnancyChance: 7 });

  assert.equal(normalized.angel, 12);
  assert.deepEqual(normalized.toggles, { unliarousal: 'unliarousal' });
  assert.equal(normalized.orgasmCount, 0);
  assert.equal(normalized.baseNpcPregnancyChance, 7);
  assert.notEqual(normalized, oldSave);
  assert.notEqual(normalizeCheatConfig({}).toggles, normalizeCheatConfig({}).toggles);
});

test('config normalization is independent for fresh saves and save switching', () => {
  const firstSave = normalizeCheatConfig({ angel: 3, toggles: { purity: 'purity' } });
  const secondSave = normalizeCheatConfig({ angel: 9, toggles: {} });
  firstSave.toggles.virginity = 'virginity';

  assert.equal(firstSave.angel, 3);
  assert.equal(secondSave.angel, 9);
  assert.deepEqual(secondSave.toggles, {});
});

test('config reset and serialization produce canonical schema-only save data', () => {
  const reset = resetCheatConfig({ baseNpcPregnancyChance: 4 });
  const serialized = serializeCheatConfig({ angel: 8, obsoleteKey: true });

  assert.equal(reset.baseNpcPregnancyChance, 4);
  assert.equal(serialized.angel, 8);
  assert.equal(Object.hasOwn(serialized, 'obsoleteKey'), false);
  assert.deepEqual(Object.keys(serialized).sort(), Object.keys(CHEAT_CONFIG_DEFAULTS).sort());
});
