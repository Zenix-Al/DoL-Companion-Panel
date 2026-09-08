const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const MARKER_START = '<!-- DoL Companion Panel Injection START -->';
const MARKER_END = '<!-- DoL Companion Panel Injection END -->';
const SCRIPT_TAG_ATTR = 'data-dcpanel-injected';

const DEFAULT_INJECTED_SCRIPT = path.resolve(__dirname, 'companion-panel.user.js');
const MAX_REDIRECTS = 5;

function unique(array) {
  return [...new Set(array)];
}

function findFirstHtmlInDirectory(directoryPath) {
  let entries;
  try {
    entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  } catch {
    return null;
  }

  const match = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))[0];

  return match ? path.join(directoryPath, match) : null;
}

function resolveExistingHtmlPath(rawPath) {
  if (rawPath) {
    const candidate = path.resolve(rawPath);
    return fs.existsSync(candidate) ? candidate : null;
  }

  // No explicit target: look for the first HTML file in the current
  // working directory, then one directory above it.
  const searchDirs = unique([process.cwd(), path.resolve(process.cwd(), '..')]);
  for (const directoryPath of searchDirs) {
    const match = findFirstHtmlInDirectory(directoryPath);
    if (match) return match;
  }

  return null;
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function fail(message) {
  console.error(`[inject-local-html] ${message}`);
  process.exit(1);
}

function ensureSourceScriptFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} not found on disk: ${filePath}`);
  }
}

function parseUrl(value) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    fail(`Invalid --source-url value: ${value}`);
  }
}

function isRedirect(statusCode) {
  return (
    statusCode === 301 ||
    statusCode === 302 ||
    statusCode === 303 ||
    statusCode === 307 ||
    statusCode === 308
  );
}

function downloadToFile(urlObj, destinationPath, redirectCount = 0) {
  const client = urlObj.protocol === 'http:' ? http : https;
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    fail(`Unsupported URL protocol: ${urlObj.protocol}`);
  }

  return new Promise((resolve, reject) => {
    const request = client.get(urlObj, (response) => {
      if (isRedirect(response.statusCode) && response.headers.location) {
        if (redirectCount >= MAX_REDIRECTS) {
          response.resume();
          reject(new Error(`Too many redirects while downloading payload: ${urlObj.toString()}`));
          return;
        }

        const nextUrl = new URL(response.headers.location, urlObj);
        response.resume();
        downloadToFile(nextUrl, destinationPath, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(
          new Error(`Failed to download payload (${response.statusCode}): ${urlObj.toString()}`)
        );
        return;
      }

      const stream = fs.createWriteStream(destinationPath);
      response.pipe(stream);

      stream.on('finish', () => {
        stream.close(() => resolve());
      });

      stream.on('error', (err) => {
        stream.destroy();
        reject(err);
      });
    });

    request.on('error', reject);
  });
}

function toPosixRelative(fromDir, toFile) {
  const rel = path.relative(fromDir, toFile);
  return rel.split(path.sep).join('/');
}

function createLoaderScript(scriptSrc) {
  return [
    '<script type="text/javascript">',
    '(function(){',
    '  try {',
    '    var script = document.createElement("script");',
    `    script.src = ${JSON.stringify(scriptSrc)};`,
    '    script.async = true;',
    `    script.setAttribute(${JSON.stringify(SCRIPT_TAG_ATTR)}, "true");`,
    '    script.onerror = function(){',
    '      console.warn("[DoL Companion Panel] Payload not found. Game will continue without the panel.");',
    '    };',
    '    (document.head || document.documentElement).appendChild(script);',
    '  } catch (err) {',
    '    console.warn("[DoL Companion Panel] Loader failed safely:", err);',
    '  }',
    '})();',
    '</script>',
  ].join('\n');
}

function insertBlock(html, block) {
  const headCloseTag = '</head>';
  const bodyCloseTag = '</body>';

  if (html.includes(headCloseTag)) {
    return html.replace(headCloseTag, `${block}\n${headCloseTag}`);
  }

  if (html.includes(bodyCloseTag)) {
    return html.replace(bodyCloseTag, `${block}\n${bodyCloseTag}`);
  }

  fail('Could not find </head> or </body> in target HTML.');
}

function replaceOrInsertBlock(html, block) {
  const start = html.indexOf(MARKER_START);
  const end = html.indexOf(MARKER_END);

  if (start !== -1 && end !== -1 && end > start) {
    const endIndex = end + MARKER_END.length;
    const existingBlock = html.slice(start, endIndex);
    const replacement = block;
    if (existingBlock === replacement) {
      return { html, changed: false, mode: 'unchanged' };
    }

    return {
      html: `${html.slice(0, start)}${replacement}${html.slice(endIndex)}`,
      changed: true,
      mode: 'replaced',
    };
  }

  return { html: insertBlock(html, block), changed: true, mode: 'inserted' };
}

async function main() {
  const rawHtmlPath = getArgValue('--html') || process.env.DCPANEL_HTML || null;
  const htmlPath = resolveExistingHtmlPath(rawHtmlPath);
  const sourceScriptPathArg = getArgValue('--source-script') || process.env.DCPANEL_SOURCE_SCRIPT;
  const sourceUrl = parseUrl(getArgValue('--source-url') || process.env.DCPANEL_SOURCE_URL);
  const sourceScriptPath = sourceScriptPathArg
    ? path.resolve(sourceScriptPathArg)
    : DEFAULT_INJECTED_SCRIPT;
  const injectedScriptPath = path.resolve(
    getArgValue('--injected-script') ||
      process.env.DCPANEL_INJECTED_SCRIPT ||
      DEFAULT_INJECTED_SCRIPT
  );

  if (!htmlPath) {
    if (rawHtmlPath) {
      fail(
        `Target HTML not found on disk: ${path.resolve(rawHtmlPath)}\n` +
          'Use a real file path on disk. If you selected from a zip/compressed view, extract the folder first.'
      );
    }

    fail(
      `No .html file found in: ${process.cwd()} or ${path.resolve(process.cwd(), '..')}\n` +
        'Use --html <path> to choose a specific file.'
    );
  }

  if (sourceUrl && sourceScriptPathArg) {
    fail('Use either --source-script or --source-url, not both.');
  }

  if (!sourceUrl) {
    ensureSourceScriptFile(sourceScriptPath, 'Source script');
  }

  const htmlDir = path.dirname(htmlPath);
  const backupPath = `${htmlPath}.bak`;

  fs.mkdirSync(path.dirname(injectedScriptPath), { recursive: true });

  if (sourceUrl) {
    await downloadToFile(sourceUrl, injectedScriptPath);
  } else if (path.resolve(sourceScriptPath) !== path.resolve(injectedScriptPath)) {
    fs.copyFileSync(sourceScriptPath, injectedScriptPath);
  }

  const scriptSrc = toPosixRelative(htmlDir, injectedScriptPath);
  const injectionBlock = [MARKER_START, createLoaderScript(scriptSrc), MARKER_END].join('\n');

  const originalHtml = fs.readFileSync(htmlPath, 'utf8');

  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, originalHtml, 'utf8');
  }

  const result = replaceOrInsertBlock(originalHtml, injectionBlock);
  if (result.changed) {
    fs.writeFileSync(htmlPath, result.html, 'utf8');
  }

  if (result.mode === 'replaced') {
    console.log(`[inject-local-html] Updated existing injection block in: ${htmlPath}`);
  } else if (result.mode === 'inserted') {
    console.log(`[inject-local-html] Injected non-fatal loader into: ${htmlPath}`);
  } else {
    console.log(`[inject-local-html] Injection block already up-to-date in: ${htmlPath}`);
  }
  if (sourceUrl) {
    console.log(`[inject-local-html] Payload downloaded from: ${sourceUrl.toString()}`);
    console.log(`[inject-local-html] Payload written to: ${injectedScriptPath}`);
  } else if (path.resolve(sourceScriptPath) !== path.resolve(injectedScriptPath)) {
    console.log(`[inject-local-html] Payload copied from: ${sourceScriptPath}`);
    console.log(`[inject-local-html] Payload written to: ${injectedScriptPath}`);
  } else {
    console.log(`[inject-local-html] Using payload: ${injectedScriptPath}`);
  }
  console.log(`[inject-local-html] Backup created at: ${backupPath}`);
}

main().catch((err) => {
  fail(err?.message || String(err));
});

