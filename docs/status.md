# Project Status

## Current Milestone

Phase 3 built-in preset dispatcher is functionally validated on core desktop applications.

Phase 4 geometry safety and multi-application observation is in progress.

## Validation Environment

- Ubuntu 26.04
- GNOME Shell 50
- Wayland session
- User-local extension install path

## Confirmed Behavior

- Extension can be disabled and enabled cleanly.
- Extension-local GSettings schema is found after logout/login and reinstall.
- Built-in preset keybindings are registered successfully.
- `Super + Alt + Arrow` shortcuts trigger preset actions.
- The currently focused normal window moves/resizes according to the selected preset.

## Confirmed Presets

```text
Super + Alt + Left   -> Left half
Super + Alt + Right  -> Right half
Super + Alt + Up     -> Full workarea
Super + Alt + Down   -> Center 1280x720
```

## Confirmed Applications

The following applications have been tested successfully:

- Firefox
- Terminal
- Ubuntu 26.04 built-in text editor

All tested applications responded correctly to the current built-in preset actions.

## Observed Expected Logs

```text
[ubuntu-wayland-sizer] disable: start
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-left
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
```

Notes:

- DING messages come from Ubuntu/GNOME desktop-icons integration.
- Extension update `Not Found` is expected because the extension is not published on extensions.gnome.org.
- `Error in size change accounting.` appears after resize and should be monitored, but it did not prevent the window from moving/resizing successfully.

## Next Recommended Step

Continue Phase 4 with broader compatibility testing before adding D-Bus or GTK4 UI.

Suggested next test coverage:

- Multi-monitor layout
- Different monitor scale factors
- Maximized windows
- Electron applications
- LibreOffice
- Minimum-size constrained dialogs
- Apps with client-side decorations

Do not add D-Bus or GTK4 UI until the extension-only geometry behavior is stable enough.
