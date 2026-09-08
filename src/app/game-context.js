import { GAME_VERSION_ELEMENT_ID } from '../platform/sugarcube/constants.js';
import { getRuntimeWindow } from '../core/global-bridge.js';

const runtimeWindow = getRuntimeWindow();
const runtimeSugarCube = runtimeWindow?.SugarCube;

export let testedOn = runtimeWindow?.testedOn ?? '0.0.0';
export let cheatVer =
  runtimeWindow?.cheatVer ??
  (typeof __DOL_CHEAT_VERSION__ !== 'undefined' ? __DOL_CHEAT_VERSION__ : 'dev');
export let isServer = runtimeWindow?.isServer ?? 0;
export let cheatVerType = runtimeWindow?.cheatVerType ?? '';

export let curVer = document.getElementById(GAME_VERSION_ELEMENT_ID)?.innerHTML ?? '';
export let npcnamelist = runtimeSugarCube?.setup?.NPCNameList ?? [];

if (curVer?.startsWith('.')) curVer = '0' + curVer;

export function getNpcNameList() {
  return npcnamelist;
}
