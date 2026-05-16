# Phase 7.3 — Preset Cycling and Popup Selection Baseline

## Goal

Phase 7.3 focuses on making the existing preset system faster to operate after Phase 7.2 popup/custom-preset stabilization.

The goal is not to add a large UI layer. The goal is to validate that users can quickly move through common preset sizes and positions without manually reopening configuration surfaces.

---

## Current Foundation

The codebase already contains the core primitives needed for this phase:

```text
CENTER_CYCLE_PRESETS = [center-compact, center, center-large]
cycle-center-next
cycle-center-previous
open-preset-popup
custom-presets-json
```

Current center preset order:

```text
1. Compact center 800x600
2. Custom center from center-width / center-height
3. Large center 1440x768
```

Current default shortcuts:

```text
Super + Alt + .      -> Cycle center next
Super + Alt + ,      -> Cycle center previous
Super + Alt + Space  -> Open preset popup
```

---

## Phase 7.3 Scope

Included:

- Validate center preset cycling behavior.
- Validate forward and backward cycling.
- Validate cycle index inference from the currently focused window.
- Validate behavior after direct shortcut use, popup selection, and saved preset application.
- Keep popup behavior from Phase 7.2f unchanged.
- Keep saved preset save/delete behavior unchanged.
- Keep built-in H/L/F/C behavior unchanged.

Excluded for now:

- GTK settings UI.
- D-Bus service layer.
- User-editable ordering UI.
- Arbitrary cycling across every saved preset.
- Per-application preset profiles.
- Background daemon or external controller.

---

## Expected Behavior

### Forward cycle

```text
Unknown/current non-center geometry
  -> Compact center
  -> Custom center
  -> Large center
  -> Compact center
```

### Backward cycle

```text
Unknown/current non-center geometry
  -> Large center
  -> Custom center
  -> Compact center
  -> Large center
```

### Inference rule

If the focused window already matches one of the center-cycle preset geometries, the next cycle operation should continue from that inferred preset instead of blindly using stale in-memory state.

Example:

```text
Focused window is 1280x720 centered
Super + Alt + .
Expected next preset: Large center 1440x768
```

---

## Phase 7.3a Implementation Fixes

Initial code review found two cycle-state cases that should be fixed before manual validation is treated as authoritative.

### 1. Unknown backward cycle start

When the current geometry is not recognized as a center-cycle preset and no valid remembered center-cycle state exists:

```text
Super+Alt+. should start at Compact center
Super+Alt+, should start at Large center
```

Implementation requirement:

```text
If currentIndex == UNKNOWN_CYCLE_INDEX:
  next direction     -> index 0
  previous direction -> last index
```

Do not derive the unknown backward start by wrapping `UNKNOWN_CYCLE_INDEX + direction`, because that can skip the expected Large center start.

### 2. Stale remembered cycle state after non-center/custom preset

Applying a non-center geometry should reset the remembered center-cycle index unless the currently focused frame can be inferred as one of the center-cycle presets.

This includes:

```text
Left half
Right half
Full workarea
Saved custom preset
```

Reason:

```text
Saved preset apply -> cycle next/previous
```

should behave as an unknown/non-center geometry start, not as a continuation from a previously remembered center preset.

Suggested implementation shape:

```js
_forgetCenterCyclePreset(reason) {
    if (this._centerCycleIndex === UNKNOWN_CYCLE_INDEX)
        return;
    this._debugLog(`action: forgot center cycle index (${reason})`);
    this._centerCycleIndex = UNKNOWN_CYCLE_INDEX;
}
```

Then:

```text
center-cycle preset applied -> remember index
non-center built-in applied -> forget index
custom preset applied       -> forget index
```

---

## Phase 7.3b-A Popup Focused-Window Status Polish

Phase 7.3b-A intentionally stays small. It improves popup readability without adding hidden state, recent-memory logic, restore behavior, active-button styling, or a full OSD system.

