import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultDetectLoadTrigger } from '../../src/app/observers/runtime-observer-policy.js';

function macroButton(text) {
  return {
    textContent: text,
    innerHTML: text,
    classList: { contains: (cls) => cls === 'macro-button' },
  };
}

test('defaultDetectLoadTrigger treats the SAVES macro button as a load event', () => {
  assert.equal(defaultDetectLoadTrigger(macroButton('SAVES')), true);
});

test('defaultDetectLoadTrigger does not detect other macro-button labels', () => {
  assert.equal(defaultDetectLoadTrigger(macroButton('LOAD')), false);
});
