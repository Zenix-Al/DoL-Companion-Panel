# Build and release

Read [Build and injector architecture](../architecture/BUILD_AND_INJECTOR.md) for ownership.

```text
npm run verify:build
npm run verify:release
```

Both are no-bump checks. For an intentional bump, use `npm run build:release` with optional `-- --minor` or `-- --major`, review the version and changelog, then run release verification.

Release files are `dist/DoL-Companion-Panel.user.js`, `dist/DoL-Companion-Panel.min.user.js`, and `dist/companion-panel-injector.zip`. Never manually copy or rename the injector payload or publish intermediate output.

Before publishing, run the browser checklist and all packaged launchers on their target operating systems.
