import { createCheat } from '../../create-cheat.js';

import { hydrateInput, setInteger } from './farm-editor-helpers.js';

const PATH = 'farm.build_timer';

export const farmBuildTimeCheat = createCheat({
  id: 'world.farm-build-time',
  location: { section: 'misc', group: 'farm', order: 110 },
  meta: {
    label: 'Farm Build Time',
    controls: [
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: [PATH],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    set({ game, controls }) {
      return setInteger({ game, controls, path: PATH, label: 'Farm build time' });
    },
  },
  sync({ game, controls }) {
    hydrateInput({ game, controls, path: PATH });
  },
});
