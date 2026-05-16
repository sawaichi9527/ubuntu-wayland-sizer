# Deployment Quick Reference

## Purpose

This document is a short copy-paste-oriented deployment cheat sheet for Ubuntu Wayland Sizer development and validation.

For full explanations and troubleshooting details, see:

```text
docs/phase-7-5c-deployment-and-troubleshooting.md
```

## Assumed Environment

```text
Ubuntu 26.04
GNOME Shell 50
Wayland session
```

Check session type:

```bash
echo $XDG_SESSION_TYPE
```

Expected:

```text
wayland
```

## Clone Repository

```bash
git clone git@github.com:sawaichi9527/ubuntu-wayland-sizer.git
cd ubuntu-wayland-sizer
```

## Development Update Flow

```bash
git checkout phase-7-5-release-readiness
git pull
./scripts/install-extension-dev.sh
```

## Compile Schemas

```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

## Reload Extension

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

## Verify Extension State

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected:

```text
狀態: ACTIVE
```

## Open Popup

```text
Super + Alt + Space
```

Expected popup title:

```text
Ubuntu Wayland Sizer · v1.0
```

## Watch Logs

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

## Full Logout/Login Recommended When

```text
- helper methods appear stale
- popup strings do not update
- GJS module state appears cached
- schemas changed
- class structure changed
```

## Full Reset of Installed Extension

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true
rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
./scripts/install-extension-dev.sh
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

Then:

```text
logout/login
```

Then:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

## Rollback to Previous Commit

Inspect history:

```bash
git log --oneline --decorate -10
```

Checkout known-good commit:

```bash
git checkout <commit>
```

Reinstall:

```bash
./scripts/install-extension-dev.sh
```

Reload extension:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

## Common Quick Checks

### Extension active?

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

### Popup opens?

```text
Super + Alt + Space
```

### Logs clean?

Look for:

```text
TypeError
ReferenceError
CRITICAL
```

### Version visible?

Expected:

```text
Ubuntu Wayland Sizer · v1.0
```

### Center cycling works?

```text
Super + Alt + .
Super + Alt + ,
```

### Left/right presets still work?

```text
Super + Alt + H
Super + Alt + L
```

## Protected Core Reminder

Do not remove or simplify:

```text
- workarea-based geometry
- full-workarea breakout
- safe restore before resize
- delayed resize ordering
- post-resize correction
- Electron/minimum-width correction
- mixed-scaling handling
```

These behaviors are compatibility-critical on:

```text
GNOME Shell 50 + Wayland + Mutter
```
