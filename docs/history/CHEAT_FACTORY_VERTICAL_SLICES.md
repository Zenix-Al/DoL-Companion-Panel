# First Cheat Factory Vertical Slices (historical)

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

> Migration record only. These slices now run exclusively through the generated
> descriptor catalog and local renderer actions.

Three production definitions now establish the initial recipes:

- `player.money`: bound input, local set action, validation, and explicit refresh;
- `player.body-size`: select/action, current-value dropdown hydration, and
  required-path handling;
- `world.max-harmony`: independent one-shot harmony and ferocity actions with no
  custom hydration.

Each cheat is authored in one conventionally named `*.cheat.js` module. Running
`npm run generate:cheat-manifest` is the only catalog update; no hand-edited
registry is required. `npm run check:cheat-manifest` is the read-only review/CI
gate.

The Body Size fixture demonstrates missing-path troubleshooting. If `bodysize`
is absent, only that descriptor root is marked inapplicable and its controls are
disabled with `Required game path "bodysize" is unavailable.` Other descriptors
remain interactive. Authors should add live prerequisites to `requiredPaths`
instead of catching null access inside an action or querying SugarCube directly.

## Cutover status

These descriptors are the sole application owners through the generated builder.
Their `legacy.actionIds` are descriptor-local compatibility handlers. The old
`moneyset`, `bodyset`, `max_harmony`, and `max_Ferocity` global action-map entries
and mutation implementations have been retired; the baseline inventory retains
them only as historical migration records. Browser parity is still required.

The named NPC pregnancy migration supplies the broken-to-fixed recipe. In the
legacy path, unlocking one NPC unregisters the shared lock job even if another NPC
remains locked. `world.named-npc-pregnancy` keeps scheduling until the last lock is
removed, with intended-behavior evidence in
`test/parity/pregnancy-manager-production.test.js`.
