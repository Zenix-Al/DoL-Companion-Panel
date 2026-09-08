# Troubleshooting

## The button does not appear

Confirm the userscript is enabled for the URL, reload after the game finishes loading, and inspect the userscript-manager console. For local games, verify `injected/companion-panel.user.js` exists relative to the HTML.

## A cheat is unavailable

The game or mod does not expose a required path. Change passage once, reopen the section, and report the game version and descriptor label if it remains unavailable.

## The injector cannot find the HTML

Extract the game first. Put the injector beside the HTML or pass `--html` explicitly. Spaces and non-ASCII paths are supported.

## Restore cannot find a backup

Restore removes the marked loader even without a backup. Pass `--injected-script` if the copied payload should also be deleted.

Bug reports should include panel version, game/mod version, browser, userscript manager, affected descriptor, and console error. Do not publish personal saves.
