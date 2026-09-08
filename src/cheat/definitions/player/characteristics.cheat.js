import { characteristics } from '../../data/game-data.js';
import { createCheat } from '../../create-cheat.js';

function integer(controls, key) {
  return Number.parseInt(controls.value(key), 10);
}

export const characteristicsCheat = createCheat({
  id: 'player.characteristics',
  location: { section: 'stats', group: 'player', order: 80 },
  meta: {
    label: 'Characteristics',
    controls: [
      { key: 'characteristic', type: 'select', options: characteristics, action: 'select' },
      { key: 'characteristicValue', type: 'input' },
      { key: 'setCharacteristic', type: 'button', label: 'Set', action: 'setCharacteristic' },
    ],
  },
  requiredPaths: [...characteristics],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    setCharacteristic({ game, controls }) {
      const value = integer(controls, 'characteristicValue');
      if (Number.isNaN(value))
        return { ok: false, kind: 'validation', message: 'Input is not a number.' };
      game.set(controls.value('characteristic'), value);
      return { ok: true, message: 'Characteristic updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.setValue('characteristicValue', game.get(controls.value('characteristic')));
  },
});
