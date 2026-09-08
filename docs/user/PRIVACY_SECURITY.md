# Privacy and security

The panel runs locally in the game page. It reads and changes game state only for visible controls, descriptor synchronization, or enabled repeating toggles. It does not upload saves or analytics.

The injector copies a local payload or downloads one only when `--source-url` is explicitly supplied. Prefer this project’s release page and review userscript-manager permission changes before updates.

Injection changes the selected HTML, creates one `.bak` backup, and writes under `injected/`. Keep backups until testing succeeds. Never run an injector from an untrusted mirror.

Diagnostic reports are bounded and intended to avoid mutations, but may contain version and runtime-shape information. Review copied text before sharing.
