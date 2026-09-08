# Descriptor builder

The application compiles the generated catalog once, lazily mounts the active section, and gives every descriptor an isolated renderer and control scope. Catalog compilation, section orchestration, mounting, placement, refresh scheduling, and health reporting have separate owners under `src/cheat/runtime`.

Mount and teardown are idempotent. Abort signals prevent late asynchronous callbacks from writing disposed controls. Descriptor failure records typed health detail without blocking unrelated descriptors.

Refresh is event-driven for mount, section open, and actions. `runtime-tick` is opt-in and runs only for the mounted, visible, active section. Renderer edit protection prevents synchronization from overwriting active dirty input.
