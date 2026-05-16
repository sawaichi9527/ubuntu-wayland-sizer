# Phase 7.4a — Preset Library Expansion

## Goal

Phase 7.4a expands the built-in preset library while preserving the current lightweight GNOME Shell extension architecture.

The goal is not to build a tiling window manager.

The goal is:

```text
- more immediately useful built-in layouts
- better popup grouping for larger preset sets
- stronger preset-library foundation for future cycling/popup UX
```

while keeping:

```text
- direct keyboard-first workflow
- popup-first discoverability
- no background daemon
- no D-Bus service
- no GTK settings UI
```

---

## Current Preset Baseline

Current built-in presets:

```text
Center Presets
- Compact Center -- 800x600
- Center -- configured center-width x center-height
- Large Center -- 1440x768

Window Positions
- Left half
- Right half
- Full workarea
```

Current center-cycle order:

```text
Compact Center -> Center -> Large Center
```

Current popup baseline:

```text
Focused Window section                       Log control section
Current Displays section
Center Presets
Window Positions
Saved Presets
Actions
```

---

## Important Semantics

Phase 7.4a must keep these concepts separate:

```text
Center Presets
  Built-in center-position presets shown in the Center Presets popup group.

Saved Presets
  User-saved relative geometry presets stored in custom-presets-json.

Configured Center
  The existing center preset controlled by center-width / center-height settings.
```

The existing configurable center preset remains part of the Center Presets group, but its label should be `Center`, not `Custom Center`, to avoid confusion with Saved Presets.

In other words:

```text
Center
```

means:

```text
center-position preset using configured size
```

not:

```text
saved custom preset
```

---

## Phase 7.4a Scope

Included:

```text
- Expand built-in Center Presets
- Formalize popup preset grouping structure
- Improve preset labels so popup rows include name and size
- Keep popup readable as preset count grows
- Preserve current keyboard workflow
```

Excluded:

```text
- GTK4 settings application
- D-Bus service layer
- Dynamic user-defined built-in groups
- Per-app rules engine
- Auto-tiling behavior
- Background monitor/layout daemon
- Massive popup redesign
```

---

## Planned Center Presets

Phase 7.4a Center Presets group:

```text
Tiny Center       -- 640x480
Compact Center    -- 800x600
Medium Center     -- 1024x768
Center            -- configured center-width x center-height
Large Center      -- 1440x768
Ultra-wide Center -- 1600x900
```

Popup labels should use this style:

```text
Tiny Center -- 640x480
Compact Center -- 800x600
Medium Center -- 1024x768
Center -- 1200x854
Large Center -- 1440x768
Ultra-wide Center -- 1600x900
```

Exact dimensions may later be tuned based on portrait-monitor usability and mixed-scaling validation.

---

## Center-Cycle Semantics

Continuous switching applies only to presets inside the Center Presets group.

That means center cycling should not include:

```text
Left half
Right half
Full workarea
Top/bottom halves
Quarter presets
Saved Presets
```

Center-cycle should remain a curated sequence across center-position presets.

Recommended first 7.4a cycle order:

```text
Tiny Center -> Compact Center -> Medium Center -> Center -> Large Center -> Ultra-wide Center
```

Reason:

```text
All entries belong to Center Presets, so cycling through them is semantically consistent.
```

If validation shows the cycle is too long, Phase 7.4b can introduce a shorter cycle subset later. Phase 7.4a should first validate the full Center Presets library behavior.

---

## Planned Position Presets

Planned additions after Center Presets are stable:

```text
Top half
Bottom half
Top-left quarter
Top-right quarter
Bottom-left quarter
Bottom-right quarter
```

Expected behavior:

```text
- workarea-relative
- monitor-aware
- mixed-scaling aware
- portrait-monitor safe
```

These are not part of center cycling.

---

## Popup Grouping Direction

Popup grouping should remain simple and readable.

Proposed grouping direction:

```text
Focused Window section                       Runtime controls
Current Displays section

Center Presets
Position Presets
Quarter Presets
Saved Presets
Actions
```

Important:

```text
Do not turn the popup into a complex control center.
```

The popup should remain:

```text
small
fast
keyboard-oriented
readable
```

---

## Preset Definition Refactor Direction

Current implementation:

```js
PRESET_DEFINITIONS
POPUP_PRESET_GROUPS
CENTER_CYCLE_PRESETS
```

Phase 7.4a should move toward:

```text
clear preset metadata ownership
clear popup grouping ownership
clear cycle-library ownership
```

without introducing:

```text
runtime-generated preset objects
external preset databases
heavy serialization layers
```

The current lightweight in-memory object model is preferred.

---

## Validation Goals

Phase 7.4a passes when:

```text
- Center Presets show name and size in popup labels
- center-cycle moves only through Center Presets
- popup remains readable with larger preset count
- built-in preset organization remains understandable
- portrait-monitor behavior remains sane
- mixed-scaling behavior remains stable
- no popup overflow regression appears
- no new GNOME Shell warnings/blockers appear
```

---

## Non-Goals

Phase 7.4a intentionally does NOT introduce:

```text
- automatic tiling manager behavior
- dynamic snap-assistant UI
- animation-heavy transitions
- workspace orchestration
- multi-window layouts
- session restore engine
- cloud/profile sync
```

The extension should remain:

```text
focused
small
debuggable
predictable
```

---

## Suggested First Implementation Step

Recommended implementation order:

```text
1. Rename visible configurable center label from Custom Center to Center
2. Add Tiny, Medium, and Ultra-wide Center definitions
3. Expand Center Presets popup group
4. Expand center-cycle to all Center Presets
5. Validate popup readability and cycling behavior
```

Do not redesign the popup before validating the expanded Center Presets library baseline.
