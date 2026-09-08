# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - Architecture Finalization

This release finishes the repository and runtime architecture work begun after
3.0.0 and fixes the release/injector problems found during that reorganization.

### Added

- Added reproducible readable, optimized, and local-injector release artifacts
- Added fixture-tested injection, restoration, package, documentation, and
  import-boundary verification
- Added task-oriented user, contributor, architecture, testing, and historical
  documentation indexes

### Changed

- Reorganized production source around app, cheat, platform, core, and UI
  ownership boundaries
- Made the corrected multi-platform injector package fully generated from
  tracked source without manual payload copying
- Replaced the obsolete MediaFire update link with an explicitly labeled GitHub
  Releases link; automatic updates remain the userscript manager’s responsibility

### Removed

- Removed the legacy feature/fetcher facades, obsolete build scripts, duplicate
  injector launchers, and scattered source/test documentation

## [3.0.0] - Major Framework Overhaul

A major release that moves the cheat system to a more reliable descriptor-based
framework and modernizes the in-game interface.

### Added

- Added descriptor-based cheat definitions for the game's cheat controls
- Added support for dynamic controls, toggles, persistence, diagnostics, and
  clearer unavailable states
- Added dedicated layout sections for headings, help text, compatibility
  information, and other interface elements

### Changed

- Rebuilt Quick, Stat, and Misc rendering around one consistent system
- Improved control styling, responsive layout, and Shadow DOM behavior
- Improved cheat placement, refresh behavior, and toggle restoration

### Removed

- Removed the old metadata renderer and duplicate legacy cheat controls
- Removed misplaced slots, detached headings, and other legacy layout issues

## [2.0.7]

### Fixed

- Fixed toggle cheat not persisting state correctly
- Fixed auto-load cheat state on page refresh

### Planned

- Additional bug fixes related to these changes
- Improved injector tool usability

## [2.0.0] - Major Framework Overhaul

A major release that revived the project into a proper, maintainable cheat framework with clear architecture and improved reliability.

### Framework and Architecture

- Moved feature lifecycle to structured bootstrap/factory flow
- Separated runtime state, persistence config, and adapter boundaries
- Isolated SugarCube-specific access behind adapter/selectors
- Introduced runtime-engine strategy with registry/profile model
- Added RenPy-web backend scaffold as portability reference

### UI and Renderer

- Completed metadata-driven UI pipeline with normalization
- Split renderer into focused modules (primitives, runtime binding, policy, wiring)
- Split and modernized modal/floating/toast styling
- Stabilized modal behavior (search row, fixed-height scroll container, close controls)

### Actions and Reliability

- Refactored dispatcher and action map system with schema validation
- Extracted toggle runtime into scheduler/engine with clearer responsibilities
- Added test coverage for action policies, renderer lifecycle, and regression checks

### Cleanup

- Removed legacy/deprecated paths (old standalone tooling and stale UI wiring)
- Decomposed large modules by domain for maintainability

## [1.2.3]

### Fixed

- Fixed layout issue that was breaking in-game layout

### Added

- Added function to test all cheat functions for quicker iteration

## [1.2.2]

### Changed

- Properly tested after major changes; no longer alpha version

### Added

- Added additional safeguards and checks

## [1.2.1] - Alpha

### Fixed

- Fixed initialization failure
- Added safeguard in cheat functions

### Changed

- Optimized cheat injection

### TODO

- More cleanup needed

## [1.2.0] - Alpha - The Revival

The cheat has been revived from slumber!

### Changed

- Major changes to cheat architecture
- Cleaned up repo for easier build process
- General optimization improvements
- Verified compatibility with latest game version

### Removed

- Server sync functionality removed permanently

## [1.1.6]

### Added

- New cheat: NPC max pregnancy rate
- New cheat: Multiple pregnancy (ability to impregnate any NPC multiple times)
- NPC pregnancy purge in pregnancy manager
- NPC baby purge in pregnancy manager (including named NPCs)

### Changed

- Replaced Demon sex cheat with NPC max pregnancy rate

### Fixed

- Fixed NPC pregnancy abortion

## [1.1.5]

### Added

- Support for latest game version with verification testing

### Changed

- Optimized: Typing while cheat is open no longer triggers in-game actions
- Optimized: Unlimited toggle now triggers reliably even with keyboard control

## [1.1.4]

### Added

- Added debug text to JavaScript (path variable editor without opening browser console)
- Added support for offline DoL Plus version

### Changed

- Turned off random encounter cheat
- Optimized divine transformation toggle to prevent incorrect transformations
- Optimized unlimited cum to ensure intense orgasm for 3 turns regardless of DoL version

## [1.1.3]

### Fixed

- Removed semen/milk limit set and fixed refill for both
- Updated images in online and server versions
- Fixed DoL Plus version compilation (was incorrectly compiled as vanilla)

### Changed

- Adjusted unlimited cum to be based on max volume
- Updated debug tool search to display results below interface instead of console
- Optimized pregnancy detection to count named NPCs even if not pregnant
- Updated pregnancy detection to include stored fetuses in cheat

## [1.1.2]

### Fixed

- Fixed infinite pregnancy logic
- Fixed wrong variable for offspring manager (was still placeholder)
- Fixed array error checking after changes

### Planned

- Will add manager for pregnancies stored in cheat when Infinite NPC pregnancy is activated

