import { createCheat } from '../../create-cheat.js';

import { hydrateInput, selectAndRefresh, setInteger } from './farm-editor-helpers.js';

function animalOptions({ game }) {
  return Object.keys(game.get('farm.beasts') ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
}

const selectedPath = (controls) => `farm.beasts.${controls.value('animal')}`;

export const farmAnimalAffinityCheat = createCheat({
  id: 'world.farm-animal-affinity',
  location: { section: 'misc', group: 'farm', order: 100 },
  meta: {
    label: 'Farm Animal Affinity',
    controls: [
      { key: 'animal', type: 'select', options: animalOptions, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['farm.beasts'],
  refresh: ['mount', 'section-open', 'runtime-tick'],
  actions: {
    select: selectAndRefresh,
    set({ game, controls }) {
      return setInteger({
        game,
        controls,
        path: selectedPath(controls),
        label: 'Animal affinity',
      });
    },
  },
  sync({ game, controls }) {
    hydrateInput({ game, controls, path: selectedPath(controls) });
  },
});
