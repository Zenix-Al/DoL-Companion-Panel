import { school_rep } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const path = (field) => field;

export const schoolReputationCheat = createCheat({
  id: 'player.school-reputation',
  location: { section: 'stats', group: 'school', order: 120 },
  meta: {
    label: 'School Reputation',
    controls: [
      { key: 'field', type: 'select', options: school_rep, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: [],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    select: selectAndRefresh,
    set(context) {
      return setSelectedNumber({
        ...context,
        path,
        label: 'School reputation',
        requireExisting: false,
      });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
