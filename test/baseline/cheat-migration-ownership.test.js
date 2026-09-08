import test from 'node:test';
import assert from 'node:assert/strict';

import { cheatCatalog } from '../../src/cheat/index.js';

import { legacyCheatInventory } from './legacy-cheat-inventory.js';
import {
  cheatMigrationOwnership,
  validateCheatMigrationOwnership,
} from './cheat-migration-ownership.js';

function descriptorOwnership(overrides = {}) {
  return {
    id: 'test.migrated',
    legacyActive: false,
    descriptorActive: true,
    descriptorId: 'test.migrated',
    coexistence: null,
    parityEvidence: 'test/parity/test.migrated.test.js',
    pocParityEvidence: '',
    discoveredBugs: [],
    ...overrides,
  };
}

test('migration ownership inventory tracks exactly one active owner per logical cheat', () => {
  const expectedIds = legacyCheatInventory.map((entry) => entry.id);
  const result = validateCheatMigrationOwnership(cheatMigrationOwnership, { expectedIds });

  assert.equal(result.total, legacyCheatInventory.length);
  assert.equal(
    cheatMigrationOwnership.every(
      (entry) => entry.legacyActive !== entry.descriptorActive && entry.coexistence === null
    ),
    true
  );
  assert.equal(
    cheatMigrationOwnership
      .filter(({ candidateDescriptorId }) => candidateDescriptorId)
      .every(({ descriptorActive, descriptorId, candidateDescriptorId, parityEvidence }) =>
        Boolean(descriptorActive && descriptorId === candidateDescriptorId && parityEvidence)
      ),
    true
  );
  assert.deepEqual(
    cheatMigrationOwnership
      .filter((entry) => entry.pocParityEvidence)
      .map((entry) => entry.id)
      .sort(),
    ['moneyset', 'unliarousal']
  );
  assert.deepEqual(
    cheatMigrationOwnership
      .filter((entry) => entry.candidateDescriptorId)
      .map((entry) => [entry.id, entry.candidateDescriptorId]),
    [
      ['max_harmony', 'world.max-harmony'],
      ['max_Ferocity', 'world.max-harmony'],
      ['vow-virgin', 'quick.temple-vow'],
      ['arousal_player', 'quick.arousal'],
      ['arousal_enemy', 'quick.arousal'],
      ['sheesh', 'player.crime'],
      ['jk-lol', 'player.crime'],
      ['hesoyam', 'quick.player-state'],
      ['kill_player', 'quick.player-state'],
      ['statset', 'player.stats'],
      ['enemycalm', 'quick.enemy-state'],
      ['kill_enemy', 'quick.enemy-state'],
      ['statsete', 'player.enemy-stats'],
      ['moneyset', 'player.money'],
      ['sprayset', 'player.unlimited-spray'],
      ['bodyset', 'player.body-size'],
      ['bodytypeset', 'player.body-type'],
      ['ballsset', 'player.balls'],
      ['virginityset', 'player.virginity'],
      ['virginpure', 'player.virginity'],
      ['charaset', 'player.characteristics'],
      ['lactatingset', 'player.lactation'],
      ['cumset', 'player.cum'],
      ['milkset', 'player.milk'],
      ['cumrefil', 'player.cum'],
      ['milkrefil', 'player.milk'],
      ['changetraitbro', 'world.npc-trait-editor'],
      ['VrelCoinsUsage', 'world.vrel-coins-usage'],
      ['set_fame12', 'player.fame'],
      ['infect', 'player.parasites'],
      ['desinfect', 'player.parasites'],
      ['set_animal_like', 'world.farm-animal-affinity'],
      ['set_build_time', 'world.farm-build-time'],
      ['set_assault_time', 'world.farm-assault-time'],
      ['set_exam', 'player.exam'],
      ['set_talent', 'player.talent'],
      ['clean_cum', 'quick.hygiene'],
      ['check_fruit_selling', 'world.produce-sales-report'],
      ['set_school_rep', 'player.school-reputation'],
      ['named_npc_pregnancy_set', 'world.named-npc-pregnancy'],
      ['npc_pregnancy_set', 'world.stored-npc-pregnancy'],
      ['mc_pregnancy_set', 'world.mc-pregnancy'],
      ['mc_tentacle_set', 'world.mc-tentacle'],
      ['mc_baby_set', 'world.mc-child-manager'],
      ['set_hentai_skill', 'player.hentai-skill'],
      ['mc_abortion_set', 'world.mc-abortion'],
      ['named_npc_abortion_set', 'world.named-npc-abortion'],
      ['npc_abortion_set', 'world.stored-npc-abortion'],
      ['dirty_cum', 'quick.hygiene'],
      ['clean_cum_uretus', 'quick.hygiene'],
      ['in_game_cheat', 'quick.game-cheats'],
      ['alt_cheat', 'quick.game-cheats'],
      ['randomEncounterSet', 'quick.random-encounters'],
      ['npc_abortion_purge', 'world.stored-npc-abortion'],
      ['purgeNPCBaby', 'world.mc-child-manager'],
      ['testAll', 'developer.run-diagnostics'],
      ['maxchruchtask', 'world.maximum-church-tasks'],
      ['maxanimaltask', 'quick.maximum-stray-tasks'],
      ['edenshrooms', 'quick.eden-mushrooms'],
      ['edengarden', 'quick.eden-garden'],
      ['edenspring', 'quick.eden-spring'],
      ['edentimer', 'quick.eden-timer'],
      ['invinityNPCPregnancy', 'quick.infinite-npc-pregnancy'],
      ['virginity', 'quick.maintain-virginity'],
      ['purity', 'quick.maintain-purity'],
      ['unlicum', 'quick.unlimited-cum'],
      ['unliarousal', 'player.infinite-arousal'],
      ['everyone_horny', 'quick.everyone-horny'],
      ['farm_safe', 'quick.farm-safety'],
      ['interact_child', 'quick.auto-child-interaction'],
      ['pregnancy_detection', 'quick.pregnancy-detection'],
      ['invincibleAngel', 'quick.invincible-angel'],
      ['intenseCum', 'quick.intense-cum'],
      ['allNPCInstaPregnant', 'quick.maximum-npc-pregnancy-rate'],
      ['allNPCMultiplePregnancy', 'quick.multiple-npc-pregnancies'],
    ]
  );
});

