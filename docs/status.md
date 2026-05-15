# Project Status

## Current Milestone

Phase 2 focused-window resize probe is functionally validated.

## Validation Log

Environment:

- GNOME Shell 50
- Wayland session
- User-local extension install path

Confirmed behavior:

- Extension can be disabled and enabled cleanly.
- Extension-local GSettings schema is found after logout/login and reinstall.
- Keybinding `resize-left` is registered successfully.
- `Super + Alt + Left` triggers the resize action.
- The currently focused normal window moves/resizes to the left half of the current workarea.

Observed expected logs:

```text
[ubuntu-wayland-sizer] disable: start
[ubuntu-wayland-sizer] cleanup: keybinding removed: resize-left
[ubuntu-wayland-sizer] disabled
[ubuntu-wayland-sizer] enable: start
[ubuntu-wayland-sizer] enable: settings loaded from metadata settings-schema
[ubuntu-wayland-sizer] enable: keybinding registered: resize-left
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

Proceed to Phase 3 with a very small built-in preset set:

- Left half
- Right half
- Full workarea
- Center 1280x720

Do not add D-Bus or GTK4 UI yet.

The next implementation should refactor the current one-off resize function into a small preset dispatcher while keeping the extension-only architecture.
