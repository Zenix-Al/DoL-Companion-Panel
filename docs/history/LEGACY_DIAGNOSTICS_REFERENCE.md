# Legacy diagnostics reference

> Historical record. This document preserves completed migration evidence and is not current implementation guidance.
>

This document preserves the intent and useful algorithms of the legacy debug
features that Package 7 retires from production runtime ownership. It is a design
reference, not executable registration: nothing described here should register an
action, start a scheduler, mutate SugarCube, or become a public escape hatch.

## Package 7 decisions

| Legacy action         | Decision  | Replacement or retained intent |
| --------------------- | --------- | ------------------------------ |
| `set_animal_like`     | Restore   | Descriptor editor over the selected `farm.beasts` entry. |
| `set_build_time`      | Restore   | Descriptor editor for `farm.build_timer`. |
| `set_assault_time`    | Restore   | Independent descriptor editor for `farm_attack_timer`. |
| `check_fruit_selling` | Restore   | Read-only, shape-driven produce-sales report. |
| `VrelCoinsUsage`      | Restore   | Conditional mod integration for `featsBoosts.pointsUsed`. |
| `testAll`             | Replace   | Bounded read-only “Run Diagnostics” probe runner. |
| `ArrayChecker`        | Retire    | Preserve array-shape detection notes; no generated repair commands. |
| `checkArray`          | Retire    | No continuous recursive game-state scanner. |
| `stringJSSet`         | Retire    | No arbitrary browser-global path setter. |

No Package 7 restore decision permits a descriptor to discover SugarCube or the
browser global independently. Restored tools use the explicit game/config/runtime
boundaries of the cheat factory.

## Developer Tools visibility decision

Developer Tools will use an explicit, session-only opt-in in the cheat modal:

- The group is hidden by default in every new modal instance.
- A clearly labelled “Show Developer Tools” control reveals it for that modal
  instance only.
- Closing/remounting the modal, reinjection, or page reload resets the opt-in.
- The choice is not written to SugarCube, CheatPlus config, userscript storage, or
  a game save.
- Development builds may reveal the same opt-in more prominently, but may not
  bypass it automatically.
- Normal Farm, Produce Inspection, and Mod Integration descriptors never live in
  the Developer Tools group.

This is preferred over a development-build-only gate because diagnostics may be
needed against a user’s production bundle. It is preferred over persistence
because developer UI visibility is transient application state, not game or mod
configuration.

## Broken string-indexed arrays

The retired legacy detector used this historical predicate:

1. The value is an array.
2. Its numeric `length` is zero.
3. It nevertheless has one or more enumerable own keys.

This targets data that was intended to be an object but was deserialized or built
as an empty array carrying string-keyed properties. The predicate is deliberately
narrow. It does not prove corruption, and it does not detect every array with
non-index properties.

The legacy conversion helper iterated enumerable keys and copied them into a new
plain object. That copying algorithm is useful reference material, but automatic
replacement is unsafe because object identity, prototypes, references, accessors,
and downstream array expectations may matter.

## `ArrayChecker`

`ArrayChecker` recursively walked all of `State.variables`, collected values
matching the narrow detector, generated JavaScript assignment strings, placed
those strings in a global text box, selected the text, and attempted to copy it
with `document.execCommand('copy')`.

It is retired because:

- A full save-tree traversal can be expensive or encounter cyclic/unusual values.
- Generated code embeds runtime paths and assumes a globally available conversion
  function.
- The output is executable mutation code rather than a bounded diagnostic report.
- The legacy path formatter does not safely quote every possible property key.
- `document.execCommand` is obsolete and clipboard success is environment-specific.
- Copying save-derived paths can disclose structure that diagnostics should not
  place in ordinary logs or reports.

The replacement diagnostics runner may report a bounded count/status from an
approved read-only probe, but it must not emit repair code or enumerate save paths.

## `checkArray`

`checkArray` was a frame toggle with a 400 ms scheduler cooldown and a second
internal threshold. After eleven effect invocations it recursively walked the
entire variables tree, reset `cheatPlus.arrayCheck`, set it when the first matching
array was found, showed a toast, and stopped that traversal.

It is retired because continuous whole-save scanning has unpredictable cost, the
two throttling mechanisms obscure its real cadence, and a persisted boolean loses
the evidence needed to interpret a match. The new diagnostics runner may expose a
manual, bounded read-only probe if a concrete support need emerges; it must not run
as a repeating toggle.

Package 7D removed the legacy toggle definition, `checkArrayThreshold` runtime
state, scheduler/persistence ownership, obsolete UI hydration, and `arrayCheck`
config after the migration audit proved nothing else used them.

## `stringJSSet`

`stringJSSet` accepted a dot-separated string, traversed from the runtime window,
coerced the second input with `parseFloat` when possible, and assigned the value to
the final property.

It is retired without replacement because it bypasses every intended boundary:

- It can write outside SugarCube and outside the active runtime adapter.
- It has no allowlist, schema, type contract, ownership, or required-path check.
- Dot splitting cannot address property names containing dots and does not safely
  distinguish inherited properties.
- Numeric coercion accepts partial strings and changes author intent.
- A typo can create or overwrite arbitrary global state.

Developers who need one-off inspection or mutation should use browser developer
tools deliberately. The shipped framework will not recreate this capability.

## `testAll` historical behavior

The old `testAll` called `executeFunctionsInObject(debugActions)`. That helper used
one global re-entry flag, invoked every enumerable function without arguments,
did not isolate errors, and reported completion only if iteration reached the end.
It was not a test suite and provided no reliable pass/fail result.

Package 7C replaces the concept with explicit read-only probes. The replacement
must never call action bags, descriptor actions, effects, lifecycle callbacks, or
arbitrary functions merely because they are enumerable.

## Reusable code boundary

`walkValueTree` was retired with the unused SugarCube variable-search feature.
The retired `isBrokenStringIndexedArray` predicate and conversion helper had no
other executable owner, so Package 7D removed them after capturing their behavior
here. The retired action IDs, toggle state, persisted config field, hydrator, and
arbitrary setter are likewise absent from production runtime.
