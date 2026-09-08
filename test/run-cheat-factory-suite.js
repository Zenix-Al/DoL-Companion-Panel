import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseNodeTestTap, validateSuiteMetrics } from './helpers/full-suite-metrics.js';

const testRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(testRoot);

function collectTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTests(path);
    return entry.name.endsWith('.test.js') ? [path] : [];
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout;
}

console.log('Cheat factory verification: lint');
run(process.execPath, [
  join(projectRoot, 'node_modules/eslint/bin/eslint.js'),
  '--ignore-path',
  '.gitignore',
  '.',
]);

console.log('Cheat factory verification: generated manifest drift');
run(process.execPath, [join(projectRoot, 'scripts/generate-cheat-manifest.js'), '--check']);

console.log('Cheat factory verification: documentation');
run(process.execPath, [join(projectRoot, 'scripts/check-docs.js')]);

console.log('Cheat factory verification: complete executable suite');
const tap = run(process.execPath, [
  '--test',
  '--test-concurrency=1',
  '--test-reporter=tap',
  ...collectTests(testRoot).sort(),
]);
const baseline = JSON.parse(readFileSync(join(testRoot, 'full-suite-baseline.json'), 'utf8'));
const metrics = parseNodeTestTap(tap);
const errors = validateSuiteMetrics(metrics, baseline);

if (errors.length) {
  for (const error of errors) console.error(`Baseline violation: ${error}`);
  process.exit(1);
}

console.log(
  `Cheat factory baseline accepted: ${metrics.tests} tests, ${metrics.pass} pass, ` +
    `${metrics.todo} todo, ${metrics.skipped} skipped, ${metrics.durationMs.toFixed(1)}ms.`
);
