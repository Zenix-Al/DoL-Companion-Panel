import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'dist', 'node_modules', '_compiled']);
const ROOT_ALLOWLIST = new Set(['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'CHANGELOG.md']);
const STALE_ACTIVE_PATHS = ['src/features/', 'src/cheats/', 'src/services/'];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function isAllowedRootMarkdown(name) {
  return ROOT_ALLOWLIST.has(name) || /^(?:TODO.*|todo)\.md$/.test(name);
}

function localLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
}

function checkDocs() {
  const errors = [];
  const markdownFiles = walk(ROOT).filter((file) => file.toLowerCase().endsWith('.md'));
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  for (const file of markdownFiles) {
    const rel = relative(file);
    const parts = rel.split('/');
    if (parts.length === 1 ? !isAllowedRootMarkdown(parts[0]) : parts[0] !== 'docs') {
      errors.push(`${rel}: Markdown is outside docs/ and the root allowlist.`);
    }

    const text = fs.readFileSync(file, 'utf8');
    for (const target of localLinks(text)) {
      if (/^(?:https?:|mailto:|#)/.test(target)) continue;
      const clean = decodeURIComponent(target.split('#')[0]);
      if (!clean) continue;
      const resolved = path.resolve(path.dirname(file), clean);
      if (!fs.existsSync(resolved)) errors.push(`${rel}: broken local link ${target}`);
    }

    const activeGuide = rel === 'README.md' || rel === 'CONTRIBUTING.md' || (rel.startsWith('docs/') && !rel.startsWith('docs/history/'));
    if (activeGuide) {
      for (const stale of STALE_ACTIVE_PATHS) {
        if (text.includes(stale)) errors.push(`${rel}: active guide references retired path ${stale}`);
      }
      for (const match of text.matchAll(/npm run ([a-z0-9:_-]+)/gi)) {
        if (!packageJson.scripts[match[1]]) errors.push(`${rel}: unknown npm script ${match[1]}`);
      }
      for (const match of text.matchAll(/`((?:src|build|tools|test|scripts)\/[^`]+)`/g)) {
        const referenced = match[1];
        if (/[<*>]/.test(referenced)) continue;
        if (!fs.existsSync(path.join(ROOT, referenced))) {
          errors.push(`${rel}: referenced repository path does not exist: ${referenced}`);
        }
      }
    }

    if (rel.startsWith('docs/history/') && rel !== 'docs/history/README.md') {
      if (!/Historical record\.|historical/i.test(text.slice(0, 500))) {
        errors.push(`${rel}: historical document lacks a warning near its title.`);
      }
    }
  }

  const requiredDirs = ['docs/user', 'docs/contributing', 'docs/architecture', 'docs/testing', 'docs/history'];
  for (const directory of requiredDirs) {
    if (!fs.statSync(path.join(ROOT, directory), { throwIfNoEntry: false })?.isDirectory()) {
      errors.push(`${directory}: required documentation category is missing.`);
    }
  }

  if (errors.length) throw new Error(`Documentation check failed:\n- ${errors.join('\n- ')}`);
  return { markdownFiles: markdownFiles.length };
}

try {
  const result = checkDocs();
  console.log(`Documentation check: ${result.markdownFiles} Markdown files, all links and commands valid.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

export { checkDocs };
