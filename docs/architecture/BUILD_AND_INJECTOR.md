# Build and injector architecture

## Release artifacts

One version in `build/version.json` produces two userscripts from `src/main.js`:

- `dist/DoL-Companion-Panel.user.js` is the readable Greasy Fork artifact. Its
  debug call sites and production-only CSS comments are removed, but JavaScript
  whitespace and identifier names remain inspectable.
- `dist/DoL-Companion-Panel.min.user.js` is the fully optimized artifact used by
  direct downloads and the local-game injector.

`npm run build` is a development build and bumps the patch version unless a bump
flag changes that behavior. `npm run build:release` builds release artifacts and
bumps once. Automated verification always uses `--no-bump` and a temporary output
directory.

The CSS transform was adapted from the latest-highlighter reference and rewritten
locally with quoted-string and escape handling. Regex-based JavaScript rewriting
was rejected; release debug calls are removed through esbuild's parsed `pure`
transform. The reference HTML compactor was not adopted because this project has
no imported HTML asset that needs it.

## Injector ownership

`tools/injector` is the canonical, tracked injector source. Nothing under `dist`
is authoritative or should be edited manually. The injector builder copies that
source into a clean staging package, adds the optimized userscript under the
launcher contract name `Companion-Panel/companion-panel.user.js`, validates the
result, replaces `dist/companion-panel-injector`, and creates the ZIP.

The supported launcher surface is one launcher per platform:

- `inject-windows.bat` launches `Companion-Panel/companion-panel-injector.ps1`;
- `inject-linux.sh` drives the Node helpers from a terminal;
- `inject-macos.command` provides the equivalent terminal flow on macOS.

Node.js LTS is an explicit end-user prerequisite. A self-contained executable is
not currently justified; changing that decision requires a separate packaging
and supply-chain review.

## Commands

```text
npm run verify:build     # temporary no-bump release smoke build
npm run build:injector   # no-bump release artifacts, package, and ZIP
npm run verify:release   # smoke checks, injector fixtures, package verification
```

The fixture suite owns injection, reinjection, update, restore, backup, missing
payload, malformed HTML, and paths containing spaces/non-ASCII characters. The
package test owns required paths, payload naming, Windows launcher resolution,
exclusion of the retired UI script, and ZIP production.
