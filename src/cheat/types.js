/**
 * Public, author-facing contracts for cheat definitions.
 *
 * This module contains types only. It must not import the DOM, a runtime adapter,
 * storage, the scheduler, or the renderer.
 *
 * @typedef {'quick'|'stats'|'misc'} CheatSection
 * @typedef {'mount'|'section-open'|'after-action'|'runtime-tick'|'manual'} CheatRefreshReason
 * @typedef {'frame'|'daily'} CheatToggleCadence
 * @typedef {'button'|'input'|'range'|'select'|'text'|'toggle'} CheatControlType
 * @typedef {'success'|'validation'|'blocked'|'error'} CheatOutcomeKind
 *
 * @typedef {object} CheatActionOutcome
 * @property {boolean} ok Whether the requested mutation completed.
 * @property {CheatOutcomeKind} [kind] Machine-readable result classification.
 * @property {string} [message] Optional user-facing feedback.
 * @property {'success'|'error'|'warning'|'info'} [variant] Feedback presentation.
 * @property {boolean} [refresh] Request `sync(context)` after a successful action.
 *
 * Returning `true`, `false`, `undefined`, or a promise of any supported outcome
 * is permitted. A thrown/rejected error is normalized to `{ok:false, kind:'error'}`.
 * `false` means validation failure unless the callback returns an explicit kind.
 *
 * @typedef {object} CheatConfigFacade
 * @property {(path:string)=>unknown} get Read a descriptor-declared config path.
 * @property {(path:string, value:unknown)=>unknown} set Validate and write a declared path.
 * @property {(path:string)=>boolean} has Test whether a declared path is present.
 * @property {(path:string)=>'save'} scope Return the retained provider scope.
 *
 * @typedef {object} CheatCallbackContext
 * @property {Readonly<CheatDefinition>} cheat Immutable definition that owns the callback.
 * @property {import('../platform/adapter-contract.js').EngineAdapter} game Sole live game-state API.
 * @property {CheatConfigFacade} config Narrow facade for paths listed by `definition.config`.
 * @property {object} controls Descriptor-scoped controls addressed only by local keys.
 * @property {Event|null} event Triggering DOM event, or null for lifecycle/scheduler calls.
 * @property {AbortSignal} signal Aborted when this mounted instance is disposed.
 * @property {CheatRefreshReason|'action'|'frame'|'daily'|'restore'|'dispose'} reason
 * @property {object} feedback User-visible feedback service.
 * @property {object} services Explicit scheduler/logger/diagnostics services; never ambient globals.
 *
 * @typedef {object} CheatControlDefinition
 * @property {string} key Stable descriptor-local key, unique only inside this cheat.
 * @property {CheatControlType} type
 * @property {string} [label]
 * @property {string} [action] Local key in `actions`, or `toggle` for a toggle control.
 * @property {'confirmation'|'status'} [intent] Optional semantic presentation intent.
 * @property {{path:string, coerce?:'string'|'number'|'integer'|'boolean',writeOn?:'input'|'change',syncWhileEditing?:boolean}} [binding] Live game path resolved by `context.game`. Writes are opt-in through `writeOn`.
 * @property {unknown[]|((context:CheatCallbackContext)=>unknown[]|Promise<unknown[]>)} [options] Static options or a runtime option source.
 * @property {unknown[]} [fallbackOptions] Stable options used when a dynamic source is missing or fails.
 *
 * @typedef {object} CheatDefinition
 * @property {string} id Stable lowercase namespaced identity; also default persistence identity.
 * @property {{section:CheatSection, group?:string, order:number}} location Explicit placement.
 * @property {{label:string, controls:CheatControlDefinition[], confirmation?:string}} meta Declarative UI and optional stable-cheat confirmation policy.
 * @property {Record<string,(context:CheatCallbackContext)=>unknown>} [actions] Local handlers.
 * @property {(context:CheatCallbackContext)=>unknown} [sync] Explicit UI hydration callback.
 * @property {CheatRefreshReason[]} [refresh] Events that invoke `sync`; creates no polling.
 * @property {{cadence:CheatToggleCadence,cooldownMs?:number,maxFailures?:number,runOnActivate?:boolean}} [toggle]
 * @property {(context:CheatCallbackContext)=>unknown} [effect] Repeating toggle effect.
 * @property {(context:CheatCallbackContext)=>boolean} [isApplicable]
 * @property {string[]} [requiredPaths] Live paths checked through the game adapter.
 * @property {(context:CheatCallbackContext)=>unknown} [onEnable]
 * @property {(context:CheatCallbackContext)=>unknown} [onDisable]
 * @property {(context:CheatCallbackContext)=>unknown} [dispose]
 * @property {string[]} [config] Paths declared by the central CheatPlus config schema.
 * @property {Record<string,unknown>} [diagnostics] Non-behavioral development metadata.
 */

export const CHEAT_CONTRACT_VERSION = 1;
