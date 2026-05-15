# Phase 3 — Built-in Presets

Phase 3 expands the Phase 2 focused-window resize probe into a small built-in preset dispatcher.

The project still remains extension-only. D-Bus, GTK4 UI, floating menus, and border triggers remain deferred.

## Default Hotkeys

```text
Super + Alt + Left   -> Left half
Super + Alt + Right  -> Right half
Super + Alt + Up     -> Full workarea
Super + Alt + Down   -> Center 1280x720
```

## GSettings Keys

```text
resize-left
resize-right
resize-full
resize-center
```

Each key is type `as`, matching GNOME Shell keybinding expectations.

## Behavior

For each preset:

1. Get the currently focused window.
2. Ignore non-normal windows.
3. Get the focused window's monitor.
4. Read the active workspace workarea for that monitor.
5. Unmaximize the target window.
6. Apply preset geometry with `move_resize_frame()`.

## Built-in Presets

### Left Half

Uses the left half of the current workarea.

### Right Half

Uses the right half of the current workarea.

### Full Workarea

Fills the current workarea, not the raw monitor geometry.

### Center 1280x720

Centers a 1280x720 rectangle within the current workarea.

If the workarea is smaller than 1280x720, the target size is clamped to fit inside the workarea.

## Testing

Install the development extension:

```bash
git pull
./scripts/install-extension-dev.sh
```

Because schema keys changed, log out and back in before testing.

Then enable:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell
```

Expected enable logs:

```text
[ubuntu-wayland-sizer] enable: keybinding registered: resize-left -> left
[ubuntu-wayland-sizer] enable: keybinding registered: resize-right -> right
[ubuntu-wayland-sizer] enable: keybinding registered: resize-full -> full
[ubuntu-wayland-sizer] enable: keybinding registered: resize-center -> center
```

Expected action logs:

```text
[ubuntu-wayland-sizer] action: preset triggered: left
[ubuntu-wayland-sizer] action: applied preset left: ...
```

## Notes

If GNOME Shell still reports a missing schema after the schema file changed, log out and back in. Disable/enable alone may not refresh extension-local schema state.
