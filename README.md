# DoL Companion Panel

DoL Companion Panel is a client-side userscript that adds a floating quality-of-life panel to Degrees of Lewdity. It provides quick actions, stat editors, pregnancy and offspring tools, NPC controls, and optional repeating toggles.

## Install

Install Tampermonkey or Violentmonkey, then install `DoL-Companion-Panel.user.js` from the [latest release](https://github.com/Zenix-Al/DoL-CheatPlus/releases). It supports vanilla DoL, DoL Plus, other `dolmods.net` variants, and extracted local HTML builds.

For local games, use the [local injector and restore guide](docs/user/LOCAL_INJECTOR.md).

## Learn more

- [Installation and compatibility](docs/user/INSTALLATION.md)
- [Using the panel](docs/user/PANEL_USAGE.md)
- [Troubleshooting](docs/user/TROUBLESHOOTING.md)
- [Privacy and security](docs/user/PRIVACY_SECURITY.md)
- [Documentation index](docs/README.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Development

```text
npm install
npm test
npm run audit:imports
npm run check:docs
npm run verify:release
```

Start with [Contributor setup](docs/contributing/SETUP.md). Production cheats are descriptor-owned under `src/cheat`; do not restore global cheat action maps or aggregate fetchers.

License: GPL-3.0-or-later.
