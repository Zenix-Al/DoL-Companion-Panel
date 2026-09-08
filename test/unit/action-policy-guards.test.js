/* eslint-disable no-restricted-syntax */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createDomWithSugarCube } from '../helpers/dom-test-env.js';

function clearRegisteredActions({ getKeys, unregister, clearErrorHook }) {
  getKeys().forEach((key) => unregister(key));
  clearErrorHook();
}

test('dispatchUiAction blocks unknown actions', async () => {
  const env = createDomWithSugarCube({ passage: 'Town' });
  const { dispatchUiAction } = await import('../../src/app/commands/ui-action-dispatch.js');
  const { getKeys, unregister, clearErrorHook } = await import(
    '../../src/core/actions/dispatcher.js'
  );

  try {
    const ok = dispatchUiAction('unknown_action');
    assert.equal(ok, false);
  } finally {
    clearRegisteredActions({ getKeys, unregister, clearErrorHook });
    env.cleanup();
  }
});

test('dispatchUiAction blocks non-allowlisted actions in Start passage', async () => {
  const env = createDomWithSugarCube({ passage: 'Start' });
  const { dispatchUiAction } = await import('../../src/app/commands/ui-action-dispatch.js');
  const { register, getKeys, unregister, clearErrorHook } = await import(
    '../../src/core/actions/dispatcher.js'
  );

  let called = 0;
  register('custom_action', () => {
    called += 1;
  });

  try {
    const ok = dispatchUiAction('custom_action');
    assert.equal(ok, false);
    assert.equal(called, 0);
  } finally {
    clearRegisteredActions({ getKeys, unregister, clearErrorHook });
    env.cleanup();
  }
});

test('dispatchUiAction allows allowlisted actions in Start passage', async () => {
  const env = createDomWithSugarCube({ passage: 'Start' });
  const { dispatchUiAction } = await import('../../src/app/commands/ui-action-dispatch.js');
  const { register, getKeys, unregister, clearErrorHook } = await import(
    '../../src/core/actions/dispatcher.js'
  );

  let called = 0;
  register('save_data', () => {
    called += 1;
  });

  try {
    const ok = dispatchUiAction('save_data');
    assert.equal(ok, true);
    assert.equal(called, 1);
  } finally {
    clearRegisteredActions({ getKeys, unregister, clearErrorHook });
    env.cleanup();
  }
});

test('dispatchUiAction enforces destructive confirmation', async () => {
  const env = createDomWithSugarCube({ passage: 'Town' });
  const { dispatchUiAction } = await import('../../src/app/commands/ui-action-dispatch.js');
  const { register, getKeys, unregister, clearErrorHook } = await import(
    '../../src/core/actions/dispatcher.js'
  );

  let called = 0;
  env.window.confirm = () => false;

  register('purgeNPCBaby', () => {
    called += 1;
  });

  try {
    const ok = dispatchUiAction('purgeNPCBaby');
    assert.equal(ok, false);
    assert.equal(called, 0);
  } finally {
    clearRegisteredActions({ getKeys, unregister, clearErrorHook });
    env.cleanup();
  }
});
