# Project Status

## Current Milestone

Phase 3 built-in preset dispatcher is functionally validated.

Phase 4 multi-monitor, portrait-monitor, mixed-scaling, minimum-width constrained app, and full-workarea breakout behavior are functionally validated for the current core test set.

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

- Extension can be disabled and enabled cleanly.
- Extension-local GSettings schema is found after logout/login and reinstall.
- Built-in preset keybindings are registered successfully.
- The current non-arrow keybindings trigger preset actions reliably.
- The currently focused normal window moves/resizes according to the selected preset.
- Workarea-based geometry is correct on both the primary monitor and the secondary portrait-right monitor.
- Mixed-scaling logical workarea geometry is usable.
- Electron minimum-width constrained windows can be edge-corrected after resize.
- Full-workarea/maximized-like windows can be broken out before applying left/right/center presets.

## Confirmed Presets

```text
Super + Alt + H      -> Left half
Super + Alt + L      -> Right half
Super + Alt + F      -> Full workarea
Super + Alt + C      -> Center 1280x720
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

The 100% + 150% mixed-scaling smoke test passed across the primary and secondary monitor for the current four-app test set.

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

The latest implementation detects full-workarea/maximized-like frames by comparing the window frame against the monitor workarea, not only by checking `get_maximized()`.

Expected successful flow:

```text
[ubuntu-wayland-sizer] action: full-workarea state detected; breaking out before preset left
[ubuntu-wayland-sizer] action: applied safe restore before preset left
[ubuntu-wayland-sizer] action: geometry context (after-full-workarea-breakout)
[ubuntu-wayland-sizer] action: applied preset left
[ubuntu-wayland-sizer] action: post-correction not needed for left
```

This has been validated on both primary and secondary monitor paths in mixed-scaling tests.

## Minimum-width Constrained App Behavior

UpNote/Electron may reject narrow half-width requests on portrait monitors because the requested half width can be smaller than the app's minimum width.

The extension now accepts the actual window size after Mutter/app constraints are applied and then edge-corrects the window to the intended side.

Example:

```text
requested right half: 360x1280
actual app-constrained width: 600x1280
corrected right position: workarea.right - 600
```

This means constrained apps may not visually occupy exactly 50% of a narrow portrait monitor, but they are aligned correctly within the available workarea.

## Observed Expected Logs

```text
[ubuntu-wayland-sizer] disable: start
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-left
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-right
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-full
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-center
[ubuntu-wayland-sizer] disabled
[ubuntu-wayland-sizer] enable: start
[ubuntu-wayland-sizer] enable: settings loaded from metadata settings-schema
[ubuntu-wayland-sizer] enable: keybinding registered: resize-left -> left
[ubuntu-wayland-sizer] enable: keybinding registered: resize-right -> right
[ubuntu-wayland-sizer] enable: keybinding registered: resize-full -> full
[ubuntu-wayland-sizer] enable: keybinding registered: resize-center -> center
[ubuntu-wayland-sizer] enabled
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

## Next Recommended Step

Continue Phase 4 hardening before adding D-Bus or GTK4 UI.

Suggested next test coverage:

- 100% + 125% retest with the latest full-workarea breakout logic
- Repeated maximize -> H/L/C stress loops
- Minimum-size constrained dialogs
- Additional Electron applications
- Apps with client-side decorations

Do not add D-Bus or GTK4 UI until the extension-only geometry behavior is stable enough.
