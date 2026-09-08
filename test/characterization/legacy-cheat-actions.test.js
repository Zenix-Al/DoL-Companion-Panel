/* eslint-disable no-restricted-syntax */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createDomWithSugarCube } from '../helpers/dom-test-env.js';
import { applyLegacyInfiniteArousal } from '../fixtures/legacy-toggle-effects.js';

test('legacy infinite-arousal effect restores arousal every time it runs', async () => {
  const env = createDomWithSugarCube({ vars: { arousal: 25 } });

  try {
    applyLegacyInfiniteArousal(env.variables);
    assert.equal(env.variables.arousal, 10000);

    env.variables.arousal = 40;
    applyLegacyInfiniteArousal(env.variables);
    assert.equal(env.variables.arousal, 10000);
  } finally {
    env.cleanup();
  }
});
