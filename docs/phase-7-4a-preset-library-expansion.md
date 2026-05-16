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
- Compact center 800x600
- Custom center
- Large center 1440x768

Window Positions
- Left half
- Right half
- Full workarea
```

Current center-cycle order:

```text
Compact -> Custom -> Large
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

## Phase 7.4a Scope

Included:

```text
- Expand built-in preset library
- Formalize popup preset grouping structure
- Improve preset-definition organization
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

## Planned New Built-in Presets

### Additional Center Sizes

Planned additions:

```text
Tiny center
Medium center
Ultra-wide center
```

Example target sizes:

```text
Tiny center       640x480
Compact center    800x600
Medium center     1024x768
Custom center     configurable
Large center      1440x768
Ultra-wide center 1600x900
```

Exact dimensions may later be tuned based on portrait-monitor usability and mixed-scaling validation.

---

## Planned Position Presets

Planned additions:

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

---

## Popup Grouping Direction

Popup grouping should remain simple and readable.

Proposed future grouping direction:

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

## Center-Cycle Guardrails

Center-cycle behavior must remain predictable.

Not every new preset should automatically join center cycling.

Expected behavior:

```text
Center-cycle remains intentionally curated.
```

Example:

```text
Tiny -> Compact -> Custom -> Large
```

while:

```text
Ultra-wide center
```

might remain popup-only.

Reason:

```text
Cycling should stay fast and low-friction.
```

---

## Validation Goals

Phase 7.4a passes when:

```text
- popup remains readable with larger preset count
- built-in preset organization remains understandable
- center-cycle remains predictable
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
1. Add additional preset definitions
2. Expand popup grouping safely
3. Validate popup readability
4. Validate portrait monitor behavior
5. Decide which presets belong to center-cycle
```

Do not redesign the popup before validating the expanded preset library baseline.
