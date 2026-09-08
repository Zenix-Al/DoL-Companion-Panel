import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFullDescriptor,
  createOneShotDescriptor,
  supportedCheatCases,
} from '../contracts/cheat-contract-cases.js';
import {
  CHEAT_CONTRACT_CONSTANTS,
  validateCheatDefinition,
} from '../../src/cheat/create-cheat.js';

const validateCheatDescriptorContract = validateCheatDefinition;
const cheatContractConstants = CHEAT_CONTRACT_CONSTANTS;

test('descriptor contract accepts every supported cheat classification', async (t) => {
  for (const contractCase of supportedCheatCases) {
    await t.test(contractCase.classification, () => {
      const descriptor = contractCase.create();
      assert.equal(validateCheatDescriptorContract(descriptor), descriptor);
    });
  }
});

test('descriptor contract accepts the complete optional-field surface', () => {
  const descriptor = createFullDescriptor();
  assert.equal(validateCheatDescriptorContract(descriptor), descriptor);
  assert.deepEqual(cheatContractConstants.sections, ['quick', 'stats', 'misc']);
  assert.deepEqual(cheatContractConstants.toggleCadences, ['frame', 'daily']);
});

const malformedCases = [
  {
    name: 'plain descriptor object',
    create: () => null,
    error: /plain object/,
  },
  {
    name: 'known top-level property',
    create: () => createOneShotDescriptor({ typoProperty: true }),
    error: /Unknown cheat descriptor field "typoProperty"/,
  },
  {
    name: 'stable id',
    create: () => createOneShotDescriptor({ id: '' }),
    error: /Cheat id must be a non-empty string/,
  },
  {
    name: 'lowercase namespaced id',
    create: () => createOneShotDescriptor({ id: 'Money' }),
    error: /lowercase namespaced id/,
  },
  {
    name: 'location object',
    create: () => createOneShotDescriptor({ location: null }),
    error: /location must be a plain object/,
  },
  {
    name: 'supported section',
    create: () =>
      createOneShotDescriptor({
        location: { section: 'settings', group: 'contract', order: 10 },
      }),
    error: /unsupported section/,
  },
  {
    name: 'finite placement order',
    create: () =>
      createOneShotDescriptor({
        location: { section: 'quick', group: 'contract', order: Number.NaN },
      }),
    error: /location\.order must be finite/,
  },
  {
    name: 'metadata label',
    create: () =>
      createOneShotDescriptor({
        meta: { label: '', controls: [{ key: 'run', type: 'button', action: 'run' }] },
      }),
    error: /meta\.label must be a non-empty string/,
  },
  {
    name: 'non-empty controls',
    create: () => createOneShotDescriptor({ meta: { label: 'Empty', controls: [] } }),
    error: /meta\.controls must be a non-empty array/,
  },
  {
    name: 'confirmation message',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Confirm',
          confirmation: '',
          controls: [{ key: 'run', type: 'button', action: 'run' }],
        },
      }),
    error: /meta\.confirmation must be a non-empty string/,
  },
  {
    name: 'unique local control keys',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Duplicate',
          controls: [
            { key: 'run', type: 'button', action: 'run' },
            { key: 'run', type: 'button', action: 'run' },
          ],
        },
      }),
    error: /duplicate control key "run"/,
  },
  {
    name: 'supported control type',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Invalid control',
          controls: [{ key: 'run', type: 'magic', action: 'run' }],
        },
      }),
    error: /has invalid type/,
  },
  {
    name: 'supported control intent',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Invalid intent',
          controls: [{ key: 'run', type: 'button', action: 'run', intent: 'danger' }],
        },
      }),
    error: /invalid intent/,
  },
  {
    name: 'confirmation intent uses a toggle',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Invalid confirmation',
          controls: [{ key: 'value', type: 'input', intent: 'confirmation' }],
        },
      }),
    error: /confirmation control must be a toggle/,
  },
  {
    name: 'status intent uses text',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Invalid status',
          controls: [{ key: 'value', type: 'input', intent: 'status' }],
        },
      }),
    error: /status control must be text/,
  },
  {
    name: 'binding path',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Invalid binding',
          controls: [{ key: 'value', type: 'input', binding: { path: '' } }],
        },
      }),
    error: /binding path must be a non-empty string/,
  },
  {
    name: 'local action resolution',
    create: () =>
      createOneShotDescriptor({
        meta: {
          label: 'Missing action',
          controls: [{ key: 'run', type: 'button', action: 'missing' }],
        },
      }),
    error: /references missing local action "missing"/,
  },
  {
    name: 'action handler function',
    create: () => createOneShotDescriptor({ actions: { run: 'not-a-function' } }),
    error: /action "run" must be a function/,
  },
  {
    name: 'at least one executable contribution',
    create: () =>
      createOneShotDescriptor({
        meta: { label: 'Inert', controls: [{ key: 'value', type: 'text' }] },
        actions: {},
      }),
    error: /requires actions, effect, or sync/,
  },
  {
    name: 'known refresh reason',
    create: () => createOneShotDescriptor({ refresh: ['whenever'] }),
    error: /invalid refresh reason "whenever"/,
  },
  {
    name: 'unique refresh reasons',
    create: () => createOneShotDescriptor({ refresh: ['mount', 'mount'] }),
    error: /refresh contains duplicate "mount"/,
  },
  {
    name: 'effect paired with toggle',
    create: () => createOneShotDescriptor({ effect: () => undefined }),
    error: /effect requires toggle configuration/,
  },
  {
    name: 'toggle cadence',
    create: () => ({
      ...supportedCheatCases[4].create(),
      toggle: { cadence: 'interval' },
    }),
    error: /invalid toggle cadence/,
  },
  {
    name: 'toggle effect',
    create: () => ({ ...supportedCheatCases[4].create(), effect: undefined }),
    error: /toggle requires effect/,
  },
  {
    name: 'toggle control',
    create: () => ({
      ...supportedCheatCases[4].create(),
      meta: { label: 'No toggle control', controls: [{ key: 'current', type: 'text' }] },
    }),
    error: /toggle requires a toggle control/,
  },
  {
    name: 'non-negative toggle cooldown',
    create: () => ({
      ...supportedCheatCases[4].create(),
      toggle: { cadence: 'frame', cooldownMs: -1 },
    }),
    error: /cooldownMs must be non-negative/,
  },
  {
    name: 'positive toggle failure limit',
    create: () => ({
      ...supportedCheatCases[4].create(),
      toggle: { cadence: 'frame', maxFailures: 0 },
    }),
    error: /maxFailures must be a positive integer/,
  },
  {
    name: 'boolean activation policy',
    create: () => ({
      ...supportedCheatCases[4].create(),
      toggle: { cadence: 'frame', runOnActivate: 'yes' },
    }),
    error: /runOnActivate must be boolean/,
  },
  {
    name: 'lifecycle callback function',
    create: () => createOneShotDescriptor({ onEnable: true }),
    error: /onEnable must be a function/,
  },
  {
    name: 'unique required paths',
    create: () => createOneShotDescriptor({ requiredPaths: ['money', 'money'] }),
    error: /requiredPaths contains duplicate "money"/,
  },
  {
    name: 'config path array',
    create: () => createOneShotDescriptor({ config: 'toggles.enabled' }),
    error: /config must be an array/,
  },
  {
    name: 'retired legacy property',
    create: () => createOneShotDescriptor({ legacy: {} }),
    error: /Unknown cheat descriptor field "legacy"/,
  },
];

test('descriptor contract rejects malformed definitions with actionable errors', async (t) => {
  for (const contractCase of malformedCases) {
    await t.test(contractCase.name, () => {
      assert.throws(
        () => validateCheatDescriptorContract(contractCase.create()),
        contractCase.error
      );
    });
  }
});
