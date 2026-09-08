import { register } from '../../core/actions/dispatcher.js';
import { getActiveCheatBuilder } from '../active-cheat-runtime.js';
import { byUiId, getUiRefs } from '../../ui/shell/dom-query.js';
import { syncHistoryButtons } from '../../ui/shell/floating-controls.js';

const SECTIONS = Object.freeze([
  { action: 'quick-link', section: 'quick', nav: 'quicklink', content: 'quickcontent' },
  { action: 'stats-link', section: 'stats', nav: 'statlink', content: 'statscontent' },
  { action: 'misc-link', section: 'misc', nav: 'misclink', content: 'misccontent' },
]);

export const APPLICATION_SHELL_ACTION_IDS = Object.freeze([
  ...SECTIONS.map(({ action }) => action),
  'cheat-open',
  'cheat-history-backwards',
  'cheat-history-forwards',
  'cheat-sidebar',
  'init_interface',
  'Enable_cheat_history',
  'Enable_sidebar_button',
  'simple_cheat_button',
  'save_data',
  'load_data',
]);

export function openSidebar() {
  byUiId('ui-bar-toggle')?.click();
}

function navigateHistory(id, unavailable) {
  const button = byUiId(id);
  if (!button) {
    unavailable?.('Failed, history probably disabled.');
    return false;
  }
  button.click();
  syncHistoryButtons();
  return true;
}

export function navigateHistoryBackward(unavailable) {
  return navigateHistory('history-backward', unavailable);
}

export function navigateHistoryForward(unavailable) {
  return navigateHistory('history-forward', unavailable);
}

export function registerApplicationShellCommands({
  openModal,
  showContent,
  showToast,
  initInterface,
  enableCheatHistory,
  enableSidebarButton,
  toggleSimpleCheatButton,
}) {
  const handlers = new Map();
  const add = (id, handler) => {
    handlers.set(id, handler);
    register(id, handler);
  };

  for (const entry of SECTIONS) {
    add(entry.action, () => {
      const refs = getUiRefs();
      showContent(refs?.[entry.nav], refs?.[entry.content]);
      return getActiveCheatBuilder()?.sectionOpened(entry.section);
    });
  }

  add('cheat-open', openModal);
  add('cheat-history-backwards', () => navigateHistoryBackward(showToast));
  add('cheat-history-forwards', () => navigateHistoryForward(showToast));
  add('cheat-sidebar', openSidebar);
  add('init_interface', initInterface);
  add('Enable_cheat_history', enableCheatHistory);
  add('Enable_sidebar_button', enableSidebarButton);
  add('simple_cheat_button', toggleSimpleCheatButton);

  const unavailableServerCommand = (operation) => () => {
    showToast(`Server save ${operation} is not available in this build.`, { variant: 'warning' });
    return false;
  };
  add('save_data', unavailableServerCommand('export'));
  add('load_data', unavailableServerCommand('import'));

  return Object.freeze({ ids: Object.freeze([...handlers.keys()]) });
}
