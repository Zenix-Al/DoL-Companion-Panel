import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

test('package builder produces the complete canonical layout and ZIP', (t) => {
  const token = `.injector-package-test-${process.pid}`;
  const artifact = path.join(ROOT, 'dist', `${token}.user.js`);
  const output = path.join(ROOT, 'dist', token);
  const zip = `${output}.zip`;
  t.after(() => {
    fs.rmSync(artifact, { force: true });
    fs.rmSync(output, { recursive: true, force: true });
    fs.rmSync(zip, { force: true });
  });
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, '// ==UserScript==\n// @version 9.8.7\n// ==/UserScript==\n// Build mode: release\n// Artifact: optimized\n(()=>{})();', 'utf8');
  execFileSync(process.execPath, ['build/build-injector-tools.cjs', '--artifact', artifact, '--outdir', output, '--zip', zip], { cwd: ROOT, stdio: 'pipe' });
  const payload = path.join(output, 'Companion-Panel', 'companion-panel.user.js');
  assert.equal(fs.readFileSync(payload, 'utf8'), fs.readFileSync(artifact, 'utf8'));
  assert.equal(
    fs.readFileSync(path.join(output, 'README.md'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'docs', 'user', 'LOCAL_INJECTOR.md'), 'utf8')
  );
  assert.equal(fs.existsSync(path.join(output, 'Companion-Panel', 'injector-ui.ps1')), false);
  assert.match(fs.readFileSync(path.join(output, 'inject-windows.bat'), 'utf8'), /companion-panel-injector\.ps1/);
  const archive = fs.readFileSync(zip);
  assert.equal(archive.readUInt32LE(0), 0x04034b50);
  for (const relative of [
    'inject-windows.bat',
    'inject-linux.sh',
    'inject-macos.command',
    'Companion-Panel/companion-panel-injector.ps1',
    'Companion-Panel/companion-panel.user.js',
  ]) {
    assert.equal(
      archive.includes(Buffer.from(`${path.basename(output)}/${relative}`)),
      true,
      `ZIP is missing ${relative}`
    );
  }
});
