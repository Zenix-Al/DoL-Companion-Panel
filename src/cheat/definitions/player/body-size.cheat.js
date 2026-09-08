import { createCheat } from '../../create-cheat.js';

const BODY_SIZES = Object.freeze({ Tiny: 0, Small: 1, Normal: 2, Large: 3 });
const BODY_LABELS = Object.freeze(['Tiny', 'Small', 'Normal', 'Large']);

export const bodySizeCheat = createCheat({
  id: 'player.body-size',
  location: { section: 'stats', group: 'player', order: 20 },
  meta: {
    label: 'Body Size',
    controls: [
      { key: 'size', type: 'select', options: Object.keys(BODY_SIZES) },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['bodysize'],
  refresh: ['mount', 'section-open', 'after-action'],
  actions: {
    set({ game, controls }) {
      const selected = controls.value('size');
      if (!Object.hasOwn(BODY_SIZES, selected)) {
        return { ok: false, kind: 'validation', message: 'Unknown body size.' };
      }
      game.set('bodysize', BODY_SIZES[selected]);
      return { ok: true, message: 'Body size updated.' };
    },
  },
  sync({ game, controls }) {
    controls.setValue('size', BODY_LABELS[game.get('bodysize')] ?? BODY_LABELS[2]);
  },
});
