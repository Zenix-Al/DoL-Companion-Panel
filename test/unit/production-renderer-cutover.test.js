import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const bootstrapUrl = new URL('../../src/app/cheat-runtime.js', import.meta.url);
const builderUrl = new URL('../../src/cheat/runtime/builder.js', import.meta.url);
const applicationBootstrapUrl = new URL('../../src/app/bootstrap.js', import.meta.url);

test('production bootstrap has no legacy metadata renderer or registry dependency', async () => {
  const source = await readFile(bootstrapUrl, 'utf8');
  for (const forbidden of [
    'metadata-renderer',
    'createQuickMetadata',
    'createStatMetadata',
    'createMiscMetadata',
    'renderRegistry',
    'renderLegacy',
  ]) {
    assert.equal(source.includes(forbidden), false, `production bootstrap contains ${forbidden}`);
  }
  assert.match(source, /createSectionShells/);
  assert.match(source, /builder\.configureSections/);
  assert.match(source, /builder\.sectionOpened\('quick'\)/);
});

test('production builder mounts descriptors directly without hybrid slots', async () => {
  const source = await readFile(builderUrl, 'utf8');
  const productionBody = source.slice(source.indexOf('export function createCheatRuntimeBuilder'));
  assert.equal(productionBody.includes('createHybridRegistry('), false);
  assert.equal(productionBody.includes('cp-cheat-slot-'), false);
  assert.equal(productionBody.includes('renderLegacy'), false);
  assert.match(productionBody, /renderSectionShell/);
  assert.match(productionBody, /mountCheatDescriptor/);
});

test('application bootstrap composes fixed lifecycle steps without a generic feature factory', async () => {
  const source = await readFile(applicationBootstrapUrl, 'utf8');
  for (const call of [
    'registerListenerActions()',
    'configureCheatRuntime(runtimeEngine)',
    'initStorage()',
    'initGameObservers()',
  ]) {
    assert.equal(source.includes(call), true, `application bootstrap is missing ${call}`);
  }
  assert.doesNotMatch(source, /feature-factory|\.\/registry\.js/);
  await assert.rejects(
    access(new URL('../../src/core/feature-factory.js', import.meta.url)),
    { code: 'ENOENT' }
  );
  await assert.rejects(access(new URL('../../src/features/registry.js', import.meta.url)), {
    code: 'ENOENT',
  });
});
