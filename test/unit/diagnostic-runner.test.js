import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticProbe,
  createDiagnosticRunner,
  formatDiagnosticReport,
} from '../../src/core/health.js';

const probe = (id, run, options = {}) =>
  createDiagnosticProbe({ id, label: id, scope: 'runtime', timeoutMs: 30, run, ...options });

test('diagnostic runner isolates pass, blocked, thrown, and timed-out probes', async () => {
  const runner = createDiagnosticRunner({
    probes: [
      probe('probe.pass', () => ({ status: 'pass', message: 'Healthy.' })),
      probe('probe.blocked', () => ({ status: 'pass' }), { applicable: () => false }),
      probe('probe.throw', () => {
        throw new Error('private state must not escape');
      }),
      probe('probe.timeout', () => new Promise(() => {}), { timeoutMs: 5 }),
    ],
  });
  const report = await runner.runAll();
  assert.deepEqual(
    report.results.map(({ id, status }) => [id, status]),
    [
      ['probe.pass', 'pass'],
      ['probe.blocked', 'blocked'],
      ['probe.throw', 'fail'],
      ['probe.timeout', 'fail'],
    ]
  );
  assert.equal(report.pass, 1);
  assert.equal(report.blocked, 1);
  assert.equal(report.fail, 2);
  assert.doesNotMatch(formatDiagnosticReport(report), /private state/);
});

test('diagnostic probe contract rejects unsafe or incomplete declarations', () => {
  assert.throws(() => createDiagnosticProbe({}), /stable lowercase/);
  assert.throws(
    () => probe('probe.bad', () => ({ status: 'pass' }), { scope: 'mutation' }),
    /invalid scope/
  );
  assert.throws(
    () => probe('probe.extra', () => ({ status: 'pass' }), { action: () => {} }),
    /Unknown diagnostic probe field/
  );
});
