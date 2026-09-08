import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const INJECT = path.join(ROOT, 'tools', 'injector', 'Companion-Panel', 'inject-local-html.cjs');
const RESTORE = path.join(ROOT, 'tools', 'injector', 'Companion-Panel', 'restore-local-html.cjs');

function fixture(name = 'fixture ü with spaces') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  const html = path.join(directory, 'game file.html');
  const source = path.join(directory, 'source panel.user.js');
  const injected = path.join(directory, 'injected', 'companion-panel.user.js');
  fs.writeFileSync(html, '<html><head></head><body>game</body></html>', 'utf8');
  fs.writeFileSync(source, '// payload', 'utf8');
  return { directory, html, source, injected };
}

test('inject, unchanged reinject, update, and restore preserve the original backup', (t) => {
  const files = fixture();
  t.after(() => fs.rmSync(files.directory, { recursive: true, force: true }));
  const args = ['--html', files.html, '--source-script', files.source, '--injected-script', files.injected];
  execFileSync(process.execPath, [INJECT, ...args]);
  const backup = fs.readFileSync(`${files.html}.bak`, 'utf8');
  const first = fs.readFileSync(files.html, 'utf8');
  assert.match(first, /DoL Companion Panel Injection START/);
  execFileSync(process.execPath, [INJECT, ...args]);
  assert.equal(fs.readFileSync(`${files.html}.bak`, 'utf8'), backup);
  fs.writeFileSync(files.source, '// updated payload', 'utf8');
  execFileSync(process.execPath, [INJECT, ...args]);
  assert.equal(fs.readFileSync(files.injected, 'utf8'), '// updated payload');
  execFileSync(process.execPath, [RESTORE, '--html', files.html, '--injected-script', files.injected]);
  assert.equal(fs.readFileSync(files.html, 'utf8'), backup);
  assert.equal(fs.existsSync(`${files.html}.bak`), false);
  assert.equal(fs.existsSync(files.injected), false);
});

test('injector rejects a missing payload and malformed HTML', (t) => {
  const files = fixture('failure');
  t.after(() => fs.rmSync(files.directory, { recursive: true, force: true }));
  let result = spawnSync(process.execPath, [INJECT, '--html', files.html, '--source-script', `${files.source}.missing`], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Source script not found/);
  fs.writeFileSync(files.html, '<html>broken', 'utf8');
  result = spawnSync(process.execPath, [INJECT, '--html', files.html, '--source-script', files.source, '--injected-script', files.injected], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Could not find <\/head> or <\/body>/);
});

test('injector discovers an HTML file one directory above its working directory', (t) => {
  const files = fixture('discovery');
  const child = path.join(files.directory, 'Companion-Panel');
  fs.mkdirSync(child);
  fs.copyFileSync(files.source, path.join(child, 'companion-panel.user.js'));
  t.after(() => fs.rmSync(files.directory, { recursive: true, force: true }));
  execFileSync(process.execPath, [INJECT, '--source-script', path.join(child, 'companion-panel.user.js')], { cwd: child });
  assert.match(fs.readFileSync(files.html, 'utf8'), /DoL Companion Panel Injection START/);
});
