const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(__dirname, 'version.json');
const MANIFEST_FILE = path.join(ROOT, 'src', 'cheat', 'catalog', 'generated.js');
const SIZE_BASELINE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artifact-size-baseline.json'), 'utf8')
);

function versionOf(text) {
  return text.match(/^\/\/ @version\s+([^\r\n]+)/m)?.[1]?.trim();
}

function main() {
  const beforeVersion = fs.readFileSync(VERSION_FILE);
  const beforeManifest = fs.readFileSync(MANIFEST_FILE);
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dol-companion-build-'));
  try {
    execFileSync(
      process.execPath,
      ['build/build.cjs', '--release', '--no-bump', '--check-manifest', '--outdir', outDir],
      { cwd: ROOT, stdio: 'inherit' }
    );
    const readable = fs.readFileSync(path.join(outDir, 'DoL-Companion-Panel.user.js'), 'utf8');
    const optimized = fs.readFileSync(path.join(outDir, 'DoL-Companion-Panel.min.user.js'), 'utf8');
    if (!readable.includes('// Artifact: greasyfork') || !optimized.includes('// Artifact: optimized')) {
      throw new Error('Artifact mode markers are incorrect.');
    }
    if (!readable.includes('// Build mode: release') || !optimized.includes('// Build mode: release')) {
      throw new Error('Smoke build did not use release mode.');
    }
    if (!versionOf(readable) || versionOf(readable) !== versionOf(optimized)) {
      throw new Error('Release artifacts do not share one version.');
    }
    const debugLogTokens = readable.match(/\bdebugLog\s*\(/g)?.length ?? 0;
    // The logger declaration may remain because it exposes runtime debug controls;
    // all production call sites must be removed by esbuild's parsed `pure` transform.
    if (debugLogTokens > 1) throw new Error('Readable release still contains debugLog call sites.');
    if (optimized.length >= readable.length) throw new Error('Optimized artifact is not smaller.');
    for (const [key, size] of [
      ['greasyfork', Buffer.byteLength(readable)],
      ['optimized', Buffer.byteLength(optimized)],
    ]) {
      const maximum = SIZE_BASELINE[key] * (1 + SIZE_BASELINE.warningGrowthPercent / 100);
      if (size > maximum) {
        throw new Error(`${key} artifact grew beyond the reviewed ${SIZE_BASELINE.warningGrowthPercent}% threshold.`);
      }
    }
    if (!beforeVersion.equals(fs.readFileSync(VERSION_FILE))) throw new Error('No-bump build changed version.json.');
    if (!beforeManifest.equals(fs.readFileSync(MANIFEST_FILE))) throw new Error('Smoke build changed manifest.');
    console.log(`[verify:build] PASS: ${readable.length} byte readable, ${optimized.length} byte optimized.`);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error('[verify:build] Failed:', error?.message || error);
  process.exitCode = 1;
}
