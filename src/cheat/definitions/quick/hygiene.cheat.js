import { createCheat } from '../../create-cheat.js';

function fillBodyLiquid(game, amount) {
  const bodyLiquid = game.get('player.bodyliquid');
  if (!bodyLiquid || typeof bodyLiquid !== 'object') return false;
  for (const [outer, values] of Object.entries(bodyLiquid)) {
    if (!values || typeof values !== 'object') continue;
    for (const inner of Object.keys(values))
      game.set(`player.bodyliquid.${outer}.${inner}`, amount);
  }
  return true;
}

export const hygieneCheat = createCheat({
  id: 'quick.hygiene',
  location: { section: 'quick', group: 'state', order: 60 },
  meta: {
    label: 'Hygiene',
    controls: [
      { key: 'clean', type: 'button', label: 'Clean', action: 'clean' },
      { key: 'dirty', type: 'button', label: 'Dirty', action: 'dirty' },
      { key: 'urethra', type: 'button', label: 'Clean urethral cum', action: 'urethra' },
    ],
  },
  actions: {
    clean({ game }) {
      return fillBodyLiquid(game, 0)
        ? { ok: true, message: 'Body liquids cleaned.' }
        : { ok: false, kind: 'validation', message: 'Body-liquid data is unavailable.' };
    },
    dirty({ game }) {
      return fillBodyLiquid(game, 100)
        ? { ok: true, message: 'Body liquids filled.' }
        : { ok: false, kind: 'validation', message: 'Body-liquid data is unavailable.' };
    },
    urethra({ game }) {
      if (!Array.isArray(game.get('sexStats.vagina.sperm')))
        return { ok: false, kind: 'validation', message: 'Vaginal sperm data is unavailable.' };
      game.set('sexStats.vagina.sperm', []);
      return { ok: true, message: 'Urethral cum cleaned.' };
    },
  },
});
