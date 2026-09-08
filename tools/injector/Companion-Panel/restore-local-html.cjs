const fs = require('fs');
const path = require('path');

const MARKER_START = '<!-- DoL Companion Panel Injection START -->';
const MARKER_END = '<!-- DoL Companion Panel Injection END -->';

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
  console.error(`[restore-local-html] ${message}`);
  process.exit(1);
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} not found: ${filePath}`);
  }
}

function removeMarkerBlock(html) {
  const start = html.indexOf(MARKER_START);
  const end = html.indexOf(MARKER_END);

  if (start === -1 || end === -1 || end < start) {
    return { changed: false, html };
  }

  const endIndex = end + MARKER_END.length;
  const before = html.slice(0, start);
  const after = html.slice(endIndex).replace(/^\r?\n/, '');
  const nextHtml = before.endsWith('\n')
    ? `${before}${after}`
    : `${before.replace(/\s*$/, '')}\n${after}`;

  return { changed: true, html: nextHtml };
}

function cleanupInjectedScript(injectedScriptPath) {
  if (!injectedScriptPath || !fs.existsSync(injectedScriptPath)) return false;

  fs.unlinkSync(injectedScriptPath);

  const injectedDir = path.dirname(injectedScriptPath);
  try {
    const remaining = fs.readdirSync(injectedDir);
    if (remaining.length === 0) {
      fs.rmdirSync(injectedDir);
    }
  } catch {
    // The file was removed successfully; directory cleanup is optional.
  }

  return true;
}

function main() {
  const rawHtmlPath = getArgValue('--html') || process.env.DCPANEL_HTML || null;
  const htmlPath = resolveExistingHtmlPath(rawHtmlPath);
  const rawInjectedScriptPath =
    getArgValue('--injected-script') || process.env.DCPANEL_INJECTED_SCRIPT || null;
  const injectedScriptPath = rawInjectedScriptPath
    ? path.resolve(rawInjectedScriptPath)
    : null;

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

  const backupPath = `${htmlPath}.bak`;

  ensureFile(htmlPath, 'Target HTML');

  let restoredFromBackup = false;

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, htmlPath);
    fs.unlinkSync(backupPath);
    restoredFromBackup = true;
  } else {
    const originalHtml = fs.readFileSync(htmlPath, 'utf8');
    const result = removeMarkerBlock(originalHtml);

    if (result.changed) {
      fs.writeFileSync(htmlPath, result.html, 'utf8');
    }
  }

  const cleanedInjectedScript = cleanupInjectedScript(injectedScriptPath);

  if (restoredFromBackup) {
    console.log(`[restore-local-html] Restored HTML from backup: ${htmlPath}`);
  } else {
    console.log(`[restore-local-html] Removed marker block if present: ${htmlPath}`);
  }

  if (cleanedInjectedScript) {
    console.log(`[restore-local-html] Removed injected script: ${injectedScriptPath}`);
  } else if (injectedScriptPath) {
    console.log(`[restore-local-html] Injected script not found, nothing to remove: ${injectedScriptPath}`);
  }
}

main();

