import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheat } from '../../src/cheat/create-cheat.js';
import { mountCheatDescriptor } from '../../src/cheat/runtime/renderer.js';
import { createSyncTelemetry } from '../../src/cheat/runtime/sync-telemetry.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { createFakeGameAdapter } from '../helpers/fake-game-adapter.js';

const config = { get() {}, set() {} };
const location = { section: 'stats', group: 'phase0', order: 1 };

test('bound text, select, and checkbox edits survive tick, section, and action refreshes', async () => {
  const env = createDomWithSugarCube();
  const telemetry = createSyncTelemetry();
  const descriptor = createCheat({
    id: 'test.phase0-edit-protection',
    location,
    meta: {
      label: 'Editing baseline',
      controls: [
        { key: 'text', type: 'input', binding: { path: 'text' } },
        { key: 'choice', type: 'select', options: ['a', 'b'], binding: { path: 'choice' } },
        { key: 'flag', type: 'toggle', intent: 'confirmation', binding: { path: 'flag' } },
        { key: 'apply', type: 'button', label: 'Apply', action: 'apply' },
      ],
    },
    refresh: ['mount', 'runtime-tick', 'section-open', 'after-action'],
    actions: { apply: () => ({ ok: true }) },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter({ variables: { text: 'game', choice: 'a', flag: false } }).game,
    config,
    services: { syncTelemetry: telemetry },
  });
  try {
    const edits = { text: 'draft', choice: 'b', flag: true };
    for (const [key, value] of Object.entries(edits)) {
      mounted.controls.setValue(key, value);
      mounted.controls.element(key).dispatchEvent(new env.window.Event('input'));
    }
    await mounted.runtimeTick();
    await mounted.sectionOpened();
    await mounted.runAction('apply');
    assert.deepEqual(
      Object.fromEntries(Object.keys(edits).map((key) => [key, mounted.controls.value(key)])),
      edits
    );
    assert.equal(telemetry.snapshot().stats.suppressedWrites, 9);

    mounted.root.hidden = true;
    await mounted.runtimeTick();
    assert.equal(telemetry.snapshot().stats.skippedHidden, 1);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('descriptor-owned sync cannot overwrite an active dirty input', async () => {
  const env = createDomWithSugarCube();
  const descriptor = createCheat({
    id: 'test.phase0-direct-sync-overwrite',
    location: { ...location, order: 2 },
    meta: { label: 'Direct sync baseline', controls: [{ key: 'value', type: 'input' }] },
    refresh: ['runtime-tick'],
    sync({ controls }) {
      controls.setValue('value', 'game');
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config,
  });
  try {
    mounted.controls.setValue('value', 'draft');
    mounted.controls.element('value').focus();
    mounted.controls.element('value').dispatchEvent(new env.window.Event('input'));
    await mounted.runtimeTick();
    assert.equal(mounted.controls.value('value'), 'draft');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('runtime synchronization pauses during an action and coalesces one post-action refresh', async () => {
  const env = createDomWithSugarCube();
  let releaseAction;
  const actionGate = new Promise((resolve) => {
    releaseAction = resolve;
  });
  const syncReasons = [];
  const descriptor = createCheat({
    id: 'test.phase1-action-refresh',
    location: { ...location, order: 3 },
    meta: {
      label: 'Action refresh',
      controls: [{ key: 'apply', type: 'button', label: 'Apply', action: 'apply' }],
    },
    refresh: ['runtime-tick', 'after-action'],
    actions: {
      async apply() {
        await actionGate;
        return { ok: true };
      },
    },
    sync({ reason }) {
      syncReasons.push(reason);
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config,
  });
  try {
    const action = mounted.runAction('apply');
    await Promise.resolve();
    assert.equal(await mounted.runtimeTick(), false);
    releaseAction();
    await action;
    assert.deepEqual(syncReasons, ['after-action']);
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});

test('development logger warns when sync writes editable UI without a refresh policy', async () => {
  const env = createDomWithSugarCube();
  const warnings = [];
  const descriptor = createCheat({
    id: 'test.phase1-undeclared-sync',
    location: { ...location, order: 4 },
    meta: { label: 'Undeclared sync', controls: [{ key: 'value', type: 'input' }] },
    sync({ controls }) {
      controls.setValue('value', 'game');
    },
  });
  const mounted = await mountCheatDescriptor({
    descriptor,
    document: env.document,
    adapter: createFakeGameAdapter().game,
    config,
    services: { logger: { warn: (message, data) => warnings.push({ message, data }) } },
  });
  try {
    await mounted.sync();
    await mounted.sync();
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].data.cheatId, descriptor.id);
    assert.equal(warnings[0].data.controlKey, 'value');
  } finally {
    await mounted.dispose();
    env.cleanup();
  }
});
