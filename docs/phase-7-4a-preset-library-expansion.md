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

Current built-in presets before Phase 7.4a:

```text
Center Presets
- Compact Center -- 800x600
- configurable center-width x center-height
- Large Center -- 1440x768

Window Positions
- Left half
- Right half
- Full workarea
```

Current center-cycle order before Phase 7.4a:

```text
Compact Center -> configured center -> Large Center -> Compact Center
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

Phase 7.4a separates these concepts:

```text
Center Presets
  Standard built-in center-position presets shown in the Center Presets popup group.

Saved Presets
  User-saved relative geometry presets stored in custom-presets-json.
```

Phase 7.4a no longer treats the configurable `center-width` / `center-height` value as a Center Presets library entry.

The standardized library entry that replaces the old configurable center slot is:

```text
Wide-medium Center -- 1152x864
```

If a user needs another custom center size, that requirement should use:

```text
Saved Presets
```

not another configurable built-in Center Presets entry.

This keeps the architecture simple:

```text
standard built-in library sizes -> Center Presets
user-defined/special sizes      -> Saved Presets
```

The existing schema keys may remain for compatibility, but they should not define the Phase 7.4a popup/cycle library baseline.

---

## Phase 7.4a Scope

Included:

```text
- Expand built-in Center Presets
- Standardize Center Presets dimensions
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
- Additional configurable center preset entry
```

---

## Planned Center Presets

Phase 7.4a Center Presets group:

```text
Tiny Center         -- 640x480
Compact Center      -- 800x600
Medium Center       -- 1024x768
Wide-medium Center  -- 1152x864
Large Center        -- 1280x960
Ultra-wide Center   -- 1600x900
```

Popup labels should use the current popup separator style between name and size:

```text
Tiny Center -- 640x480
Compact Center -- 800x600
Medium Center -- 1024x768
Wide-medium Center -- 1152x864
Large Center -- 1280x960
Ultra-wide Center -- 1600x900
```

In the examples above, `--` represents the same long separator style currently used by the popup labels, not a shell option or command syntax.

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

Center-cycle should remain a curated sequence across standard center-position presets.

Recommended first 7.4a cycle order:

```text
Tiny Center -> Compact Center -> Medium Center -> Wide-medium Center -> Large Center -> Ultra-wide Center -> Tiny Center
```

Reverse direction must also wrap:

```text
Tiny Center -> Ultra-wide Center -> Large Center -> Wide-medium Center -> Medium Center -> Compact Center -> Tiny Center
```

Required behavior:

```text
- Cycling next from Ultra-wide Center wraps to Tiny Center.
- Cycling previous from Tiny Center wraps to Ultra-wide Center.
- The cycle is circular, not end-stopped.
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
- Center Presets use standardized library dimensions
- center-cycle moves only through Center Presets
- center-cycle wraps in both directions
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
- second configurable center preset path
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
1. Replace the old configurable center popup entry with Wide-medium Center
2. Standardize center preset definitions
3. Expand Center Presets popup group
4. Expand center-cycle to all Center Presets with circular wraparound
5. Validate popup readability and cycling behavior
6. Route ad-hoc custom sizes through Saved Presets
```

Do not redesign the popup before validating the expanded Center Presets library baseline.
