import test from 'node:test';
import assert from 'node:assert/strict';

import { createSectionShells } from '../../src/ui/shell/definitions.js';
import { renderSectionShell } from '../../src/ui/shell/renderer.js';
import { modalTemplate, layoutTemplate, renderTemplate } from '../../src/ui/shell/layout.js';
import { createDomWithSugarCube } from '../helpers/dom-test-env.js';

const context = {
  data: {
    releaseSite: 'https://example.test/releases',
    sourceCode: 'https://example.test/source',
  },
  runtime: {
    testedOn: '0.5.7.9',
    curVer: '0.5.7.9',
    isCheatWorkSymbol: '✓',
    isCheatWork: 'Compatible',
    isServer: 1,
    cheatVer: '2.0.29',
    cheatVerType: 'dev',
  },
};

test('all section shells render without catalog descriptors or the legacy metadata renderer', () => {
  const env = createDomWithSugarCube();
  const shells = createSectionShells(context);
  const roots = [];
  try {
    for (const section of ['quick', 'stats', 'misc']) {
      const container = env.document.createElement('section');
      env.document.body.appendChild(container);
      const mounted = renderSectionShell({
        section,
        rows: shells[section],
        container,
        document: env.document,
      });
      roots.push(mounted);
      assert.equal(mounted.root.dataset.shellSection, section);
      assert.equal(mounted.root.querySelectorAll('[data-cheat-id]').length, 0);
      assert.ok(mounted.root.querySelectorAll('[data-shell-key]').length > 0);
    }
    const keys = roots.flatMap(({ root }) =>
      [...root.querySelectorAll('[data-shell-key]')].map(({ dataset }) => dataset.shellKey)
    );
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes('quick.compatibility'));
    assert.ok(keys.includes('quick.footer'));
    assert.ok(keys.includes('misc.pregnancy-time-help'));
    const releaseLink = roots[0].root.querySelector('[data-shell-control="releases"]');
    assert.equal(releaseLink?.textContent, 'GitHub Releases');
    assert.equal(releaseLink?.getAttribute('href'), context.data.releaseSite);
  } finally {
    roots.forEach(({ dispose }) => dispose());
    env.cleanup();
  }
});

test('application shell actions dispatch outside cheat ownership and teardown removes listeners', () => {
  const env = createDomWithSugarCube();
  const container = env.document.createElement('section');
  env.document.body.appendChild(container);
  const actions = [];
  const mounted = renderSectionShell({
    section: 'quick',
    rows: createSectionShells(context).quick,
    container,
    document: env.document,
    dispatchAction: (action) => actions.push(action),
  });
  const exportButton = mounted.root.querySelector('[data-shell-action="save_data"]');
  const importButton = mounted.root.querySelector('[data-shell-action="load_data"]');
  exportButton.click();
  importButton.click();
  assert.deepEqual(actions, ['save_data', 'load_data']);
  assert.equal(mounted.dispose(), true);
  assert.equal(container.children.length, 0);
  exportButton.click();
  assert.deepEqual(actions, ['save_data', 'load_data']);
  env.cleanup();
});

test('layout symbols use stable Unicode escapes and render without mojibake', () => {
  const env = createDomWithSugarCube();
  try {
    const modal = renderTemplate(modalTemplate);
    const layout = renderTemplate(layoutTemplate);
    assert.equal(modal.querySelector('#close-modal-top').textContent, '\u00d7');
    assert.equal(modal.querySelector('#close-modal-bottom').textContent, '\u00d7');
    assert.equal(layout.querySelector('#cheat-history-backwards').textContent, '\u2190');
    assert.equal(layout.querySelector('#cheat-history-forwards').textContent, '\u2192');
    assert.equal(layout.querySelector('#cheat-sidebar').textContent, '\u2630');
    assert.equal(`${modal.textContent}${layout.textContent}`.includes('Ã'), false);
  } finally {
    env.cleanup();
  }
});
