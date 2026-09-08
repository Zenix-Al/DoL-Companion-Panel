import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

test('documentation locations, local links, commands, and history labels pass the repository guard', () => {
  const output = execFileSync(process.execPath, ['scripts/check-docs.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(output, /all links and commands valid/);
});
