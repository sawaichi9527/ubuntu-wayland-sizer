# Reference Implementations

This document records external GNOME Shell / Mutter implementation references that informed Ubuntu Wayland Sizer.

## Ubuntu / Tiling Assistant

Repository:

```text
ubuntu/Tiling-Assistant
```

Relevant file:

```text
tiling-assistant@leleat-on-github/src/extension/tilingWindowManager.js
```

Why it matters:

- It is a mature GNOME Shell tiling extension.
- It is maintained under the Ubuntu GitHub organization.
- It handles many Mutter / GNOME Shell window-management edge cases that are directly relevant to Ubuntu Wayland Sizer.

## Useful Patterns Observed

### 1. Do not rely only on `get_maximized()`

Tiling Assistant checks maximized-like behavior using more than one signal, including properties such as:

```text
window.maximizedHorizontally
window.maximizedVertically
```

It also tracks its own tiled state and tiled rectangle.

Ubuntu Wayland Sizer adopted a related idea:

```text
A window can be treated as full-workarea / maximized-like when its frame is nearly equal to the monitor workarea, even if `get_maximized()` alone is not sufficient.
```

This is important because testing on GNOME Shell 50 / Ubuntu 26.04 showed cases where:

```text
frame == workarea
but preset resize did not take effect until the window was first broken out of that state
```

### 2. Break out before tiling/resizing

Tiling Assistant performs best-effort state cleanup before tiling, including operations such as:

```text
unmaximize
unmake_fullscreen
```

Ubuntu Wayland Sizer adopted the same concept for left/right/center presets:

```text
if window is full-workarea / maximized-like:
    unmake_fullscreen best-effort
    unmaximize best-effort
    move_to_monitor best-effort
    apply a safe restore geometry
    delay briefly
    apply the actual preset
```

### 3. Move and resize as separate operations

Tiling Assistant uses a sequence similar to:

```text
move_to_monitor(monitor)
move_frame(true, x, y)
move_resize_frame(true, x, y, width, height)
```

The source comments explain that multi-monitor and Wayland behavior can be sensitive to how `user_op` and move/resize are applied.

Ubuntu Wayland Sizer adopted this pattern instead of relying only on:

```text
move_resize_frame(...)
```

### 4. Account for application constraints

Some applications cannot be resized to arbitrary dimensions. Tiling Assistant notes this type of issue for applications such as terminals.

Ubuntu Wayland Sizer observed similar behavior with Electron applications, especially UpNote, where the requested half-width on a narrow portrait monitor was smaller than the application's minimum width.

Ubuntu Wayland Sizer handles this by:

```text
1. Apply requested preset geometry.
2. Read back the actual frame after Mutter/application constraints are applied.
3. If the app changed the size, preserve the actual size and correct the edge alignment.
```

Example:

```text
requested right half: 360x1280
actual app-constrained width: 600x1280
corrected x: workarea.right - 600
```

## Current Project-specific Adaptation

Ubuntu Wayland Sizer intentionally remains much smaller than Tiling Assistant.

Current scope:

```text
focused window
four built-in presets
extension-only
no D-Bus
no GTK UI
no tile groups
no layout editor
```

Adopted from reference implementation:

```text
full-workarea detection
breakout before preset
move_to_monitor + move_frame + move_resize_frame sequence
application constraint correction
GNOME version-aware maximize/unmaximize style
```

Not adopted yet:

```text
tile groups
custom tiling state persistence
tiling popup
animation integration
complex free-space calculation
layout editing
```

## Notes for Future Porting

When porting Ubuntu Wayland Sizer to another GNOME Shell version, validate the following first:

```text
1. Whether `Meta.Window.unmaximize()` expects zero parameters.
2. Whether `Meta.Window.maximize()` expects zero parameters.
3. Whether `get_maximized()` exists and is reliable.
4. Whether `maximizedHorizontally` / `maximizedVertically` still exist.
5. Whether `move_to_monitor()` is available.
6. Whether `move_frame(true, x, y)` + `move_resize_frame(true, x, y, w, h)` still behaves correctly under Wayland.
7. Whether full-workarea frames need a safe-restore breakout before resizing.
```

## Why this reference was added

GNOME Shell extension APIs around Mutter window management are not always documented with enough detail for every edge case. Mature extensions are therefore valuable references for practical behavior under real GNOME Shell / Mutter versions.

This reference should help future contributors understand why Ubuntu Wayland Sizer uses a multi-step resize flow instead of a single direct `move_resize_frame()` call.
