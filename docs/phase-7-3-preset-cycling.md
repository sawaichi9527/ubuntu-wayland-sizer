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

## Phase 7.3b-B Built-in Preset Apply Feedback Overlay

Phase 7.3b-B adds a lightweight visual confirmation after built-in preset application.

Plain-language goal:

```text
When the user quickly changes window size with shortcuts or built-in popup presets, briefly show what size preset was just applied.
```

Included built-in presets:

```text
Left half
Right half
Full workarea
Custom center
Compact center
Large center
Center cycle next / previous results
```

Excluded:

```text
Custom saved preset overlay
Saved preset semantic tracking
Recent preset memory
Last non-center restore
Notification-center integration
User-configurable overlay duration
Complex animation
```

Overlay behavior:

```text
1. Show only after a built-in preset is successfully applied.
2. Display preset label and actual target size.
3. Use one overlay only; do not stack multiple overlays.
4. During repeated shortcut presses, update the same overlay text and reset the timeout.
5. Auto-hide after about 1300 ms.
6. Do not write persistent state.
7. Remove overlay and pending timeout on extension disable.
```

Suggested display:

```text
Large center
1440 × 768
```

If the preset is clamped by a small/portrait display, show the actual clamped target:

```text
Large center
720 × 768
```

Reason custom saved presets are excluded:

```text
Custom saved presets are chosen deliberately from the popup and are not part of the fast keyboard cycle. The user already knows which saved preset was selected, so an overlay adds less value there.
```

---

## Phase 7.3c-4 Logging Level Audit

Phase 7.3c-4 improves observability without changing sizing behavior. The goal is lightweight, useful journal output for a small focused-window sizing tool, not a full logging framework.

### 7.3c-4A — Logging Level Backend

Use four log levels:

```text
CRITICAL  real failure; feature may not work
WARNING   recoverable anomaly; correction or fallback happened
NORMAL    user-visible operation result or runtime mode change
DEBUG     geometry trace, inference, popup lifecycle details
```

Output policy:

```text
NORMAL/WARNING/CRITICAL are always written to journal.
DEBUG is written only when debug-logging=true.
```

Suggested format:

```text
[ubuntu-wayland-sizer][NORMAL] action: applied preset center: 393,189 1200x854
[ubuntu-wayland-sizer][WARNING] action: post-corrected preset center-large: actual=273,232 800x600, corrected=593,316 800x600
[ubuntu-wayland-sizer][CRITICAL] custom-preset: failed to parse custom-presets-json: ...
[ubuntu-wayland-sizer][DEBUG] action: geometry context ...
```

Do not add custom timestamps. journald/syslog already provide timestamps, process information, and ordering.

### 7.3c-4B — Popup Runtime Controls Foundation

Popup header should reserve a lightweight runtime controls area. Initially it only provides:

```text
Log: Normal / Log: Debug
```

Behavior:

```text
Log: Normal -> debug-logging=false
Log: Debug  -> debug-logging=true
```

Switching must be immediate and must not require extension restart, schema recompilation, logout/login, or GNOME Shell restart.

The mode-change event itself must always be written as NORMAL, not DEBUG:

```text
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG enabled (popup control)
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG disabled (popup control)
```

Reason: when disabling debug, the transition must still be visible in journal.

The popup header layout should not be tightly coupled to logging. It should remain usable as a future runtime controls area for localization, for example:

```text
Language: zh_TW / EN
Log: Normal / Debug
```

Future language changes should similarly emit NORMAL events:

```text
[ubuntu-wayland-sizer][NORMAL] language changed: zh_TW (popup control)
```

### Guardrails

```text
No background daemon
No timer-based log polling
No extension-owned log file writer
No custom timestamp prefix
No full settings UI
No per-category debug matrix
No popup-as-control-center expansion
No resize/geometry behavior changes
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
Repeated built-in preset shortcuts update one overlay without stacking
Overlay shows actual clamped size on portrait/small workarea
Custom saved preset apply does not show overlay
Debug disabled: NORMAL/WARNING/CRITICAL are visible; DEBUG is hidden
Debug enabled: DEBUG trace appears
Popup log toggle writes a NORMAL mode-change event
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
- Overlay must not stack on repeated shortcuts.
- Overlay must clean up on extension disable.
- Overlay must not appear for custom saved preset application.
- Log-level changes must not change resize behavior.
- Runtime log toggle must write a NORMAL event.

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
- Built-in preset overlay appears after direct built-in shortcut use.
- Built-in preset overlay appears after center-cycle shortcut use.
- Overlay shows preset label and actual target size.
- Repeated shortcut presses update one overlay instead of stacking.
- Overlay auto-hides after about 1300 ms.
- Saved custom preset apply does not show overlay.
- NORMAL logs remain visible when debug logging is disabled.
- DEBUG logs appear only when debug logging is enabled.
- Popup logging mode toggle writes a NORMAL journal event.
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
Phase 7.3b-B built-in preset apply feedback overlay: READY
Phase 7.3c-4 logging level audit: READY
```

---

## Phase 7.3c Backend Validation Result

Result: PASS

Observed after deploy, schema compile, and logout/login:

```text
[ubuntu-wayland-sizer][NORMAL] enable: start
[ubuntu-wayland-sizer][DEBUG] enable: settings loaded from metadata settings-schema; debug-logging=true
[ubuntu-wayland-sizer][DEBUG] enable: keybinding registered: resize-left -> left
[ubuntu-wayland-sizer][NORMAL] enabled
```

Confirmed deployed extension contains:

```text
LOG_LEVELS
${LOG_PREFIX}[${level}] ${message}
```

Note:

GNOME may log this for the local development UUID:

```text
Error while downloading update for extension ubuntu-wayland-sizer@sawaichi9527: (Unexpected response: Not Found)
```

This is non-blocking and only indicates that extensions.gnome.org has no matching published extension package for the local development UUID.

Phase 7.3c logging backend: PASS

---

## Phase 7.3d Popup Runtime Controls Validation

Result: PASS

Implemented popup runtime log mode control.

Layout:

```text
Popup title: Ubuntu Wayland Sizer

Focused Window section                       Log control section
Current Displays section
Preset sections
Saved Presets
Actions
```

Validated behavior:

```text
- Popup shows current log mode.
- Switch to Normal sets debug-logging=false.
- Switch to Debug sets debug-logging=true.
- Mode switching does not require extension restart.
- Popup refreshes after switching.
- NORMAL mode-change events remain visible when DEBUG is disabled.
```

Observed journal output:

```text
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG disabled (popup control)
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG enabled (popup control)
```

Phase 7.3d popup runtime controls: PASS
