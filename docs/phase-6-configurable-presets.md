# Phase 6 — Configurable Presets

## Phase 6.1: Configurable Center Preset

The center preset is no longer hardcoded to `1280x720`.

It is controlled by two extension-local GSettings keys:

```text
center-width
center-height
```

Default values:

```text
center-width  = 1280
center-height = 720
```

## Why plain gsettings may not find the schema

This project is installed as a user-local GNOME Shell extension under:

```text
~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
```

The schema is bundled in the extension directory:

```text
~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

Because of that, a plain command such as:

```bash
gsettings list-schemas | grep ubuntu-wayland-sizer
```

may show nothing.

Use the project helper instead.

## Helper usage

List keys:

```bash
./scripts/gsettings-local.sh list-keys
```

Set center size to `1440x768`:

```bash
./scripts/gsettings-local.sh set center-width 1440
./scripts/gsettings-local.sh set center-height 768
```

Set center size to `800x600`:

```bash
./scripts/gsettings-local.sh set center-width 800
./scripts/gsettings-local.sh set center-height 600
```

Read current values:

```bash
./scripts/gsettings-local.sh get center-width
./scripts/gsettings-local.sh get center-height
```

Reset to defaults:

```bash
./scripts/gsettings-local.sh reset center-width
./scripts/gsettings-local.sh reset center-height
```

## Workarea clamping behavior

The configured center size is treated as a preferred size.

The extension always clamps it to the current monitor workarea.

Example:

```text
configured center size = 1440x768
portrait monitor workarea = 1080x1920
actual center target = 1080x768
```

This allows the same setting to work safely on both landscape and portrait monitors.

## Validated behavior

Validated with:

```text
center preset = 1440x768
primary monitor = landscape 1080p
secondary monitor = portrait-right 1080p
applications = Firefox, UpNote
```

Observed behavior:

```text
primary monitor: configured=1440x768, target=1440x768
secondary portrait monitor: configured=1440x768, target=1080x768
```

Status:

```text
PASS
```
