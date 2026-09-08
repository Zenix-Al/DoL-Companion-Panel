import test from 'node:test';
import assert from 'node:assert/strict';

import { runDiagnosticsCheat } from '../../src/cheat/definitions/developer/run-diagnostics.cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createProductionDiagnostics } from '../../src/app/panel-health.js';
import { createDiagnosticProbe, createDiagnosticRunner } from '../../src/core/health.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeConfigFacade } from '../helpers/fake-config-facade.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

async function setup(probes) {
  const env = createDomWithSugarCube();
  const variables = { money: 10, nested: { value: 2 } };
  const adapter = createFakeGameAdapter({ variables });
  const diagnostics = createDiagnosticRunner({ probes });
  const mounted = await mountCheatDescriptor({
    descriptor: runDiagnosticsCheat,
    document: env.document,
    adapter: adapter.game,
    config: createFakeConfigFacade().config,
    services: { diagnostics },
  });
  return { env, variables, mounted };
}

const safeProbe = createDiagnosticProbe({
  id: 'test.read-only',
  label: 'Read only',
  scope: 'runtime',
  timeoutMs: 50,
  run: () => ({ status: 'pass', message: 'No mutation.' }),
});

test('Developer Tools requires reveal and repeated diagnostics remain read-only', async () => {
  const instance = await setup([safeProbe]);
  const before = structuredClone(instance.variables);
  try {
    assert.equal(instance.mounted.controls.element('run').hidden, true);
    assert.equal((await instance.mounted.runAction('run')).kind, 'blocked');
    await instance.mounted.runAction('reveal');
    assert.equal(instance.mounted.controls.element('run').hidden, false);
    assert.equal((await instance.mounted.runAction('run')).ok, true);
    const first = instance.mounted.controls.value('report');
    assert.equal((await instance.mounted.runAction('run')).ok, true);
    assert.equal(instance.mounted.controls.value('report'), first);
    assert.deepEqual(instance.variables, before);
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('diagnostics reports partial failure and uses selectable fallback without clipboard', async () => {
  const failing = createDiagnosticProbe({
    id: 'test.failure', label: 'Failure', scope: 'runtime', timeoutMs: 50,
    run: () => ({ status: 'fail', message: 'Bounded failure.' }),
  });
  const instance = await setup([safeProbe, failing]);
  try {
    await instance.mounted.runAction('reveal');
    const outcome = await instance.mounted.runAction('run');
    assert.equal(outcome.ok, false);
    assert.match(instance.mounted.controls.value('report'), /1 pass.*1 fail/);
    assert.equal((await instance.mounted.runAction('copy')).ok, true);
    assert.equal(instance.env.document.activeElement, instance.mounted.controls.element('report'));
  } finally {
    await instance.mounted.dispose();
    instance.env.cleanup();
  }
});

test('Developer Tools opt-in resets on remount and blocks without diagnostics service', async () => {
  const first = await setup([safeProbe]);
  await first.mounted.runAction('reveal');
  await first.mounted.dispose();
  const remounted = await mountCheatDescriptor({
    descriptor: runDiagnosticsCheat,
    document: first.env.document,
    adapter: createFakeGameAdapter({ variables: {} }).game,
    config: createFakeConfigFacade().config,
  });
  try {
    assert.equal(remounted.controls.element('run').hidden, true);
    await remounted.runAction('reveal');
    assert.equal((await remounted.runAction('run')).kind, 'blocked');
  } finally {
    await remounted.dispose();
    first.env.cleanup();
  }
});

test('production probes report bounded health without game or scheduler mutation', async () => {
  const adapter = createFakeGameAdapter({ variables: { money: 10 } });
  const variablesBefore = structuredClone(adapter.variables);
  let schedulerRuns = 0;
  const diagnostics = createProductionDiagnostics({
    catalog: {
      listCheats: () => [
        {
          id: 'test.money',
          location: { section: 'stats', group: 'test', order: 1 },
          requiredPaths: ['money'],
          config: [],
        },
      ],
    },
    adapter: adapter.game,
    getHealth: () => ({ total: 1, mounted: 1, failed: 0 }),
    getAliases: () => ['moneyset'],
    scheduler: {
      list() {
        return ['healthy-toggle'];
      },
      run() {
        schedulerRuns += 1;
      },
    },
  });
  const report = await diagnostics.runAll();
  assert.equal(report.fail, 0);
  assert.equal(report.total, 6);
  assert.deepEqual(adapter.variables, variablesBefore);
  assert.equal(schedulerRuns, 0);
  assert.doesNotMatch(diagnostics.formatReport(report), /money: 10/);
});
