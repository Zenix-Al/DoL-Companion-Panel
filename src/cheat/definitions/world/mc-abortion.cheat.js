import { createCheat } from '../../create-cheat.js';

import {
  confirmed,
  destructiveConfirmation,
  fetusOptions,
  removeFetus,
} from './pregnancy-editor-helpers.js';

function locationOptions({ game }) {
  return Object.entries(game.get('sexStats') ?? {})
    .filter(([, value]) => Array.isArray(value?.pregnancy?.fetus))
    .map(([key]) => key);
}

function options({ game, controls }) {
  return fetusOptions(game.get(`sexStats.${controls.value('location')}.pregnancy`));
}

export const mcAbortionCheat = createCheat({
  id: 'world.mc-abortion',
  location: { section: 'misc', group: 'pregnancy-removal', order: 70 },
  meta: {
    label: 'MC Pregnancy Removal',
    controls: [
      { key: 'location', type: 'select', options: locationOptions, action: 'select' },
      { key: 'fetus', type: 'select', options, action: 'select' },
      { key: 'confirm', type: 'toggle', label: 'Confirm', intent: 'confirmation' },
      { key: 'remove', type: 'button', label: 'Remove', action: 'remove' },
    ],
  },
  requiredPaths: ['sexStats'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    remove({ game, controls }) {
      if (!confirmed(controls))
        return { ok: false, kind: 'blocked', message: destructiveConfirmation };
      const path = `sexStats.${controls.value('location')}.pregnancy`;
      const pregnancy = game.get(path);
      if (!removeFetus(pregnancy, controls.value('fetus')))
        return { ok: false, kind: 'validation', message: 'No fetus is available.' };
      game.set(path, pregnancy);
      controls.setValue('confirm', false);
      return { ok: true, message: 'MC pregnancy removed.', refresh: true };
    },
  },
});
