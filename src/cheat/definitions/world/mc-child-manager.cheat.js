import { createCheat } from '../../create-cheat.js';

import { destructiveConfirmation } from './pregnancy-editor-helpers.js';

const PROPERTIES = [
  { value: 'name', label: 'Name' },
  { value: 'motherKnown', label: 'Mother Known' },
  { value: 'fatherKnown', label: 'Father Known' },
  { value: 'abandon', label: 'Abandon Selected' },
];

function childOptions({ game }) {
  return Object.entries(game.get('children') ?? {}).map(([key, child]) => ({
    value: key,
    label: child?.name ?? key,
  }));
}

function selectedChild({ game, controls }) {
  const key = controls.value('child');
  return key ? game.get(`children.${key}`) : undefined;
}

function setChildControlsVisible(controls, visible) {
  for (const key of ['property', 'value', 'summary', 'confirm', 'set', 'purge']) {
    controls.element(key).closest('.cp-cheat-control-unit').hidden = !visible;
  }
}

export const mcChildManagerCheat = createCheat({
  id: 'world.mc-child-manager',
  location: { section: 'misc', group: 'offspring', order: 60 },
  meta: {
    label: 'MC Child Manager',
    controls: [
      {
        key: 'child',
        type: 'select',
        options: childOptions,
        fallbackOptions: [{ value: '', label: 'No children' }],
        action: 'select',
      },
      { key: 'property', type: 'select', options: PROPERTIES, action: 'select' },
      { key: 'value', type: 'input' },
      { key: 'summary', type: 'text' },
      { key: 'confirm', type: 'toggle', label: 'Confirm deletion', intent: 'confirmation' },
      { key: 'set', type: 'button', label: 'Apply', action: 'set' },
      { key: 'purge', type: 'button', label: 'Abandon All', action: 'purge' },
    ],
  },
  requiredPaths: ['children'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set({ game, controls }) {
      const key = controls.value('child');
      const property = controls.value('property');
      if (!key || !selectedChild({ game, controls }))
        return { ok: false, kind: 'validation', message: 'Select an existing child.' };
      if (property === 'abandon') {
        if (!controls.checked('confirm'))
          return { ok: false, kind: 'blocked', message: destructiveConfirmation };
        const children = { ...(game.get('children') ?? {}) };
        delete children[key];
        game.set('children', children);
        controls.setValue('confirm', false);
        return { ok: true, message: 'Child abandoned.', refresh: true };
      }
      const input = controls.element('value');
      const value = property === 'name' ? controls.value('value') : Boolean(input.checked);
      game.set(`children.${key}.${property}`, value);
      return { ok: true, message: 'Child information updated.', refresh: true };
    },
    purge({ game, controls }) {
      if (!controls.checked('confirm'))
        return { ok: false, kind: 'blocked', message: destructiveConfirmation };
      game.set('children', {});
      controls.setValue('confirm', false);
      return { ok: true, message: 'All children abandoned.', refresh: true };
    },
  },
  sync(context) {
    const child = selectedChild(context);
    setChildControlsVisible(context.controls, Boolean(child));
    if (!child) return;
    const property = context.controls.value('property');
    const input = context.controls.element('value');
    const booleanInput = property !== 'name';
    input.type = booleanInput ? 'checkbox' : 'text';
    if (booleanInput) input.checked = property === 'abandon' ? false : Boolean(child?.[property]);
    else context.controls.setValue('value', child?.name ?? '');
    context.controls.text(
      'summary',
      `${child.name ?? ''} · ${child.mother ?? 'unknown mother'} · ${
        child.father ?? 'unknown father'
      } · ${child.birthLocation ?? 'unknown location'}`
    );
  },
});
