import { talent_skill } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const path = (field) => field;

export const talentCheat = createCheat({
  id: 'player.talent',
  location: { section: 'stats', group: 'talent', order: 130 },
  meta: {
    label: 'Talent',
    controls: [
      { key: 'field', type: 'select', options: talent_skill, action: 'select' },
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
        label: 'Talent',
        requireExisting: false,
      });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
