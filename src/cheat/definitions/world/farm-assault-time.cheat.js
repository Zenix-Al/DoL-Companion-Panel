import { createCheat } from '../../create-cheat.js';

import { hydrateInput, setInteger } from './farm-editor-helpers.js';

const PATH = 'farm_attack_timer';

export const farmAssaultTimeCheat = createCheat({
  id: 'world.farm-assault-time',
  location: { section: 'misc', group: 'farm', order: 120 },
  meta: {
    label: 'Farm Assault Time',
    controls: [
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: [PATH],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    set({ game, controls }) {
      return setInteger({ game, controls, path: PATH, label: 'Farm assault time' });
    },
  },
  sync({ game, controls }) {
    hydrateInput({ game, controls, path: PATH });
  },
});
