/**
 * CheatPlus persistent config — named accessors/mutators for `State.variables.cheatPlus`.
 *
 * This is the single place in the codebase that reads or writes `cheatPlus.*`.
 * No other module may access `vars.cheatPlus` directly.
 *
 * Schema:
 *   angel              {number}  — saved angel stat value
 *   angelMode          {boolean} — whether angel-save mode is active
 *   toggles            {object}  — set of currently active toggle IDs
 *   storedNPCs         {object}  — overflow NPC pregnancy store managed by mod
 *   storedNPCsDate     {number}  — last in-game day storedNPCs were processed
 *   trueDivine         {string}  — 'demon' | 'angel' | ''
 *   orgasmCount        {number}  — counter used by intenseCum toggle
 *   baseNpcPregnancyChance {number} — saved baseline before allNPCInstaPregnant raises it
 *   unlicumMode        {boolean} — whether intense-cum mode is engaged
 */
import { normalizeCheatConfig } from '../../cheat/contract/config-schema.js';

import { getVars } from './state.js';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** @returns {Record<string, any> | null} */
function cfg() {
  return getVars()?.cheatPlus ?? null;
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Ensure `State.variables.cheatPlus` exists and seed any missing keys with
 * their defaults. Called once during storage init; safe to call more than once.
 */
export function initCheatConfig() {
  const vars = getVars();
  if (!vars) return;

  vars.cheatPlus = normalizeCheatConfig(vars.cheatPlus, {
    baseNpcPregnancyChance: vars.baseNpcPregnancyChance,
  });
  const c = vars.cheatPlus;

  // Handle save data that used penisstate/vaginastate to decide first trueDivine
  if (!c.trueDivine && vars.penisstate === 0 && vars.vaginastate === 0) {
    c.trueDivine = vars.demon > 0 ? 'demon' : vars.angel > 0 ? 'angel' : '';
  }
}

// ---------------------------------------------------------------------------
// Angel / divine
// ---------------------------------------------------------------------------

export function getAngel() {
  return cfg()?.angel ?? 0;
}
export function setAngel(value) {
  const c = cfg();
  if (c) c.angel = value;
}

export function getAngelMode() {
  return cfg()?.angelMode ?? true;
}
export function setAngelMode(value) {
  const c = cfg();
  if (c) c.angelMode = value;
}

export function getTrueDivine() {
  return cfg()?.trueDivine ?? '';
}
export function setTrueDivine(value) {
  const c = cfg();
  if (c) c.trueDivine = value;
}

// ---------------------------------------------------------------------------
// Toggles
// ---------------------------------------------------------------------------

/** Returns the live toggles object (keys = active toggle IDs). */
export function getToggles() {
  return cfg()?.toggles ?? {};
}

/** Mark a toggle as active in persistent storage. */
export function activateToggle(id) {
  const c = cfg();
  if (c) c.toggles[id] = id;
}

/** Remove a toggle from persistent storage. */
export function deactivateToggle(id) {
  const c = cfg();
  if (c) delete c.toggles[id];
}

// ---------------------------------------------------------------------------
// NPC pregnancy overflow store
// ---------------------------------------------------------------------------

export function getStoredCheatNPCs() {
  return cfg()?.storedNPCs ?? {};
}
export function setStoredCheatNPCs(value) {
  const c = cfg();
  if (c) c.storedNPCs = value;
}

export function getStoredNPCsDate() {
  return cfg()?.storedNPCsDate ?? 0;
}
export function setStoredNPCsDate(value) {
  const c = cfg();
  if (c) c.storedNPCsDate = value;
}
export function getNPCsPriority() {
  return cfg()?.storedNPCsPriority ?? 0;
}
export function setNPCsPriority(value) {
  const c = cfg();
  if (c) c.storedNPCsPriority = value;
}
// ---------------------------------------------------------------------------
// NPC base pregnancy chance (saved/restored by allNPCInstaPregnant toggle)
// ---------------------------------------------------------------------------

export function getBaseNpcPregnancyChance() {
  return cfg()?.baseNpcPregnancyChance;
}
export function setBaseNpcPregnancyChance(value) {
  const c = cfg();
  if (c) c.baseNpcPregnancyChance = value;
}

// ---------------------------------------------------------------------------
// Unlicum / orgasm counter
// ---------------------------------------------------------------------------

export function getUnlicumMode() {
  return cfg()?.unlicumMode ?? false;
}
export function setUnlicumMode(value) {
  const c = cfg();
  if (c) c.unlicumMode = value;
}

export function getOrgasmCount() {
  return cfg()?.orgasmCount ?? 0;
}
export function setOrgasmCount(value) {
  const c = cfg();
  if (c) c.orgasmCount = value;
}
export function incrementOrgasmCount() {
  const c = cfg();
  if (!c) return 0;
  c.orgasmCount = (c.orgasmCount ?? 0) + 1;
  return c.orgasmCount;
}
export function resetOrgasmCount() {
  const c = cfg();
  if (c) c.orgasmCount = 0;
}
