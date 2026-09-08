import { createCheat } from '../../create-cheat.js';

function numericCrimes(game) {
  return Object.entries(game.get('crime') ?? {}).filter(([, crime]) =>
    Number.isFinite(Number.parseInt(crime?.current, 10))
  );
}

export const crimeCheat = createCheat({
  id: 'player.crime',
  location: { section: 'stats', group: 'player', order: 60 },
  meta: {
    label: 'Crime',
    controls: [
      { key: 'current', type: 'text', intent: 'status' },
      { key: 'reduce', type: 'button', label: '-100', action: 'reduce' },
      { key: 'increase', type: 'button', label: '+100', action: 'increase' },
    ],
  },
  requiredPaths: ['crime'],
  refresh: ['mount', 'section-open'],
  actions: {
    reduce({ game }) {
      const entries = numericCrimes(game);
      if (!entries.length) return { ok: false, kind: 'blocked', message: 'No crime data.' };
      const value = Number.parseInt(
        (entries.reduce((sum, [, crime]) => sum + Number.parseInt(crime.current, 10), 0) - 100) /
          entries.length,
        10
      );
      for (const [key] of entries) {
        for (const field of ['current', 'count', 'countHistory', 'history'])
          game.set(`crime.${key}.${field}`, value);
      }
      return { ok: true, message: 'Crime reduced.', refresh: true };
    },
    increase({ game }) {
      const entries = numericCrimes(game);
      if (!entries.length) return { ok: false, kind: 'blocked', message: 'No crime data.' };
      const value = Number.parseInt(
        (entries.reduce((sum, [, crime]) => sum + Number.parseInt(crime.current, 10), 0) + 100) /
          entries.length,
        10
      );
      for (const [key] of entries) game.set(`crime.${key}.current`, value);
      return { ok: true, message: 'Crime increased.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text(
      'current',
      numericCrimes(game).reduce((sum, [, crime]) => sum + Number.parseInt(crime.current, 10), 0)
    );
  },
});
