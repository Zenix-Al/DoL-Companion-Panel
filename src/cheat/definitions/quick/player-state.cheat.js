import { createCheat } from '../../create-cheat.js';

const RECOVERED = Object.freeze({
  pain: 0,
  arousal: 0,
  tiredness: 0,
  stress: 0,
  trauma: 0,
  control: 1000,
  drunk: 0,
  drugged: 0,
  hallucinogen: 0,
});
const RUINED = Object.freeze({
  pain: 200,
  arousal: 10000,
  tiredness: 2000,
  stress: 10000,
  trauma: 5000,
  control: 0,
  drunk: 1000,
  drugged: 1000,
  hallucinogen: 1000,
});

function applyValues(game, values) {
  for (const [path, value] of Object.entries(values)) game.set(path, value);
}

export const playerStateCheat = createCheat({
  id: 'quick.player-state',
  location: { section: 'quick', group: 'state', order: 1 },
  meta: {
    label: 'Player State',
    controls: [
      { key: 'recover', type: 'button', label: 'Recover', action: 'recover' },
      { key: 'ruin', type: 'button', label: 'Ruin', action: 'ruin' },
    ],
  },
  requiredPaths: Object.keys(RECOVERED),
  actions: {
    recover({ game }) {
      applyValues(game, RECOVERED);
      return { ok: true, message: 'Player recovered.' };
    },
    ruin({ game }) {
      applyValues(game, RUINED);
      return { ok: true, message: 'Player ruined.' };
    },
  },
});
