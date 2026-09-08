# Using the panel

Click the draggable **Cheat** button or press `Ctrl+Shift+C`. The modal contains Quick, Stat, and Misc sections, each mounted when first opened.

- Quick contains one-shot actions and persistent frame/daily toggles.
- Stat contains player, body, skill, reputation, and enemy editors.
- Misc contains NPC, pregnancy, offspring, farm, and diagnostic tools.

Dropdown editors fetch the current value when opened or when selection changes. Active text input is protected from background refreshes. Destructive pregnancy and child actions require confirmation.

Repeating toggles are stored by stable descriptor ID. Closing and reopening preserves enabled intent; runtime failure quarantines only the failing toggle.
