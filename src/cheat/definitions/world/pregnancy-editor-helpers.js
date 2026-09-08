export const confirmed = (controls) => controls.checked('confirm');

export function fetusOptions(pregnancy) {
  return (pregnancy?.fetus ?? []).map((fetus, index) => ({
    value: index,
    label:
      fetus?.name ?? fetus?.mother ?? fetus?.creature ?? fetus?.stats?.gender ?? `Fetus ${index + 1}`,
  }));
}

export function resetPregnancy(pregnancy) {
  pregnancy.fetus = [];
  pregnancy.potentialFathers = [];
  pregnancy.timer = 0;
  pregnancy.timerEnd = null;
  pregnancy.type = null;
  pregnancy.waterBreaking = false;
  pregnancy.waterBreakingTimer = null;
  if ('awareOf' in pregnancy) pregnancy.awareOf = null;
  if ('awareOfDetails' in pregnancy) pregnancy.awareOfDetails = null;
  if ('awareOfMultiple' in pregnancy) pregnancy.awareOfMultiple = null;
}

export function removeFetus(pregnancy, selected) {
  if (!Array.isArray(pregnancy?.fetus) || pregnancy.fetus.length === 0) return false;
  if (pregnancy.fetus.length === 1) resetPregnancy(pregnancy);
  else pregnancy.fetus.splice(Number.parseInt(selected, 10), 1);
  return true;
}

export const destructiveConfirmation =
  'Confirm removal. Pregnancy and child deletion cannot be undone.';
