# Browser and package smoke checklist

Create an evidence copy for each release candidate. Never commit personal saves or complete game-state dumps.

## Environment

- Panel revision and version:
- DoL/mod version:
- Browser and userscript manager:
- URL or local build:
- Operating system:

## Browser

- [ ] Injection occurs once and the draggable button opens and closes the Shadow DOM modal.
- [ ] Quick mounts initially; Stat and Misc mount on first navigation without duplicated rows.
- [ ] A numeric editor hydrates, protects active typing, validates input, and refreshes after action.
- [ ] Dynamic pregnancy/NPC dropdowns update dependent current values.
- [ ] A frame toggle and daily toggle enable, persist, restore once, and disable cleanly.
- [ ] A failing toggle is quarantined without affecting a healthy toggle.
- [ ] Save/load and slot switching preserve declared panel configuration.
- [ ] Destructive pregnancy/child operations require confirmation.
- [ ] Developer Tools remain hidden until revealed and diagnostics do not mutate representative values.

## Injector package

- [ ] Windows: `inject-windows.bat` completes inject and restore.
- [ ] Linux: `inject-linux.sh` completes inject and restore.
- [ ] macOS: `inject-macos.command` completes inject and restore.
- [ ] The game still opens when the injected payload is temporarily removed.
- [ ] Reinjection preserves the original backup and restore removes the loader and copied payload.

## Evidence

| Case | Pass/fail | Observation or issue link |
| --- | --- | --- |
| | | |
