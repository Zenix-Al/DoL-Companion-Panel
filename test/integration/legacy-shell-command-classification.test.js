import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatch, getKeys } from '../../src/core/actions/dispatcher.js';
import { setActiveCheatBuilder } from '../../src/app/active-cheat-runtime.js';
import { createSectionShells } from '../../src/ui/shell/definitions.js';
import { renderSectionShell } from '../../src/ui/shell/renderer.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';

test('application shell commands preserve sidebar and history forwarding after relocation', async () => {
  const env = createDomWithSugarCube();
  try {
    // The UI command module resolves browser globals during import.
    // eslint-disable-next-line no-restricted-syntax
    const actions = await import(
      /* allow-dynamic-import */ '../../src/app/commands/shell-commands.js'
    );
    const sidebar = env.document.createElement('button');
    sidebar.id = 'ui-bar-toggle';
    const gameBack = env.document.createElement('button');
    gameBack.id = 'history-backward';
    const gameForward = env.document.createElement('button');
    gameForward.id = 'history-forward';
    const panelBack = env.document.createElement('button');
    panelBack.id = 'cheat-history-backwards';
    const panelForward = env.document.createElement('button');
    panelForward.id = 'cheat-history-forwards';
    env.document.body.append(sidebar, gameBack, gameForward, panelBack, panelForward);

    const clicks = { sidebar: 0, back: 0, forward: 0 };
    sidebar.addEventListener('click', () => (clicks.sidebar += 1));
    gameBack.addEventListener('click', () => {
      clicks.back += 1;
      gameBack.disabled = true;
      gameForward.disabled = false;
    });
    gameForward.addEventListener('click', () => {
      clicks.forward += 1;
      gameBack.disabled = false;
      gameForward.disabled = true;
    });

    actions.openSidebar();
    actions.navigateHistoryBackward();
    assert.deepEqual(clicks, { sidebar: 1, back: 1, forward: 0 });
    assert.equal(panelBack.disabled, true);
    assert.equal(panelForward.disabled, false);

    actions.navigateHistoryForward();
    assert.deepEqual(clicks, { sidebar: 1, back: 1, forward: 1 });
    assert.equal(panelBack.disabled, false);
    assert.equal(panelForward.disabled, true);

    gameBack.remove();
    actions.navigateHistoryBackward((message) => {
      const notice = env.document.createElement('span');
      notice.id = 'history-notice';
      notice.textContent = message;
      env.document.body.appendChild(notice);
    });
    assert.match(
      env.document.querySelector('#history-notice')?.textContent ?? '',
      /history probably disabled/i
    );
  } finally {
    env.cleanup();
  }
});

test('application command registration resolves every declared and rendered shell action', async () => {
  const env = createDomWithSugarCube();
  try {
    // The UI command module resolves browser globals during import.
    // eslint-disable-next-line no-restricted-syntax
    const commands = await import(
      /* allow-dynamic-import */ '../../src/app/commands/shell-commands.js'
    );
    const noop = () => {};
    const openedSections = [];
    setActiveCheatBuilder({
      sectionOpened(section) {
        openedSections.push(section);
      },
    });
    const registration = commands.registerApplicationShellCommands({
      openModal: noop,
      showContent: noop,
      showToast: noop,
      initInterface: noop,
      enableCheatHistory: noop,
      enableSidebarButton: noop,
      toggleSimpleCheatButton: noop,
    });

    assert.deepEqual(registration.ids, commands.APPLICATION_SHELL_ACTION_IDS);
    const registered = new Set(getKeys());
    for (const id of commands.APPLICATION_SHELL_ACTION_IDS) assert.equal(registered.has(id), true);
    for (const section of ['quick', 'stats', 'misc']) dispatch(`${section}-link`);
    assert.deepEqual(openedSections, ['quick', 'stats', 'misc']);

    const container = env.document.createElement('section');
    env.document.body.appendChild(container);
    const quick = createSectionShells({
      data: { releaseSite: '#', sourceCode: '#' },
      runtime: { isServer: 1, testedOn: '1', curVer: '1', cheatVer: '3.0.0' },
    }).quick;
    const mounted = renderSectionShell({
      section: 'quick',
      rows: quick,
      container,
      document: env.document,
      dispatchAction: noop,
    });
    const renderedIds = [...mounted.root.querySelectorAll('[data-shell-action]')].map(
      ({ dataset }) => dataset.shellAction
    );
    assert.ok(renderedIds.length > 0);
    for (const id of renderedIds) assert.equal(registered.has(id), true);
    mounted.dispose();
  } finally {
    setActiveCheatBuilder(null);
    env.cleanup();
  }
});
