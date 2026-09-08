import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { compactCss, stripCssComments } = require('../../build/plugins/css-text.cjs');

test('CSS comment stripping preserves comment-like text in quoted values', () => {
  const css = '.a { content: "/* keep */"; background: url("data:x/*keep*/"); } /* remove */';
  assert.equal(stripCssComments(css), '.a { content: "/* keep */"; background: url("data:x/*keep*/"); } ');
});

test('CSS compaction is idempotent and preserves escaped quotes', () => {
  const css = String.raw`.a { content: "a\" /* value */"; color: red; } /* comment */`;
  const once = compactCss(css);
  assert.equal(compactCss(once), once);
  assert.match(once, /\/\* value \*\//);
  assert.doesNotMatch(once, /comment/);
});
