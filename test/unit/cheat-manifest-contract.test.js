import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

import { createCheatCatalog } from '../../src/cheat/catalog.js';
import {
  checkCheatManifest,
  discoverCheatManifestEntries,
  generateCheatManifest,
  normalizeManifestPath,
} from '../../scripts/cheat-manifest.js';

function createTemporaryProject() {
  const root = mkdtempSync(join(tmpdir(), 'dol-cheat-contract-'));
  const definitionsDir = join(root, 'definitions');
  const generatedDir = join(root, 'generated');
  mkdirSync(definitionsDir, { recursive: true });
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n', 'utf8');
  return {
    root,
    definitionsDir,
    outputFile: join(generatedDir, 'cheats.generated.js'),
  };
}

function removeTemporaryProject(root) {
  const resolvedRoot = resolve(root);
  const resolvedTemp = resolve(tmpdir());
  if (
    !resolvedRoot.startsWith(`${resolvedTemp}\\`) &&
    !resolvedRoot.startsWith(`${resolvedTemp}/`)
  ) {
    throw new Error(`Refusing to remove unexpected test directory: ${resolvedRoot}`);
  }
  rmSync(resolvedRoot, { recursive: true, force: true });
}

function writeCheatModule(file, { exportName, id, section = 'quick', order = 10 }) {
  writeFileSync(
    file,
    `export const ${exportName} = {
  id: ${JSON.stringify(id)},
  location: { section: ${JSON.stringify(section)}, group: "manifest", order: ${order} },
  meta: {
    label: ${JSON.stringify(id)},
    controls: [{ key: "run", type: "button", action: "run" }],
  },
  actions: { run() { return { ok: true }; } },
};
`,
    'utf8'
  );
}

test('manifest supports an empty definitions directory with byte-stable output', () => {
  const project = createTemporaryProject();
  try {
    const first = generateCheatManifest(project);
    const second = generateCheatManifest(project);
    assert.deepEqual(first.entries, []);
    assert.equal(second.content, first.content);
    assert.doesNotThrow(() => checkCheatManifest(project));
  } finally {
    removeTemporaryProject(project.root);
  }
});

test('manifest discovery is deterministic, recursive, normalized, and ignores non-cheat modules', () => {
  const project = createTemporaryProject();
  try {
    const nested = join(project.definitionsDir, 'nested');
    mkdirSync(nested);
    writeCheatModule(join(project.definitionsDir, 'zeta.cheat.js'), {
      exportName: 'zetaCheat',
      id: 'test.zeta',
      order: 20,
    });
    writeCheatModule(join(nested, 'alpha.cheat.js'), {
      exportName: 'alphaCheat',
      id: 'test.alpha',
      order: 10,
    });
    writeFileSync(
      join(project.definitionsDir, 'ordinary-helper.js'),
      'export const ignored = true;\n',
      'utf8'
    );

    const first = discoverCheatManifestEntries(project);
    const second = discoverCheatManifestEntries(project);
    assert.deepEqual(
      first.map(({ relativePath, exportName }) => ({ relativePath, exportName })),
      [
        { relativePath: 'nested/alpha.cheat.js', exportName: 'alphaCheat' },
        { relativePath: 'zeta.cheat.js', exportName: 'zetaCheat' },
      ]
    );
    assert.deepEqual(second, first);
    assert.equal(
      first.every(({ relativePath }) => !relativePath.includes('\\')),
      true
    );

    const generated = generateCheatManifest(project);
    const initialContent = readFileSync(project.outputFile, 'utf8');
    assert.equal(generated.content, initialContent);
    assert.equal(initialContent.includes('ordinary-helper'), false);
    assert.equal(initialContent.includes('\\'), false);

    const beforeCheckMtime = statSync(project.outputFile).mtimeMs;
    assert.doesNotThrow(() => checkCheatManifest(project));
    assert.equal(statSync(project.outputFile).mtimeMs, beforeCheckMtime);

    appendFileSync(project.outputFile, '// stale\n', 'utf8');
    const staleContent = readFileSync(project.outputFile, 'utf8');
    assert.throws(() => checkCheatManifest(project), /manifest is stale/);
    assert.equal(readFileSync(project.outputFile, 'utf8'), staleContent);
  } finally {
    removeTemporaryProject(project.root);
  }
});

test('manifest discovery rejects cheat files without a convention export', () => {
  const project = createTemporaryProject();
  try {
    writeFileSync(
      join(project.definitionsDir, 'missing.cheat.js'),
      'export const notADescriptor = {};\n',
      'utf8'
    );
    assert.throws(() => discoverCheatManifestEntries(project), /exactly one \*Cheat descriptor/);
  } finally {
    removeTemporaryProject(project.root);
  }
});

test('manifest discovery rejects duplicate exported cheat symbols', () => {
  const project = createTemporaryProject();
  try {
    writeCheatModule(join(project.definitionsDir, 'first.cheat.js'), {
      exportName: 'duplicateCheat',
      id: 'test.first',
    });
    writeCheatModule(join(project.definitionsDir, 'second.cheat.js'), {
      exportName: 'duplicateCheat',
      id: 'test.second',
      order: 20,
    });
    assert.throws(
      () => discoverCheatManifestEntries(project),
      /Duplicate cheat export "duplicateCheat"/
    );
  } finally {
    removeTemporaryProject(project.root);
  }
});

test('generated manifest carries a new exported cheat into the runtime catalog without manual edits', async () => {
  const project = createTemporaryProject();
  try {
    writeCheatModule(join(project.definitionsDir, 'first.cheat.js'), {
      exportName: 'firstCheat',
      id: 'test.first',
      order: 10,
    });
    generateCheatManifest(project);
    assert.doesNotThrow(() => checkCheatManifest(project));

    writeCheatModule(join(project.definitionsDir, 'second.cheat.js'), {
      exportName: 'secondCheat',
      id: 'test.second',
      section: 'stats',
      order: 20,
    });
    assert.throws(() => checkCheatManifest(project), /manifest is stale/);

    generateCheatManifest(project);
    const moduleUrl = `${pathToFileURL(project.outputFile).href}?contract=1`;
    const beforeGlobals = new Set(Reflect.ownKeys(globalThis));
    // The generated path is unique and dynamic import is intentional for the build fixture.
    // eslint-disable-next-line no-restricted-syntax
    const generatedModule = await import(/* allow-dynamic-import */ moduleUrl);
    const addedGlobals = Reflect.ownKeys(globalThis).filter((key) => !beforeGlobals.has(key));
    const catalog = createCheatCatalog(generatedModule.generatedCheats);

    assert.deepEqual(
      catalog.listCheats().map((descriptor) => descriptor.id),
      ['test.first', 'test.second']
    );
    assert.deepEqual(addedGlobals, []);
    assert.equal(normalizeManifestPath(project.outputFile).includes('\\'), false);
  } finally {
    removeTemporaryProject(project.root);
  }
});
