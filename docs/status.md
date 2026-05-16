# Project Status

## Current Milestone

Phase 7.4a preset library expansion is the current functional baseline.

Phase 7.5 is a release-readiness and polish track based on the Phase 7.4a baseline.

Phase 7.5a focuses on roadmap cleanup and protected-core guardrails. It intentionally does not change runtime behavior.

The current baseline includes:

- built-in preset resizing
- expanded Center Presets library
- metadata-driven center preset cycling
- popup preset selection
- custom saved presets
- save/delete popup flows
- built-in preset feedback overlay
- structured GNOME Shell journal logging
- popup runtime debug-log toggle
- workarea-based geometry
- multi-monitor and mixed-scaling behavior
- full-workarea / maximized-like breakout before resizing
- safe restore before applying target presets
- post-resize correction for constrained app behavior

## Validation Environment

- Ubuntu 26.04
- GNOME Shell 50
- Wayland session
- User-local extension install path
- Primary monitor landscape
- Secondary monitor portrait-right
- Tested scale combinations:
  - 100% + 100%
  - 125% + 125%
  - 150% + 150%
  - 100% + 125%
  - 100% + 150%

## Confirmed Behavior

- Extension can be disabled and enabled cleanly after deploy and logout/login.
- Extension-local GSettings schema is found after logout/login and reinstall.
- Built-in preset keybindings are registered successfully.
- The current non-arrow keybindings trigger preset actions reliably.
- The currently focused normal window moves/resizes according to the selected preset.
- Workarea-based geometry is correct on both the primary monitor and the secondary portrait-right monitor.
- Mixed-scaling logical workarea geometry is usable.
- Electron minimum-width constrained windows can be edge-corrected after resize.
- Full-workarea/maximized-like windows can be broken out before applying left/right/center presets.
- Center preset cycling works across the expanded Phase 7.4a Center Presets library.
- Popup preset selection works for built-in and saved custom presets.
- Saved custom presets can be created, persisted, applied, and deleted.
- Popup save/delete secondary dialogs return to the popup after non-terminal decisions.
- Invalid saved-preset names remain inside the save dialog.
- Built-in preset feedback overlay appears after built-in preset application and center cycling.
- Structured journal logs use NORMAL, DEBUG, WARNING, and CRITICAL levels.
- DEBUG logs are gated by the `debug-logging` setting.
- Popup runtime controls can switch between Normal and Debug logging modes without restarting the extension.

## Phase 7.4a Center Presets Baseline

Phase 7.4a standard Center Presets:

```text
Tiny Center         -> 640x480
Compact Center      -> 800x600
Medium Center       -> 1024x768
Wide-medium Center  -> 1152x864
Large Center        -> 1280x960
Ultra-wide Center   -> 1600x900
```

Center cycling is limited to the Center Presets group and wraps in both directions.

Position presets remain separate from center cycling:

```text
Left half
Right half
Full workarea
```

Saved Presets remain user-saved relative geometry presets and are not part of center cycling.

## Confirmed Presets and Shortcuts

```text
Super + Alt + H      -> Left half
Super + Alt + L      -> Right half
Super + Alt + F      -> Full workarea
Super + Alt + C      -> Wide-medium Center
Super + Alt + J      -> Compact Center
Super + Alt + K      -> Large Center
Super + Alt + .      -> Cycle center next
Super + Alt + ,      -> Cycle center previous
Super + Alt + Space  -> Open preset popup
```

Arrow-key defaults are intentionally avoided because Ubuntu/GNOME may intercept `Super + Alt + Arrow` combinations for built-in window-management behavior.

## Protected Core Guardrails

The following areas are compatibility-critical for GNOME Shell 50 + Wayland + Mutter and should not be removed, simplified, or refactored without equivalent validation:

- workarea-based geometry instead of raw monitor geometry
- focused-window monitor resolution
- multi-monitor and mixed-scaling geometry handling
- portrait-right monitor support
- full-workarea / maximized-like detection
- safe restore before resizing from full-workarea/maximized-like states
- delayed resize after Mutter state transition
- post-resize readback and correction
- Electron / minimum-width constrained app edge correction
- Mutter / Wayland move/resize ordering assumptions

These workarounds are not cosmetic. They are part of the core reason the extension can provide Sizer-like behavior under Wayland and Mutter constraints.

See:

```text
docs/phase-7-5a-roadmap-and-guardrails.md
```

## Panel Indicator Decision

Panel indicator support is deferred and is not part of Phase 7.5.

The extension state can be checked through GNOME Extensions / Extension Manager, so a Shell panel indicator would add extra UI lifecycle and compatibility risk without being necessary for the release-readiness baseline.

## Confirmed Applications

The following applications have been tested successfully on both the primary monitor and the secondary portrait-right monitor:

- Firefox
- Terminal
- Ubuntu 26.04 built-in text editor
- LibreOffice
- VSCode .deb
- UpNote .deb

The 100% + 150% mixed-scaling smoke test passed across the primary and secondary monitor for the current core test set.

## Full-workarea Breakout Validation

The implementation detects full-workarea/maximized-like frames by comparing the window frame against the monitor workarea, not only by checking `get_maximized()`.

