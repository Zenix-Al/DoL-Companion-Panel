/**
 * SugarCube engine quirks — passage guards and game-engine-specific
 * conditional helpers.
 *
 * Features and services should import these instead of reading
 * `SugarCube.State.variables.passage` directly.
 */
import { getPassage } from './state.js';

/**
 * True if the current passage matches `name` (exact, case-sensitive).
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isAtPassage(name) {
  return getPassage() === name;
}

/**
 * True when the player is on the Start / main-menu passage.
 * Most cheat actions should be blocked here.
 *
 * @returns {boolean}
 */
export function isAtStart() {
  return isAtPassage('Start');
}

/**
 * True when the player is on the Settings passage.
 * Certain variables must be restored here to avoid errors.
 *
 * @returns {boolean}
 */
export function isAtSettings() {
  return isAtPassage('Settings');
}
