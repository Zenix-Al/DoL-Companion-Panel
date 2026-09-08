import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  LAYOUT_CLASSES,
  classifyLayoutControls,
} from '../../src/ui/cheat-controls/layout-primitives.js';

test('layout vocabulary classifies shell rows without fixed-position metadata', () => {
  assert.equal(classifyLayoutControls([{ type: 'header' }]), LAYOUT_CLASSES.heading);
  assert.equal(classifyLayoutControls([{ type: 'break' }]), LAYOUT_CLASSES.spacer);
  assert.equal(classifyLayoutControls([{ type: 'text' }, { type: 'link' }]), LAYOUT_CLASSES.footer);
  assert.equal(classifyLayoutControls([{ type: 'header' }, { type: 'tooltip' }]), LAYOUT_CLASSES.help);
  assert.equal(classifyLayoutControls([{ type: 'button' }]), LAYOUT_CLASSES.group);
});

test('responsive layout contract covers wide, tablet, and narrow descriptor rows', async () => {
  const modalCss = await readFile(new URL('../../src/ui/theme/modal.css', import.meta.url), 'utf8');
  const responsiveCss = await readFile(
    new URL('../../src/ui/theme/responsive.css', import.meta.url),
    'utf8'
  );

  assert.match(modalCss, /\.cp-cheat-descriptor\s*\{[^}]*grid-template-columns/s);
  assert.match(modalCss, /scroll-padding:\s*58px 0 64px/);
  assert.match(responsiveCss, /@media \(max-width: 768px\)/);
  assert.match(responsiveCss, /@media \(max-width: 480px\)/);
  assert.match(responsiveCss, /\.cp-cheat-descriptor\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.doesNotMatch(modalCss, /\.cp-cheat-separator\s*\{/);
  assert.doesNotMatch(responsiveCss, /\.cp-cheat-separator\s*\{/);
});
