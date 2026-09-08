import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const FIELDS = ['enemyhealth', 'enemytrust', 'enemyanger'];
const path = (field) => field;

export const enemyStatsCheat = createCheat({
  id: 'player.enemy-stats',
  location: { section: 'stats', group: 'enemy', order: 1 },
  meta: {
    label: 'Enemy Stats',
    controls: [
      { key: 'field', type: 'select', options: FIELDS, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: FIELDS,
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    select: selectAndRefresh,
    set(context) {
      return setSelectedNumber({ ...context, path, label: 'Enemy stat' });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
