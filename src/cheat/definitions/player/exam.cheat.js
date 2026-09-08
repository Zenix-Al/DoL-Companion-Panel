import { exam } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const path = (field) => field;

export const examCheat = createCheat({
  id: 'player.exam',
  location: { section: 'stats', group: 'school', order: 110 },
  meta: {
    label: 'Exam',
    controls: [
      { key: 'field', type: 'select', options: exam, action: 'select' },
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
        label: 'Exam value',
        requireExisting: false,
      });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