Expected successful flow:

```text
[ubuntu-wayland-sizer][DEBUG] action: full-workarea state detected; breaking out before preset left
[ubuntu-wayland-sizer][DEBUG] action: applied safe restore before preset left
[ubuntu-wayland-sizer][DEBUG] action: geometry context (after-full-workarea-breakout)
[ubuntu-wayland-sizer][DEBUG] action: applied preset left
[ubuntu-wayland-sizer][DEBUG] action: post-correction not needed for left
```

This behavior is protected core.

## Minimum-width Constrained App Behavior

UpNote/Electron may reject narrow half-width requests on portrait monitors because the requested half width can be smaller than the app's minimum width.

The extension accepts the actual window size after Mutter/app constraints are applied and then edge-corrects the window to the intended side.

Example:

```text
requested right half: 360x1280
actual app-constrained width: 600x1280
corrected right position: workarea.right - 600
```

This means constrained apps may not visually occupy exactly 50% of a narrow portrait monitor, but they are aligned correctly within the available workarea.

This behavior is protected core.

## Structured Logging Baseline

Current log format:

```text
[ubuntu-wayland-sizer][NORMAL] enable: start
[ubuntu-wayland-sizer][DEBUG] popup: open requested
[ubuntu-wayland-sizer][WARNING] action: post-correction failed for center: ...
[ubuntu-wayland-sizer][CRITICAL] custom-preset: failed to parse custom-presets-json: ...
```

Log-level policy:

```text
NORMAL   user-visible operation result or runtime mode change
DEBUG    geometry trace, inference, popup lifecycle details
WARNING  recoverable anomaly; correction or fallback happened
CRITICAL real failure; feature may not work
```

DEBUG logs are controlled by:

```text
debug-logging
```

Popup runtime controls can switch:

```text
Log: Debug  -> Switch to Normal
Log: Normal -> Switch to Debug
```

## Popup Runtime Controls Baseline

Current popup layout:

```text
Popup title: Ubuntu Wayland Sizer

Focused Window section                       Log control section
Current Displays section
Center Presets
Window Positions
Saved Presets
Actions
```

The Log control section is intentionally lightweight. It is not a full settings UI.

## Development Deployment Flow

For local validation:

```bash
git pull
./scripts/install-extension-dev.sh
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

After JavaScript class/method changes, use a full GNOME logout/login to avoid GJS module-cache confusion.

Then confirm extension state:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected status:

```text
已啟用: 是
狀態: ACTIVE
```

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

## Non-blocking Warnings Observed

The following messages were observed during development and are not currently treated as blockers:

```text
DING: ...
Gio.DBusError: Unknown interface org.freedesktop.IBus or property Engines
Error while downloading update for extension ubuntu-wayland-sizer@sawaichi9527: (Unexpected response: Not Found)
Invalid sequence for VSYNC frame info
Error in size change accounting.
libinput error: client bug: timer button-debounce-debounce-event4: scheduled expiry is in the past
Can't update stage views actor unnamed [...] is on because it needs an allocation.
cogl_framebuffer_set_viewport: assertion 'width > 0 && height > 0' failed
```

Notes:

- DING messages come from Ubuntu/GNOME desktop-icons integration.
- Extension update `Not Found` is expected because the extension is not published on extensions.gnome.org.
- `Error in size change accounting.` appeared during earlier resize tests but did not prevent successful operation.
- The libinput debounce message appears unrelated to the extension.
- Stage-view allocation warnings and Cogl viewport warnings were observed after monitor scale/layout changes and are currently classified as GNOME Shell/Clutter layout warnings, not extension blockers.

## External Shell UI Issue Observed

A GNOME app grid / Ubuntu Dock issue was observed separately, where the application grid could appear partially blank. Isolation testing showed this is not caused by Ubuntu Wayland Sizer. Disabling/re-enabling GNOME extensions such as Ubuntu Dock restored normal behavior.

Related logs point to:

```text
resource:///org/gnome/shell/ui/iconGrid.js
resource:///org/gnome/shell/ui/appDisplay.js
file:///usr/share/gnome-shell/extensions/ubuntu-dock@ubuntu.com/docking.js
```

## Phase Status

```text
Phase 7.2f popup/custom-preset usability: PASS
Phase 7.3 preset cycling and popup selection baseline: COMPLETE
Phase 7.3c structured logging backend: COMPLETE
Phase 7.3d popup runtime controls: COMPLETE
Phase 7.3e roadmap cleanup: COMPLETE
Phase 7.4a preset library expansion: PASS / CURRENT BASELINE
Phase 7.5a roadmap and guardrails: PASS
Phase 7.5b version visibility: PASS
Phase 7.5c deployment docs: PASS
```

## Next Recommended Step

Continue with Phase 7.5d UX wording polish.

Recommended Phase 7.5 sequence:

- 7.5a roadmap and guardrail docs
- 7.5b version visibility
- 7.5c deployment docs
- 7.5d UX wording polish
- 7.5e i18n-ready note only

Do not add D-Bus, GTK4 settings UI, a background service, or panel indicator during Phase 7.5.
