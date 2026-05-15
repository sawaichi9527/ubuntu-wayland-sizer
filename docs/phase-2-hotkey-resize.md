# Phase 2 — Focused Window Resize Probe

This phase validates that the GNOME Shell Extension can safely:

- Register a global keybinding
- Detect the currently focused `MetaWindow`
- Read the current monitor workarea
- Resize and reposition a normal window
- Clean up the keybinding during disable

## Current Probe Action

Default shortcut:

```text
Super + Alt + Left
```

Configured through GSettings:

```text
org.gnome.shell.extensions.ubuntu-wayland-sizer
```

Key:

```text
resize-left
```

## Current Behavior

When triggered:

1. Get the currently focused window
2. Ignore unsupported/special window types
3. Read the current monitor workarea
4. Unmaximize the window
5. Resize the window to the left half of the workarea

## Why This Exists

This is not intended to be the final UX.

The purpose is to validate the core Wayland/Mutter control path before introducing:

- D-Bus
- GTK4 UI
- Preset systems
- Floating menus
- Border triggers
- Multi-monitor policy logic

## Install Notes

During development, the schema must be compiled manually.

Example:

```bash
UUID="ubuntu-wayland-sizer@sawaichi9527"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

mkdir -p "$DEST/schemas"

cp extension/metadata.json "$DEST/"
cp extension/extension.js "$DEST/"
cp extension/schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml "$DEST/schemas/"

glib-compile-schemas "$DEST/schemas"
```

Then restart GNOME Shell or log out and back in.

## Debugging

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell
```

Expected logs:

```text
[ubuntu-wayland-sizer] enabled
[ubuntu-wayland-sizer] registered keybinding: resize-left
```

After pressing the shortcut:

```text
[ubuntu-wayland-sizer] resized focused window to left half
```

## Expected Failure Cases

The extension intentionally ignores:

- Desktop windows
- Popup menus
- Shell internal windows
- Unsupported special window types

This avoids destabilizing GNOME Shell during the probe phase.
