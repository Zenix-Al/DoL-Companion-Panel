import { generatedCheats } from './catalog/generated.js';
import { createCheatCatalog } from './catalog.js';

export { createCheat } from './create-cheat.js';
export const cheatCatalog = createCheatCatalog(generatedCheats);
