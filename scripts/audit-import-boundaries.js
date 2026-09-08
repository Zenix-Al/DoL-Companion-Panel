import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'src');

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : extname(path) === '.js' ? [path] : [];
  });
}

function imports(path) {
  const source = readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const specs = [...source.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .filter((spec) => spec.startsWith('.'));
  return specs.map((spec) => {
    const target = normalize(resolve(dirname(path), spec));
    return extname(target) ? target : `${target}.js`;
  });
}

const nodes = files(sourceRoot);
const nodeSet = new Set(nodes);
const graph = new Map(nodes.map((path) => [path, imports(path).filter((target) => nodeSet.has(target))]));
const cycles = [];
const visiting = new Set();
const visited = new Set();

function visit(node, stack = []) {
  if (visiting.has(node)) {
    const start = stack.indexOf(node);
    cycles.push([...stack.slice(start), node]);
    return;
  }
  if (visited.has(node)) return;
  visiting.add(node);
  for (const target of graph.get(node) ?? []) visit(target, [...stack, node]);
  visiting.delete(node);
  visited.add(node);
}
for (const node of nodes) visit(node);

const layer = (path) => relative(sourceRoot, path).split(/[\\/]/)[0];
const forbidden = [];
const rules = Object.freeze({
  core: new Set(['app', 'cheat', 'platform', 'ui']),
  platform: new Set(['app', 'cheat', 'ui']),
  ui: new Set(['app', 'cheat', 'platform']),
  cheat: new Set(['app', 'platform']),
});
for (const [from, targets] of graph) {
  for (const to of targets) {
    const fromLayer = layer(from);
    const toLayer = layer(to);
    const platformContractDependency =
      fromLayer === 'platform' &&
      toLayer === 'cheat' &&
      relative(sourceRoot, to).replaceAll('\\', '/').startsWith('cheat/contract/');
    if (rules[fromLayer]?.has(toLayer) && !platformContractDependency)
      forbidden.push({
        from,
        to,
        rule: `${fromLayer} must not depend on ${toLayer}`,
      });
  }
}

const allowedTopLevel = new Set(['app', 'cheat', 'core', 'main.js', 'platform', 'ui']);
const unexpectedLayers = [...new Set(nodes.map(layer).filter((name) => !allowedTopLevel.has(name)))];

const display = (path) => relative(root, path).replaceAll('\\', '/');
console.log(`Import audit: ${nodes.length} modules, ${[...graph.values()].flat().length} internal edges`);
console.log(`Cycles: ${cycles.length}`);
for (const cycle of cycles) console.log(`  ${cycle.map(display).join(' -> ')}`);
console.log(`Target-boundary violations: ${forbidden.length}`);
for (const item of forbidden) console.log(`  ${display(item.from)} -> ${display(item.to)} (${item.rule})`);
console.log(`Unexpected source layers: ${unexpectedLayers.length}`);
for (const name of unexpectedLayers) console.log(`  ${name}`);

if (process.argv.includes('--check') && (cycles.length || forbidden.length || unexpectedLayers.length))
  process.exitCode = 1;
