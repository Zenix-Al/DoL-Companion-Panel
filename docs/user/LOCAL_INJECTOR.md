# DoL Companion Panel Injector Package

The injector adds a non-fatal loader to an extracted local game HTML and keeps a backup for restoration. Node.js LTS is required because the package does not bundle an executable runtime.

Keep this layout together:

```text
companion-panel-injector/
  inject-windows.bat
  inject-linux.sh
  inject-macos.command
  Companion-Panel/
    companion-panel-injector.ps1
    companion-panel.user.js
    inject-local-html.cjs
    restore-local-html.cjs
```

## Windows

Double-click `inject-windows.bat`, choose Inject or Restore, and confirm the extracted game HTML.

## Linux and macOS

Run `./inject-linux.sh` or `./inject-macos.command`, then choose Inject or Restore. If download removed execution permission, run the launcher through Bash.

## Developer commands

```text
npm run build:injector
npm run inject:local -- --html "path/to/game.html" --source-script "dist/DoL-Companion-Panel.min.user.js"
npm run restore:local -- --html "path/to/game.html" --injected-script "path/to/injected/companion-panel.user.js"
```

Initial injection creates `game.html.bak`. Reinjection updates the loader without replacing the original backup. Restore prefers the backup, removes it afterward, and removes the specified payload when present. A missing payload never prevents the game from loading.