## [1.1.1]

### Added

- New cheat: Infinite NPC pregnancy (stores pregnancies until 1 day before birth)
- New cheat: Demon sex (temporarily become demon during sex for forced pregnancy ability)

### Fixed

- Added additional exploit fix for invincible angel

### Changed

- Lowered cheat throttle for fetching and toggles for smooth experience

### Note

- New features may be prone to bugs; use with caution

## [1.1.0]

### Fixed

- Fixed online version CSS
- Updated vanilla DoL in server version

### Changed

- Optimized: Cheat now has less performance impact on game
- Optimized: Toggle state now saved in save file; no need to reactivate when loading/refreshing game
- Moved non-cheat functionality as part of main function
- Added delay for info fetcher to reduce performance impact
- Optimized UI to be generative, reducing performance impact
- Added prevention for excessive opening/closing to avoid errors

### Backend Changes

- Implemented storage for cheat in save file
- Changed listener to use lookup table for reduced performance impact
- Updated info fetcher with added delay for performance improvement

## [1.0.19]

### Added

- New cheat: Clean cum (now becomes hygiene; can make yourself dirty and flush cum)
- In-game debug mode (advance version of cheat, disables feats but can be disabled again)

### Fixed

- Fixed invincible angel cheat
- Fixed abortion for items inside anus
- Fixed abortion logic for "Hermaphrodite" parasites

### Changed

- Optimized listener
- Debug mode integration with cheat system

## [1.0.18]

### Added

- New cheat to retain angel transformation even when losing virginity

### Fixed

- Fixed inability to change cum/milk volume and refactory rate
- Fixed info fetcher unable to fetch tentacle info

## [1.0.17]

### Added

- Ability to perform abortion

### Changed

- Small UI improvements

### Note

- Caution: May cause some event problems (e.g., Alex pregnancy event)

## [1.0.16]

### Changed

- Updated cheat for v0.4.6.3 for vanilla version
- Other versions do not require update

### Note

- Current cheat version is not fully tested for v0.4.6.3

## [1.0.15]

### Added

- Sources now available on GitHub
- Previous changelog available in zip files

## [1.0.14]

### Added

- Support for Firebase NWJS version

### Fixed

- Various bugfixes

## [1.0.13]

### Added

- Added support for online DoL versions

### Note

- Not fully tested yet; contact maintainer if issues occur

## [1.0.12]

### Fixed

- Fixed some cheats not working after changes
- Fixed unlimited cum (cum not intense)
- Fixed array access function

## [1.0.11]

### Server Version Changes

- Moved all cheat script to index.php (fewer files)
- Added warning before server save if version differs

### Changes

- Added information about server save and array errors
- Array error fix now available as a tool

### Added

- New accessibility features: enable history button, sidebar button, simplify cheat button
- Aimed at mobile users for easier sidebar and history access
- Brought back sex skill cheat (was forgotten)

## [1.0.10]

### Server Version Changes

- New `start-admin.bat` to run server with admin privileges (fixes permission denied errors)

### Non-Server Version Changes

- Fixed CORS policy compatibility issue; script now moved with DoL

## [1.0.9]

### Fixed

- Fixed pregnancy lock for NPC error
- Fixed cheat prevention in main menu

### Added

- MC offspring manager now available

### Changed

- Changed wolf ferocity from toggle to regular cheat in misc tab

### Optimized

- New daily toggle to reduce computing
- Info fetcher optimization

## [1.0.8]

### Added

- Pregnancy manager: pregnancy lock and day control

### Changed

- Small UI improvements; descriptions now use tooltips

## [1.0.7]

### Added

- School reputation cheat
- Farm vegetables sold in process checker (misc tab)
- Quick performance settings in misc

### Fixed

- Fixed pregnancy detector

### Changed

- Code improvements

## [1.0.6] - Major Release

### Added

- Two cheat versions:
  - **Server version**: Works on any version (may cause bugs on untested versions)
  - **Non-server version**: Works only on current version, no server save required
- Cheat info display
- Pregnancy detection for NPC/player

### Changed

- General script optimization, especially for toggles

### Fixed

- Fixed wolf ferocity and harmony issues

## [1.0.5]

### Added

- Wolfpack ferocity and harmony max cheats
- Auto interact with child

### Changed

- Script optimization
- Sync optimization

### Removed

- Removed mayor project fix (array error fix handles this now)

## [1.0.4]

### Added

- Array error fix for wrong array usage causing data loss (beta)
- Auto detect array error functionality

### Fixed

- Fixed crime mod upgrade that caused problems

### Changed

- Debug deep search now shows more detail
- Code improvements

## [1.0.3]

### Added

- Mayor project fix (if project is gone during gameplay and all projects undiscovered, fix will mark all as finished)

### Fixed

- Fixed parasite removal and infection logic

## [1.0.2]

### Added

- Fame and NPC manager with scope to see current variables
- Exam manager
- Talent manager

### Fixed

- Fixed unlimited cum (now always intense when activated)
- Better error handling for server save function

## [1.0.1]

### Fixed

- Server import/export alert (functionality not yet implemented)
- Fixed server import/export with gaps in save data (1-9)
- Fixed unlimited toggle not working properly
- Added prevention for cheat activation in main menu

## [1.0.0] - Initial Release

Initial release of DoL CheatPlus
