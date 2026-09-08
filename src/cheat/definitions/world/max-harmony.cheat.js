import { createCheat } from '../../create-cheat.js';

export const maxHarmonyCheat = createCheat({
  id: 'world.max-harmony',
  location: { section: 'misc', group: 'world', order: 10 },
  meta: {
    label: 'Wolfpack',
    controls: [
      { key: 'harmony', type: 'button', label: 'Max Harmony', action: 'harmony' },
      { key: 'ferocity', type: 'button', label: 'Max Ferocity', action: 'ferocity' },
    ],
  },
  actions: {
    harmony({ game }) {
      game.set('wolfpackharmony', 22);
      return { ok: true, message: 'Wolfpack harmony maximized.' };
    },
    ferocity({ game }) {
      game.set('wolfpackferocity', 22);
      return { ok: true, message: 'Wolfpack ferocity maximized.' };
    },
  },
});
