import { createCheat } from '../../create-cheat.js';

import {
  confirmed,
  destructiveConfirmation,
  fetusOptions,
  removeFetus,
} from './pregnancy-editor-helpers.js';

function npcOptions({ game }) {
  return (game.get('NPCName') ?? [])
    .map((npc, index) => ({ npc, index }))
    .filter(({ npc }) => Array.isArray(npc?.pregnancy?.fetus))
    .map(({ npc, index }) => ({ value: index, label: npc.nam ?? npc.description ?? index }));
}

function options({ game, controls }) {
  return fetusOptions(game.get(`NPCName.${controls.value('npc')}.pregnancy`));
}

export const namedNpcAbortionCheat = createCheat({
  id: 'world.named-npc-abortion',
  location: { section: 'misc', group: 'pregnancy-removal', order: 80 },
  meta: {
    label: 'Named NPC Pregnancy Removal',
    controls: [
      { key: 'npc', type: 'select', options: npcOptions, action: 'select' },
      { key: 'fetus', type: 'select', options, action: 'select' },
      { key: 'confirm', type: 'toggle', label: 'Confirm', intent: 'confirmation' },
      { key: 'remove', type: 'button', label: 'Remove', action: 'remove' },
    ],
  },
  requiredPaths: ['NPCName'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    remove({ game, controls }) {
      if (!confirmed(controls))
        return { ok: false, kind: 'blocked', message: destructiveConfirmation };
      const path = `NPCName.${controls.value('npc')}.pregnancy`;
      const pregnancy = game.get(path);
      if (!removeFetus(pregnancy, controls.value('fetus')))
        return { ok: false, kind: 'validation', message: 'No fetus is available.' };
      game.set(path, pregnancy);
      controls.setValue('confirm', false);
      return { ok: true, message: 'Named NPC pregnancy removed.', refresh: true };
    },
  },
});
