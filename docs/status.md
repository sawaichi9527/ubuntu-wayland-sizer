# Project Status

## Current Milestone

Phase 3 built-in preset dispatcher is functionally validated.

Phase 4 multi-monitor and portrait-monitor geometry validation is functionally validated for the current core test set.

## Validation Environment

- Ubuntu 26.04
- GNOME Shell 50
- Wayland session
- User-local extension install path
- Primary monitor landscape
- Secondary monitor portrait-right

## Confirmed Behavior

- Extension can be disabled and enabled cleanly.
- Extension-local GSettings schema is found after logout/login and reinstall.
- Built-in preset keybindings are registered successfully.
- The current non-arrow keybindings trigger preset actions reliably.
- The currently focused normal window moves/resizes according to the selected preset.
- Workarea-based geometry is correct on both the primary monitor and the secondary portrait-right monitor.

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

All tested applications responded correctly to the current built-in preset actions.

## Confirmed Geometry Examples

Primary monitor workarea example:

```text
monitor=0, workarea=67,32 1853x1168
left   -> 67,32 926x1168
right  -> 993,32 927x1168
full   -> 67,32 1853x1168
center -> 353,256 1280x720
```

Secondary portrait-right monitor workarea example:

```text
monitor=1, workarea=1920,0 1080x1920
left   -> 1920,0 540x1920
right  -> 2460,0 540x1920
full   -> 1920,0 1080x1920
center -> 1920,600 1080x720
```

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
```

Notes:

- DING messages come from Ubuntu/GNOME desktop-icons integration.
- Extension update `Not Found` is expected because the extension is not published on extensions.gnome.org.
- `Error in size change accounting.` appeared during earlier resize tests but did not prevent successful operation.
- The libinput debounce message appears unrelated to the extension.

## External Shell UI Issue Observed

A GNOME app grid / Ubuntu Dock issue was observed separately, where the application grid could appear partially blank. Isolation testing showed this is not caused by Ubuntu Wayland Sizer. Disabling/re-enabling GNOME extensions such as Ubuntu Dock restored normal behavior.

## Next Recommended Step

Continue Phase 4 with broader compatibility testing before adding D-Bus or GTK4 UI.

Suggested next test coverage:

- Electron applications
- LibreOffice
- Maximized windows
- Different monitor scale factors
- Minimum-size constrained dialogs
- Apps with client-side decorations

Do not add D-Bus or GTK4 UI until the extension-only geometry behavior is stable enough.
