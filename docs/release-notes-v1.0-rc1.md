# Ubuntu Wayland Sizer v1.0-rc1 Release Notes

Ubuntu Wayland Sizer is a lightweight GNOME Shell extension for resizing and positioning the focused window on Ubuntu GNOME Wayland.

This release candidate establishes the first public-facing baseline for Sizer-style window presets on GNOME Shell 50 + Wayland + Mutter.

## Highlights

```text
- focused-window resize and positioning presets
- left half / right half / full workarea
- expanded Center Presets
- center preset cycling
- popup preset selector
- saved custom presets
- debug logging toggle
- Wayland/Mutter compatibility guardrails
- release ZIP packaging flow
```

## Validated Environment

```text
Ubuntu 26.04
GNOME Shell 50
Wayland session
```

Validated display scenarios:

```text
- primary landscape monitor
- secondary portrait-right monitor
- 100%, 125%, 150% scaling
- mixed scaling: 100% + 125%, 100% + 150%
```

## Default Shortcuts

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

## Package

Expected release artifact:

```text
ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

The release ZIP contains only GNOME Shell extension runtime files:

```text
extension.js
metadata.json
schemas/
```

## Install from ZIP

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true

rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
mkdir -p ~/.local/share/gnome-shell/extensions

unzip ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip -d ~/.local/share/gnome-shell/extensions
```

Then log out and log back in.

Enable:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Check status:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected:

```text
ACTIVE
```

## Known Limitations

```text
- local/dev ZIP installs are not published on extensions.gnome.org
- Extension Manager View Details may show an error for unpublished installs
- update check may show Not Found until published
- no GTK settings UI
- no panel indicator
- no D-Bus service
- no gettext/i18n runtime integration
```

Saved presets are stored in user GSettings/dconf state, not inside the extension package. Reinstalling the extension may preserve existing saved presets for the same user profile.

## Notes

This release candidate focuses on reliability and release packaging, not feature expansion.

Ubuntu Wayland Sizer is not a tiling window manager. It is focused on simple, reliable, preset-based window sizing for Ubuntu GNOME Wayland.

## Future Work

```text
- extensions.gnome.org preparation
- expanded screenshots / GIF assets
- optional reset saved presets action
- version bump policy
- possible localization track
```
