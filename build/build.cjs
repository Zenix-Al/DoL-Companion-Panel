const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const esbuild = require('esbuild');
const { cssTextPlugin } = require('./plugins/css-text.cjs');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(__dirname, 'version.json');
const HEADER_TEMPLATE_PATH = path.join(__dirname, 'header.txt');
const DEFAULT_OUT_DIR = path.join(ROOT, 'dist');
const TARGETS = Object.freeze([
  { key: 'greasyfork', label: 'Greasy Fork', filename: 'DoL-Companion-Panel.user.js', minify: false },
  { key: 'optimized', label: 'Optimized', filename: 'DoL-Companion-Panel.min.user.js', minify: true },
]);

function readVersion() {
  try {
    const value = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    if (![value.major, value.minor, value.patch].every(Number.isInteger)) throw new Error();
    return value;
  } catch {
    throw new Error(`Invalid or missing version file: ${VERSION_FILE}`);
  }
}

function bumpVersion(version, type) {
  if (type === 'major') return { major: version.major + 1, minor: 0, patch: 0 };
  if (type === 'minor') return { major: version.major, minor: version.minor + 1, patch: 0 };
  return { ...version, patch: version.patch + 1 };
}

function parseArgs(args) {
  const outIndex = args.indexOf('--outdir');
  const outDir = outIndex >= 0 ? args[outIndex + 1] : null;
  if (outIndex >= 0 && !outDir) throw new Error('--outdir requires a directory.');
  return {
    release: args.includes('--release'),
    noBump: args.includes('--no-bump'),
    checkManifest: args.includes('--check-manifest'),
    bumpType: args.includes('--major') ? 'major' : args.includes('--minor') ? 'minor' : 'patch',
    outDir: outDir ? path.resolve(outDir) : DEFAULT_OUT_DIR,
  };
}

function renderHeader(template, { name, version, banner, buildInfo }) {
  return template
    .replaceAll('{{NAME}}', name)
    .replaceAll('{{VERSION}}', version)
    .replaceAll('{{BANNER}}', banner)
    .replaceAll('{{BUILD_INFO}}', buildInfo);
}

function generateOrCheckManifest(checkOnly) {
  execFileSync(process.execPath, ['scripts/generate-cheat-manifest.js', ...(checkOnly ? ['--check'] : [])], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

async function buildTarget(target, options, common) {
  const outfile = path.join(options.outDir, target.filename);
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src', 'main.js')],
    bundle: true,
    format: 'iife',
    legalComments: 'none',
    treeShaking: true,
    loader: { '.html': 'text' },
    define: {
      __DOL_DEBUG__: options.release ? 'false' : 'true',
      __DOL_CHEAT_VERSION__: JSON.stringify(common.version),
    },
    pure: options.release ? ['debugLog'] : [],
    plugins: [cssTextPlugin({ compact: options.release })],
    minify: target.minify,
    outfile,
  });

  const builtCode = fs.readFileSync(outfile, 'utf8');
  const buildInfo = [
    `// Build mode: ${options.release ? 'release' : 'development'}`,
    `// Artifact: ${target.key}`,
    `// Logs: ${options.release ? 'debugLog call sites removed' : 'debugLog call sites retained'}`,
  ].join('\n');
  const header = renderHeader(common.headerTemplate, {
    name: 'DoL Companion Panel',
    version: common.version,
    banner: common.banner,
    buildInfo,
  });
  fs.writeFileSync(outfile, header + builtCode, 'utf8');
  return { ...target, outfile, bytes: fs.statSync(outfile).size };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const current = readVersion();
  const next = options.noBump ? current : bumpVersion(current, options.bumpType);
  const version = `${next.major}.${next.minor}.${next.patch}`;

  generateOrCheckManifest(options.checkManifest || options.noBump);
  if (!options.noBump) fs.writeFileSync(VERSION_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  fs.mkdirSync(options.outDir, { recursive: true });

  const common = {
    version,
    banner: `// Built on ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC -- AUTO-GENERATED, edit from /src and rebuild`,
    headerTemplate: fs.readFileSync(HEADER_TEMPLATE_PATH, 'utf8'),
  };
  const results = [];
  for (const target of TARGETS) results.push(await buildTarget(target, options, common));
  for (const result of results) {
    console.log(`[build] ${result.label}: ${path.relative(ROOT, result.outfile)} (${result.bytes} bytes)`);
  }
  console.log(`[build] Version ${version}${options.noBump ? ' (no bump)' : ` (${options.bumpType} bump)`}`);
}

main().catch((error) => {
  console.error('[build] Failed:', error?.message || error);
  process.exitCode = 1;
});
