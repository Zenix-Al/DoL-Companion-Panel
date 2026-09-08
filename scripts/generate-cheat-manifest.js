import { resolve } from 'node:path';

import { checkCheatManifest, generateCheatManifest } from './cheat-manifest.js';

const options = {
  definitionsDir: resolve('src/cheat/definitions'),
  outputFile: resolve('src/cheat/catalog/generated.js'),
};
const check = process.argv.includes('--check');
const result = check ? checkCheatManifest(options) : generateCheatManifest(options);
console.log(`${check ? 'Checked' : 'Generated'} cheat manifest (${result.entries.length} cheats).`);
