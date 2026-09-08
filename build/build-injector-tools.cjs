const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createZipFromDirectory } = require('./lib/zip.cjs');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'tools', 'injector');
const README_SOURCE = path.join(ROOT, 'docs', 'user', 'LOCAL_INJECTOR.md');
const DEFAULT_ARTIFACT = path.join(ROOT, 'dist', 'DoL-Companion-Panel.min.user.js');
const DEFAULT_OUTPUT = path.join(ROOT, 'dist', 'companion-panel-injector');
const REQUIRED_SOURCE_FILES = [
  'inject-windows.bat',
  'inject-linux.sh',
  'inject-macos.command',
  'Companion-Panel/companion-panel-injector.ps1',
  'Companion-Panel/inject-local-html.cjs',
  'Companion-Panel/restore-local-html.cjs',
];

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  if (!process.argv[index + 1]) throw new Error(`${flag} requires a path.`);
  return path.resolve(process.argv[index + 1]);
}

function assertInside(parent, child) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe generated output path: ${child}`);
  }
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function readUserscriptVersion(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^\/\/ @version\s+([^\r\n]+)/m);
  if (!match) throw new Error(`Userscript version missing from: ${file}`);
  if (!text.includes('// Build mode: release') || !text.includes('// Artifact: optimized')) {
    throw new Error('Injector payload must be the optimized release artifact.');
  }
  return { version: match[1].trim(), text };
}

function validateSource() {
  for (const relative of REQUIRED_SOURCE_FILES) {
    const file = path.join(SOURCE_DIR, relative);
    if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
      throw new Error(`Missing canonical injector source: ${relative}`);
    }
  }
  if (!fs.statSync(README_SOURCE, { throwIfNoEntry: false })?.isFile()) {
    throw new Error('Missing canonical injector README: docs/user/LOCAL_INJECTOR.md');
  }
  const windows = fs.readFileSync(path.join(SOURCE_DIR, 'inject-windows.bat'), 'utf8');
  if (!windows.includes('companion-panel-injector.ps1') || windows.includes('injector-ui.ps1')) {
    throw new Error('Windows launcher does not resolve the canonical PowerShell UI.');
  }
}

function validatePackage(packageDir, expectedVersion) {
  const expected = [
    'README.md',
    ...REQUIRED_SOURCE_FILES,
    'Companion-Panel/companion-panel.user.js',
  ];
  for (const relative of expected) {
    const file = path.join(packageDir, relative);
    if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile() || fs.statSync(file).size === 0) {
      throw new Error(`Missing or empty packaged file: ${relative}`);
    }
  }
  if (fs.existsSync(path.join(packageDir, 'Companion-Panel', 'injector-ui.ps1'))) {
    throw new Error('Obsolete injector-ui.ps1 leaked into the generated package.');
  }
  const packaged = readUserscriptVersion(path.join(packageDir, 'Companion-Panel', 'companion-panel.user.js'));
  if (packaged.version !== expectedVersion) throw new Error('Packaged payload version changed during assembly.');
}

function replaceGenerated(target, staged) {
  assertInside(path.join(ROOT, 'dist'), target);
  fs.rmSync(target, { recursive: true, force: true });
  fs.renameSync(staged, target);
}

function main() {
  const artifact = argValue('--artifact', DEFAULT_ARTIFACT);
  const output = argValue('--outdir', DEFAULT_OUTPUT);
  const zipPath = argValue('--zip', `${output}.zip`);
  assertInside(path.join(ROOT, 'dist'), output);
  assertInside(path.join(ROOT, 'dist'), zipPath);
  if (!fs.statSync(artifact, { throwIfNoEntry: false })?.isFile() || fs.statSync(artifact).size === 0) {
    throw new Error(`Optimized userscript artifact is missing or empty: ${artifact}`);
  }
  validateSource();
  const { version } = readUserscriptVersion(artifact);

  const stagingRoot = path.join(ROOT, 'dist', `.injector-stage-${process.pid}-${Date.now()}`);
  const stagedPackage = path.join(stagingRoot, 'companion-panel-injector');
  assertInside(path.join(ROOT, 'dist'), stagingRoot);
  try {
    copyTree(SOURCE_DIR, stagedPackage);
    fs.copyFileSync(README_SOURCE, path.join(stagedPackage, 'README.md'));
    fs.copyFileSync(artifact, path.join(stagedPackage, 'Companion-Panel', 'companion-panel.user.js'));
    validatePackage(stagedPackage, version);
    const temporaryZip = `${zipPath}.tmp-${process.pid}`;
    fs.rmSync(temporaryZip, { force: true });
    createZipFromDirectory(stagedPackage, temporaryZip, path.basename(output));
    if (!fs.statSync(temporaryZip, { throwIfNoEntry: false })?.size) {
      throw new Error('Generated injector archive is empty.');
    }

    replaceGenerated(output, stagedPackage);
    fs.rmSync(zipPath, { force: true });
    fs.renameSync(temporaryZip, zipPath);
    fs.rmSync(stagingRoot, { recursive: true, force: true });

    const payload = path.join(output, 'Companion-Panel', 'companion-panel.user.js');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(payload)).digest('hex');
    console.log(`[build:injector] Package: ${path.relative(ROOT, output)}`);
    console.log(`[build:injector] Archive: ${path.relative(ROOT, zipPath)}`);
    console.log(`[build:injector] Version: ${version}; payload SHA-256: ${hash}`);
  } catch (error) {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error('[build:injector] Failed:', error?.message || error);
  process.exitCode = 1;
}
