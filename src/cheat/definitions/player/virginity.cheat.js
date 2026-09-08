import { createCheat } from '../../create-cheat.js';

const TYPES = Object.freeze(['anal', 'oral', 'penile', 'vaginal', 'temple', 'handholding', 'kiss']);

export const virginityCheat = createCheat({
  id: 'player.virginity',
  location: { section: 'stats', group: 'player', order: 50 },
  meta: {
    label: 'Virginity',
    controls: [
      { key: 'type', type: 'select', options: TYPES, action: 'select' },
      { key: 'current', type: 'text', intent: 'status' },
      { key: 'restore', type: 'button', label: 'Restore', action: 'restore' },
      { key: 'pure', type: 'button', label: 'Pure', action: 'pure' },
    ],
  },
  requiredPaths: ['player.virginity'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    restore({ game, controls }) {
      game.set(`player.virginity.${controls.value('type')}`, true);
      return { ok: true, message: 'Virginity restored.', refresh: true };
    },
    pure({ game }) {
      for (const type of TYPES) game.set(`player.virginity.${type}`, true);
      return { ok: true, message: 'Purity applied.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text(
      'current',
      game.get(`player.virginity.${controls.value('type')}`) ? 'Pure' : 'Taken'
    );
  },
});
