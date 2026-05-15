# Known Issues

## 1. Electron minimum-width constraints on narrow portrait monitors

Affected examples:

- UpNote
- Some Chromium/Electron applications

Observed behavior:

```text
Requested left/right half-width may be smaller than the application's minimum width.
```

Example:

```text
portrait-right workarea width = 720
requested half-width = 360
actual app minimum width = 400~600
```

Current handling:

```text
The extension preserves the application's actual width and corrects edge alignment.
```

Status:

```text
Expected behavior / non-blocking
```

---

## 2. GNOME Shell / Clutter warnings after monitor scale changes

Observed warnings:

```text
Can't update stage views actor unnamed [...] is on because it needs an allocation.
cogl_framebuffer_set_viewport: assertion 'width > 0 && height > 0' failed
```

Typical trigger:

```text
Changing monitor scaling
Changing monitor orientation
Changing monitor layout
```

Observed impact:

```text
Resize presets still function normally afterward.
```

Current classification:

```text
GNOME Shell / Clutter environmental warning
non-blocking
```

---

## 3. Ubuntu Dock / app-grid visual issues

Observed behavior:

```text
Application grid partially blank after monitor/layout/scaling changes.
```

Isolation result:

```text
Disabling/re-enabling GNOME extensions such as Ubuntu Dock restores behavior.
```

Related logs:

```text
resource:///org/gnome/shell/ui/iconGrid.js
resource:///org/gnome/shell/ui/appDisplay.js
file:///usr/share/gnome-shell/extensions/ubuntu-dock@ubuntu.com/docking.js
```

Current classification:

```text
External GNOME Shell / Ubuntu Dock issue
not currently attributed to Ubuntu Wayland Sizer
```

---

## 4. Mutter resize rejection timing

Observed behavior:

```text
Occasionally Mutter may ignore an immediate resize request.
```

Typical symptoms:

```text
Window moves to the correct edge
but does not resize on the first attempt
```

Current mitigation:

```text
full-workarea breakout
safe restore geometry
post-resize correction
retry flow
```

Status:

```text
Partially mitigated
Continue long-duration stress testing
```
