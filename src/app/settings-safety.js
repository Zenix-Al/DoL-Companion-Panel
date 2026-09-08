import { getBaseNpcPregnancyChance } from '../platform/sugarcube/cheat-config.js';
import { getVariable, setVariable } from '../platform/sugarcube/adapter.js';
import { showToast } from '../ui/shell/toast.js';

import { getActiveToggleObserver } from './observers/active-toggle-observer.js';

export async function restoreVariables() {
  let triggered = false;
  if (getVariable('alluremod') === 0) {
    setVariable('alluremod', 1);
    showToast('Encounter rate enabled!');
  }
  const observer = getActiveToggleObserver();
  if (observer?.isEnabled('quick.maximum-npc-pregnancy-rate')) {
    await observer.disable('quick.maximum-npc-pregnancy-rate');
    const baseline = getBaseNpcPregnancyChance();
    if (Number.isFinite(baseline)) setVariable('baseNpcPregnancyChance', Math.min(baseline, 16));
    showToast('NPC instant pregnant is disabled!');
    triggered = true;
  }
  if (triggered) {
    showToast('This ensure the game settings isnt break.');
    showToast('You can re-enable it after youre done.');
  }
}
