# Cheat descriptor authoring

Create one named `*Cheat` export in `src/cheat/definitions/<domain>/*.cheat.js` using `createCheat()` from `src/cheat/create-cheat.js`.

```js
import { createCheat } from '../../create-cheat.js';

export const exampleCheat = createCheat({
  id: 'player.example',
  location: { section: 'stats', group: 'player', order: 10 },
  meta: {
    label: 'Example',
    controls: [
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['example'],
  refresh: ['mount', 'section-open', 'after-action'],
  actions: {
    set({ game, controls }) {
      const value = Number(controls.value('value'));
      if (!Number.isFinite(value)) {
        return { ok: false, kind: 'validation', message: 'Enter a number.' };
      }
      game.set('example', value);
      return { ok: true, message: 'Example updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.setValue('value', game.get('example'));
  },
});
```

Callbacks receive `game`, declared `config`, descriptor-scoped `controls`, allowed `services`, `signal`, `event`, and `reason`. Never read SugarCube globals directly. Use dynamic `options(context)` for dropdowns and return `{ refresh: true }` when selection changes dependent controls. Add `runtime-tick` only for values that change outside panel actions.

Repeating behavior adds a toggle control, `toggle: { cadence: 'frame' | 'daily', ... }`, and `effect(context)`. Stable IDs are persisted; labels are not identities.

```text
npm run generate:cheat-manifest
npm run check:cheat-manifest
npm test
```

Add focused unit, integration, or parity coverage. Do not add global aliases, aggregate fetchers, or compatibility registries.
