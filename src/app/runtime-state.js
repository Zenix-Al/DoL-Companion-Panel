import { get, set } from '../core/state.js';

function getRuntime(path) {
  return get(`runtime.${path}`);
}

function setRuntime(path, value) {
  set(`runtime.${path}`, value);
}

export function getIsLoad() {
  return Boolean(getRuntime('isLoad'));
}
export function setIsLoad(value) {
  setRuntime('isLoad', Boolean(value));
}

export function getClickCounter() {
  return Number(getRuntime('clickCounter') ?? 0);
}
export function incrementClickCounter() {
  const next = getClickCounter() + 1;
  setRuntime('clickCounter', next);
  return next;
}
export function decrementClickCounter() {
  const next = getClickCounter() - 1;
  setRuntime('clickCounter', next);
  return next;
}

export function getCurDate() {
  return Number(getRuntime('curDate') ?? 0);
}
export function setCurDate(value) {
  setRuntime('curDate', Number(value) || 0);
}

export function getErrorFunctions() {
  return Number(getRuntime('errorFunctions') ?? 0);
}
export function setErrorFunctions(value) {
  setRuntime('errorFunctions', Number(value) || 0);
}
export function incrementErrorFunctions() {
  const next = getErrorFunctions() + 1;
  setRuntime('errorFunctions', next);
  return next;
}

export function getProgressFunctions() {
  return Number(getRuntime('progressFunctions') ?? 0);
}
export function setProgressFunctions(value) {
  setRuntime('progressFunctions', Number(value) || 0);
}
export function incrementProgressFunctions() {
  const next = getProgressFunctions() + 1;
  setRuntime('progressFunctions', next);
  return next;
}

export function getTotalFunctions() {
  return Number(getRuntime('totalFunctions') ?? 0);
}
export function setTotalFunctions(value) {
  setRuntime('totalFunctions', Number(value) || 0);
}

export function getExtraNotif() {
  return Boolean(getRuntime('extraNotif'));
}
export function setExtraNotif(value) {
  setRuntime('extraNotif', Boolean(value));
}

export function getReactivatingToggles() {
  return Boolean(getRuntime('reactivatingToggles'));
}
export function setReactivatingToggles(value) {
  setRuntime('reactivatingToggles', Boolean(value));
}

export function getIsTestingAllFunction() {
  return Boolean(getRuntime('isTestingAllFunction'));
}
export function setIsTestingAllFunction(value) {
  setRuntime('isTestingAllFunction', Boolean(value));
}

export function getPcPregnant() {
  return Number(getRuntime('pcPregnant') ?? 0);
}
export function setPcPregnant(value) {
  setRuntime('pcPregnant', Number(value) || 0);
}

export function getTotalNpcPregnant() {
  return Number(getRuntime('totalNpcPregnant') ?? 0);
}
export function setTotalNpcPregnant(value) {
  setRuntime('totalNpcPregnant', Number(value) || 0);
}
