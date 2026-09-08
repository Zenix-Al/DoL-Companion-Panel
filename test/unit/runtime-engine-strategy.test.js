import test from 'node:test';
import assert from 'node:assert/strict';

import { GAME_VERSION_ELEMENT_ID } from '../../src/platform/sugarcube/constants.js';
import {
  ensureActiveRuntimeEngine,
  getActiveRuntimeEngine,
  getRegisteredRuntimeEngines,
  setActiveRuntimeEngine,
} from '../../src/platform/runtime-engine-registry.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';

test('runtime engine registry resolves SugarCube profile and prerequisite states', async () => {
  const env = createDomWithSugarCube({ passage: 'Town', vars: { money: 10 } });

  try {
    setActiveRuntimeEngine(null);

    const engineIds = getRegisteredRuntimeEngines().map((engine) => engine.id);
    assert.equal(engineIds.includes('sugarcube'), true);
    assert.equal(engineIds.includes('renpy-web'), true);

    let runtimeEngine = ensureActiveRuntimeEngine();
    assert.ok(runtimeEngine);
    assert.equal(runtimeEngine.id, 'sugarcube');
    assert.equal(runtimeEngine.hasCorePrerequisites(), true);
    assert.equal(runtimeEngine.hasRuntimePrerequisites(), false);

    env.window.SugarCube.setup.NPCNameList = [];
    const versionEl = env.document.createElement('div');
    versionEl.id = GAME_VERSION_ELEMENT_ID;
    env.document.body.appendChild(versionEl);

    runtimeEngine = getActiveRuntimeEngine();
    assert.ok(runtimeEngine);
    assert.equal(runtimeEngine.hasRuntimePrerequisites(), true);
    assert.deepEqual(runtimeEngine.describePrerequisiteState(), {
      sugarCubeDefined: true,
      sugarCubeState: true,
      sugarCubeVariables: true,
      sugarCubeSetup: true,
      npcList: true,
      versionElement: true,
    });
  } finally {
    setActiveRuntimeEngine(null);
    env.cleanup();
  }
});
