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
Direct C then cycle next
Direct J/K then cycle next/previous
Popup selection then cycle next/previous
Saved preset apply then center cycle
Full workarea then center cycle
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

---

## Manual Validation Checklist

Phase 7.3 passes when:

- `Super+Alt+.` cycles compact -> custom -> large -> compact.
- `Super+Alt+,` cycles large -> custom -> compact -> large.
- Cycling works after manually applying `Super+Alt+C`.
- Cycling works after manually applying `Super+Alt+J` and `Super+Alt+K`.
- Cycling works after choosing center presets from the popup.
- Cycling works after applying a saved preset.
- Cycling works after breaking out from full-workarea state.
- Portrait monitor clamping remains sane.
- Electron constrained apps remain edge/center corrected as much as Mutter allows.
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
Phase 7.3 preset cycling validation: READY
```
