const fs = require('fs');

function stripCssComments(css) {
  let result = '';
  let quote = null;
  let escaped = false;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (quote) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < css.length && !(css[index] === '*' && css[index + 1] === '/')) index += 1;
      index += 1;
      continue;
    }
    result += char;
  }
  return result;
}

function compactCss(css) {
  return stripCssComments(css)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .trim();
}

function cssTextPlugin({ compact = false } = {}) {
  return {
    name: 'dol-css-text',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        const source = await fs.promises.readFile(path, 'utf8');
        return { contents: compact ? compactCss(source) : source, loader: 'text' };
      });
    },
  };
}

module.exports = { compactCss, cssTextPlugin, stripCssComments };
