import { hentaiSkill } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

import { hydrateSelectedValue, selectAndRefresh, setSelectedNumber } from './editor-helpers.js';

const path = (field) => field;

export const hentaiSkillCheat = createCheat({
  id: 'player.hentai-skill',
  location: { section: 'stats', group: 'talent', order: 140 },
  meta: {
    label: 'Hentai Skill',
    controls: [
      { key: 'field', type: 'select', options: hentaiSkill, action: 'select' },
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
        label: 'Hentai skill',
        requireExisting: false,
      });
    },
  },
  sync(context) {
    hydrateSelectedValue({ ...context, path });
  },
});
