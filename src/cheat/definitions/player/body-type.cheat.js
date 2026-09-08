import { createCheat } from '../../create-cheat.js';

const TYPES = Object.freeze({ Masculine: 'm', Feminine: 'f', Androgynous: 'a' });
const LABELS = Object.freeze({ m: 'Masculine', f: 'Feminine', a: 'Androgynous' });

export const bodyTypeCheat = createCheat({
  id: 'player.body-type',
  location: { section: 'stats', group: 'player', order: 30 },
  meta: {
    label: 'Natural Features',
    controls: [
      { key: 'type', type: 'select', options: Object.keys(TYPES) },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['player.gender_body'],
  refresh: ['mount', 'section-open'],
  actions: {
    set({ game, controls }) {
      const value = TYPES[controls.value('type')];
      if (!value) return { ok: false, kind: 'validation', message: 'Unknown body type.' };
      game.set('player.gender_body', value);
      return { ok: true, message: 'Body type updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.setValue('type', LABELS[game.get('player.gender_body')] ?? 'Androgynous');
  },
});
