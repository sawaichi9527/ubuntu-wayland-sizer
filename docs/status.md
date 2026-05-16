# Project Status

## Current Milestone

Phase 7.3 is functionally complete through popup runtime controls.

The current baseline includes:

- built-in preset resizing
- configurable center size
- center preset cycling
- popup preset selection
- custom saved presets
- save/delete popup flows
- built-in preset feedback overlay
- structured GNOME Shell journal logging
- popup runtime debug-log toggle

Phase 7.3e is a cleanup/documentation phase before starting Phase 7.4.

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
- Center preset cycling works across Compact, Custom, and Large center presets.
- Popup preset selection works for built-in and saved custom presets.
- Saved custom presets can be created, persisted, applied, and deleted.
- Popup save/delete secondary dialogs return to the popup after non-terminal decisions.
- Invalid saved-preset names remain inside the save dialog.
- Built-in preset feedback overlay appears after built-in preset application and center cycling.
- Structured journal logs use NORMAL, DEBUG, WARNING, and CRITICAL levels.
- DEBUG logs are gated by the `debug-logging` setting.
- Popup runtime controls can switch between Normal and Debug logging modes without restarting the extension.

## Confirmed Presets and Shortcuts

```text
Super + Alt + H      -> Left half
Super + Alt + L      -> Right half
Super + Alt + F      -> Full workarea
Super + Alt + C      -> Custom center
Super + Alt + .      -> Cycle center next
Super + Alt + ,      -> Cycle center previous
Super + Alt + Space  -> Open preset popup
```

Arrow-key defaults were removed because Ubuntu/GNOME may intercept `Super + Alt + Arrow` combinations for window switching or window-management behavior.

## Confirmed Applications

The following applications have been tested successfully on both the primary monitor and the secondary portrait-right monitor:

- Firefox
- Terminal
- Ubuntu 26.04 built-in text editor
- LibreOffice
- VSCode .deb
- UpNote .deb

The 100% + 150% mixed-scaling smoke test passed across the primary and secondary monitor for the current core test set.

## Confirmed Geometry Examples

Primary monitor workarea example:

```text
monitor=0, workarea=67,32 1853x1168
left   -> 67,32 926x1168
right  -> 993,32 927x1168
full   -> 67,32 1853x1168
center -> 353,256 1280x720
```

Secondary portrait-right monitor workarea examples:

```text
100% scale:
monitor=1, workarea=1920,0 1080x1920
left   -> 1920,0 540x1920
right  -> 2460,0 540x1920
full   -> 1920,0 1080x1920
center -> 1920,600 1080x720
```

```text
Mixed scaling example:
monitor=1, workarea=1920,0 720x1280
left   -> 1920,0 360x1280
right  -> 2280,0 360x1280
full   -> 1920,0 720x1280
center -> 1920,280 720x720
```

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

This has been validated on both primary and secondary monitor paths in mixed-scaling tests.

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

Observed runtime toggle events:

```text
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG disabled (popup control)
[ubuntu-wayland-sizer][NORMAL] logging mode changed: DEBUG enabled (popup control)
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
Phase 7.3e roadmap cleanup: IN PROGRESS
```

## Next Recommended Step

Finish Phase 7.3e cleanup, then move to Phase 7.4.

Recommended Phase 7.4 scope:

- preset library expansion
- popup grouping/polish for larger preset sets
- optional preset cycling refinements
- keep runtime controls lightweight

Do not add D-Bus, GTK4 settings UI, or a background service until the extension-only behavior remains stable across the Phase 7 popup/runtime-control baseline.
