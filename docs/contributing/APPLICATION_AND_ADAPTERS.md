# Application commands and runtime adapters

Application-shell behavior belongs under `src/app`, not cheat descriptors. Add navigation or shell commands through `src/app/commands`; register listeners through the owned event registry and return teardown handles. Game mutations visible as cheats belong in descriptors.

Platform access belongs under `src/platform/<engine>`. A backend provides the adapter contract, readiness and current-passage behavior, and a profile registered through `src/platform/runtime-engine-registry.js`. Descriptors and UI depend only on the normalized callback game API.

Keep `src/core` platform-neutral: state, logging, safe execution, events, and generic dispatch. Keep `src/ui` limited to shell, theme, and descriptor-control rendering.

Add adapter unit tests plus an integration test for detection, context normalization, and teardown. Run `npm run audit:imports` to enforce dependency direction.
