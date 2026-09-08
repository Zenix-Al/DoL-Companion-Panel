# Package UI-8 Browser Acceptance Checklist

> Historical record. This checklist belongs to the completed UI-8 migration and
> is not the current release checklist.

**Date:** 2026-09-05  
**Build:** Production userscript artifact (2.0.31+)  
**Reviewer:** [Your Name]

## Test Environment

- [ ] Vanilla DoL v0.x.x.x
- [ ] DoL Plus (current) v0.x.x.x
- [ ] Browser: [Chrome/Firefox/Safari/Edge]
- [ ] Userscript Manager: [TamperMonkey/GreaseMonkey/ViolentMonkey]

## Quick Section Tests

### Layout & Rendering
- [ ] Quick section renders with no empty placeholder slots
- [ ] All 25 descriptors mount in deterministic order at their semantic positions
- [ ] Version/update footer appears after all descriptors (not before)
- [ ] Compatibility info displays correctly
- [ ] No duplicate controls (old Player State and Crime are gone)

### Control Tests
- [ ] One-shot cheats render with buttons, not hybrid controls
- [ ] Editor controls (text inputs) accept input and display values
- [ ] Range controls render with working min/max
- [ ] Toggle controls display as accessible checkboxes with labels
- [ ] All controls use consistent shared styling (buttons, inputs, toggles)
- [ ] Disabled state is clearly visible with readable reason
- [ ] Responsive layout works on narrow (420px) and wide (1024px) viewports

### Interaction Tests
- [ ] Button activation triggers expected action
- [ ] Input values persist and update live
- [ ] Toggle state changes persist across reload
- [ ] Feedback messages display for actions
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Search bar remains sticky and doesn't cover focused rows

---

## Stat Section Tests

### Layout & Rendering
- [ ] Stat section renders with no empty slots
- [ ] All 16 descriptors mount at semantic group anchors
- [ ] Group headings (Player, Characteristics, Enemy, Fame, School, Stats, Talent) remain attached to their controls
- [ ] No blank regions between headings and controls

### Control Tests (representative sample)
- [ ] Player state controls render and respond
- [ ] Characteristics stat displays with correct values
- [ ] Enemy interaction controls work
- [ ] Fame selection displays available NPCs
- [ ] School reputation shows correct values
- [ ] Talent manager displays available talents
- [ ] Unavailable selectors show empty state with explanation

### Dynamic Content Tests
- [ ] NPC selectors populate with available NPCs
- [ ] Empty NPC lists show "No NPCs available" rather than crashing
- [ ] Missing game data shows unavailable reason (not blank)
- [ ] Options update when game state changes (after refresh)

---

## Misc Section Tests

### Layout & Rendering
- [ ] Misc section renders with no empty slots
- [ ] All 16 descriptors mount in order
- [ ] Help rows (pregnancy, NPC info) render independently from cheats
- [ ] No detached headings or misplaced controls

### Control Tests (representative sample)
- [ ] Pregnancy manager displays pregnancies (if any exist)
- [ ] NPC selection works with available characters
- [ ] Offspring manager shows children correctly
- [ ] Farm control displays and accepts input
- [ ] Mod-only cheats show appropriate unavailable reason
- [ ] Diagnostics controls render with correct visual state

### Help & Unavailable State Tests
- [ ] Pregnancy help row displays without relying on cheat definitions
- [ ] NPC help describes available characters
- [ ] Missing/empty data shows readable reason in tooltip
- [ ] Partial manager disables only affected controls (not entire row)
- [ ] Recovered state shows when data becomes available mid-session

---

## Cross-Section Regression Tests

### Modal & Search
- [ ] Modal opens/closes without errors
- [ ] Search filters across all three sections
- [ ] Search bar remains visible and sticky
- [ ] Focused row is not covered by sticky search

### Persistence & Lifecycle
- [ ] Modal close removes all listeners and cleanup callbacks
- [ ] Modal reopen mounts exactly one root per descriptor
- [ ] Toggle state persists across close/reopen
- [ ] Page refresh preserves toggle state from save file

### Responsive & Mobile
- [ ] Narrow layout (420px) collapses to single column
- [ ] Wide layout (1024px) uses expected grid
- [ ] No horizontal scroll
- [ ] Controls don't hide behind bottom navigation
- [ ] Touch targets are accessible size

---

## Issues Confirmed FIXED

- [ ] ✅ No empty slots before descriptors
- [ ] ✅ No appended descriptors at section end
- [ ] ✅ No duplicate legacy controls (Player State/Crime gone)
- [ ] ✅ No detached headings from their control rows
- [ ] ✅ No premature footer placement
- [ ] ✅ Disabled reasons are visible in tooltips
- [ ] ✅ Close glyph renders correctly (not mojibake)

---

## Sign-Off

**Tester:** ________________  
**Date:** ________________  
**All checks passed:** ☐ YES ☐ NO  

**Issues found (if any):**
```
[Describe any regressions or new issues discovered]
```

**Browser evidence archive:**  
- Screenshots: `test/browser-acceptance-evidence-2026-09-05/screenshots/`
- Console logs: `test/browser-acceptance-evidence-2026-09-05/logs/`
- Video: `test/browser-acceptance-evidence-2026-09-05/video.webm` (optional)

---

**Next steps if passed:**
1. Run final lint and manifest validation
2. Confirm full factory suite still passes
3. Delete legacy renderer, metadata registries, and hybrid code
4. Update CHEAT_FACTORY_RENDERER.md to remove legacy references
5. Mark Package UI-8 and Final Acceptance complete
