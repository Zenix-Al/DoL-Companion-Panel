# Installation and updates

## Browser userscript

1. Install a current userscript manager. Violentmonkey and Tampermonkey are supported targets.
2. Download `DoL-Companion-Panel.user.js` from the [latest release](https://github.com/Zenix-Al/DoL-CheatPlus/releases).
3. Approve installation, open the game, and look for the draggable **Cheat** button.

Install a newer artifact through the same manager to update. Save-backed panel settings remain in the game save.

The project publishes through GitHub Releases and Greasy Fork. It does not
implement an automatic GitHub or Greasy Fork version checker. When installed
from Greasy Fork, update checks are provided by the userscript manager and the
metadata served by Greasy Fork; the panel’s **GitHub Releases** footer link only
opens the release page.

## Compatibility

The metadata supports vanilla DoL, DoL Plus, other `*.dolmods.net` variants, and `file://` HTML pages. Vanilla and DoL Plus are the primary browser targets. Modded builds may change game variables; an unavailable descriptor disables only its controls and reports why.

For an extracted offline game, use the [local injector](LOCAL_INJECTOR.md). Never edit a game while it remains inside a ZIP archive.
