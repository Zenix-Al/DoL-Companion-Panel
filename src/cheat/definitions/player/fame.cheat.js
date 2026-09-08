import { fame } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const path = (field) => `fame.${field}`;

export const fameCheat = createCheat({
  id: 'player.fame',
  location: { section: 'stats', group: 'fame', order: 100 },
  meta: {
    label: 'Fame',
    controls: [
      { key: 'field', type: 'select', options: fame, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['fame'],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    select: selectAndRefresh,
    set(context) {
      return setSelectedNumber({ ...context, path, label: 'Fame' });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