Included:

```text
1. Center and bold the popup title: Ubuntu Wayland Sizer
2. Add a Current preset line inside the existing Focused Window section
3. Display the Current preset line in blue bold text so it is easy to notice
```

Expected Focused Window section:

```text
Focused Window
Current preset: Custom / Manual size
Display 1 · 1140x757 · frame 423,238
Workarea 67,32 1853x1168 · relative 356,206
```

The Current preset value is computed only from the focused window geometry at popup-open time. It must not write persistent state.

Matching order:

```text
Left half
Right half
Full workarea
Compact center
Custom center
Large center
Custom / Manual size
```

Suggested visual style:

```css
color: #3584e4;
font-weight: bold;
```

Out of scope for Phase 7.3b-A:

```text
Cycle overlay hint
Full OSD feedback
Recent preset memory
Last non-center restore
Active button highlighting
Animation
User-configurable popup styling
```

---

## Validation Matrix

Minimum apps:

```text
Firefox
GNOME Terminal
Ubuntu Text Editor
VSCode .deb
UpNote .deb
```

Minimum display layouts:

```text
Primary landscape 100%
Secondary portrait-right 100%
Mixed scaling 100% + 150%
```

Minimum flows:

```text
Super+Alt+. repeated forward cycle
Super+Alt+, repeated backward cycle
Unknown geometry -> Super+Alt+. starts Compact center
Unknown geometry -> Super+Alt+, starts Large center
Direct C then cycle next
Direct J/K then cycle next/previous
Direct H/L/F then cycle next/previous
Popup selection then cycle next/previous
Saved preset apply then center cycle
Full workarea then center cycle
Open popup after left/right/full/center presets and confirm Current preset label
Open popup after manual/custom geometry and confirm Custom / Manual size label
```

---

## Safety Requirements

- Cycling must only affect the currently focused normal window.
- Cycling must ignore non-normal windows.
- Cycling must keep current monitor/workarea behavior.
- Cycling must respect workarea clamping on small or portrait displays.
- Cycling must preserve full-workarea breakout behavior.
- Cycling must tolerate Electron minimum-size constraints.
- Cycling must not change saved preset data.
- Cycling must not break popup save/delete return behavior from Phase 7.2f.
- Popup status display must not write persistent state.
- Popup title/status polish must not change preset apply behavior.

---

## Manual Validation Checklist

Phase 7.3 passes when:

- `Super+Alt+.` cycles compact -> custom -> large -> compact.
- `Super+Alt+,` cycles large -> custom -> compact -> large.
- Unknown/non-center geometry + `Super+Alt+.` starts at Compact center.
- Unknown/non-center geometry + `Super+Alt+,` starts at Large center.
- Cycling works after manually applying `Super+Alt+C`.
- Cycling works after manually applying `Super+Alt+J` and `Super+Alt+K`.
- Cycling works after manually applying `Super+Alt+H`, `Super+Alt+L`, and `Super+Alt+F`.
- Cycling works after choosing center presets from the popup.
- Cycling works after applying a saved preset.
- Cycling works after breaking out from full-workarea state.
- Portrait monitor clamping remains sane.
- Electron constrained apps remain edge/center corrected as much as Mutter allows.
- Popup title is centered and bold.
- Focused Window section shows a blue bold Current preset line.
- Current preset is correct for left, right, full, compact center, custom center, and large center.
- Current preset falls back to Custom / Manual size for unmatched geometry.
- No new blocking GNOME Shell warnings appear.

---

## Suggested Test Commands

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

Confirm extension state:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected status:

```text
已啟用: 是
狀態: ACTIVE
```

---

## Status

```text
Phase 7.2f popup/custom-preset usability: PASS
Phase 7.3 preset cycling validation: IN PROGRESS
Phase 7.3a cycle-state implementation fix: REQUIRED
Phase 7.3b-A popup focused-window status polish: READY
```