test('generated catalog and migration candidates have no missing or orphan descriptors', () => {
  const candidates = new Set(
    cheatMigrationOwnership
      .map(({ candidateDescriptorId }) => candidateDescriptorId)
      .filter(Boolean)
  );
  const generated = new Set(cheatCatalog.listCheats().map(({ id }) => id));
  assert.deepEqual([...generated].sort(), [...candidates].sort());
});

test('ownership gate accepts descriptor-only ownership with parity evidence', () => {
  assert.doesNotThrow(() =>
    validateCheatMigrationOwnership([descriptorOwnership()], { expectedIds: ['test.migrated'] })
  );
});

test('ownership gate allows two active paths only with an explicit removal boundary', () => {
  const coexistence = descriptorOwnership({
    legacyActive: true,
    coexistence: {
      reason: 'Temporary action alias during the vertical slice.',
      removeLegacyAfter: 'Browser parity and external alias audit pass.',
    },
  });
  assert.doesNotThrow(() =>
    validateCheatMigrationOwnership([coexistence], { expectedIds: ['test.migrated'] })
  );

  assert.throws(
    () =>
      validateCheatMigrationOwnership(
        [descriptorOwnership({ legacyActive: true, coexistence: null })],
        { expectedIds: ['test.migrated'] }
      ),
    /two owners without a coexistence exception/
  );
});

test('ownership gate rejects ownerless, unevidenced, duplicate, and incomplete inventories', () => {
  assert.throws(
    () =>
      validateCheatMigrationOwnership(
        [descriptorOwnership({ legacyActive: false, descriptorActive: false })],
        { expectedIds: ['test.migrated'] }
      ),
    /has no active implementation owner/
  );
  assert.throws(
    () =>
      validateCheatMigrationOwnership([descriptorOwnership({ parityEvidence: '' })], {
        expectedIds: ['test.migrated'],
      }),
    /requires parity or intent evidence/
  );
  assert.throws(
    () =>
      validateCheatMigrationOwnership([descriptorOwnership(), descriptorOwnership()], {
        expectedIds: ['test.migrated'],
      }),
    /Duplicate migration ownership id/
  );
  assert.throws(
    () => validateCheatMigrationOwnership([], { expectedIds: ['test.migrated'] }),
    /inventory mismatch/
  );
});

test('every migration-discovered bug requires a focused regression test path', () => {
  assert.doesNotThrow(() =>
    validateCheatMigrationOwnership(
      [
        descriptorOwnership({
          discoveredBugs: [
            { id: 'money-partial-number', regressionTest: 'test/regression/money-input.test.js' },
          ],
        }),
      ],
      { expectedIds: ['test.migrated'] }
    )
  );

  assert.throws(
    () =>
      validateCheatMigrationOwnership(
        [
          descriptorOwnership({
            discoveredBugs: [{ id: 'money-partial-number', regressionTest: '' }],
          }),
        ],
        { expectedIds: ['test.migrated'] }
      ),
    /requires a regression test/
  );
});
