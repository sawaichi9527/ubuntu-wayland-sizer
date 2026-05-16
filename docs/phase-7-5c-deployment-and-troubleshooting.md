# Phase 7.5c — Deployment and Troubleshooting

## Purpose

Phase 7.5c documents how to deploy, update, validate, roll back, and troubleshoot Ubuntu Wayland Sizer during the release-readiness track.

This phase is documentation-only.

It does not modify runtime behavior, schemas, keybindings, popup behavior, preset geometry, or protected-core Mutter / Wayland workarounds.

## Scope

Included:

```text
- development install flow
- update flow
- fresh machine install flow
- rollback flow
- GNOME Shell restart / logout-login notes
- schema compile notes
- GJS module-cache notes
- troubleshooting matrix
- validation checklist
```

Excluded:

```text
- installer package
- GNOME Extensions website publishing
- automatic updater
- panel indicator
- D-Bus service
- GTK settings application
- runtime behavior changes
```

## Target Environment

Primary target:

```text
Ubuntu 26.04
GNOME Shell 50
Wayland session
User-local GNOME Shell extension install
```

The extension may work on nearby GNOME Shell versions, but the validated baseline is GNOME Shell 50 on Wayland.

Check GNOME Shell version:

```bash
gnome-shell --version
```

Check session type:

```bash
echo $XDG_SESSION_TYPE
```

Expected session type:

```text
wayland
```

## Repository Layout Reference

Important paths:

```text
extension/                         GNOME Shell extension source
extension/metadata.json            extension metadata and version
extension/schemas/                 GSettings schema source
scripts/install-extension-dev.sh   development install helper
docs/status.md                     current project status
```

Installed user-local extension path:

```text
~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
```

## Fresh Machine Install

Clone the repository:

```bash
git clone git@github.com:sawaichi9527/ubuntu-wayland-sizer.git
cd ubuntu-wayland-sizer
```

Install the extension into the user-local GNOME Shell extensions directory:

```bash
./scripts/install-extension-dev.sh
```

Compile schemas if needed:

```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

Log out and log back in.

Enable the extension:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Check extension state:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected state:

```text
狀態: ACTIVE
```

or equivalent localized output showing that the extension is enabled and active.

## Development Update Flow

From the repository root:

```bash
git checkout phase-7-5-release-readiness
git pull
./scripts/install-extension-dev.sh
```

If schemas changed, compile schemas and log out/in:

```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

For JavaScript changes, disable and enable the extension:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

If behavior still looks stale after JavaScript changes, perform a full logout/login.

Reason:

```text
GNOME Shell / GJS can keep module state alive during extension development. A full logout/login is the safest way to clear stale module state.
```

## Validation Checklist

After deployment, validate the following:

```text
- extension is ACTIVE
- popup opens with Super + Alt + Space
- popup title shows Ubuntu Wayland Sizer · v1.0
- Log control still switches between Debug and Normal
- Left half still works
- Right half still works
- Full workarea still works
- Center Presets still work
- center cycling still wraps
- saved presets still appear and apply
- no TypeError / ReferenceError appears in GNOME Shell logs
```

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

Critical errors to watch for:

```text
TypeError
ReferenceError
CRITICAL
```

Normal debug logs look like:

```text
[ubuntu-wayland-sizer][DEBUG] popup: open requested
[ubuntu-wayland-sizer][DEBUG] action: preset triggered: center
```

## Rollback Flow

If a development update causes regression, roll back the working tree to the previous known-good commit.

Inspect recent commits:

```bash
git log --oneline --decorate -10
```

Check out a known-good commit or branch:

```bash
git checkout <known-good-commit-or-branch>
```

Reinstall:

```bash
./scripts/install-extension-dev.sh
```

Disable and enable the extension:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

If the issue persists, log out and log back in.

## Full Reset of Local Extension Install

If the installed extension appears stale or corrupted, remove the user-local extension directory and reinstall:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true
rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
./scripts/install-extension-dev.sh
glib-compile-schemas ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

Then log out and log back in before enabling:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

## GSettings and Schema Notes

Schema source path:

```text
extension/schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
```

Installed schema path:

```text
~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/schemas
```

If a GSettings key is added, removed, or renamed:

```text
- reinstall the extension
- compile schemas
- log out and log back in
```

If schemas are not available, symptoms may include:

```text
- extension fails to enable
- getSettings() failure
- keybinding registration failure
```

## GJS Module Cache Notes

During development, GNOME Shell / GJS may retain loaded module state.

Symptoms:

```text
- source code changed but popup still shows old strings
- helper methods appear unchanged after reinstall
- behavior differs from repository source
```

Recommended escalation order:

```text
1. Run ./scripts/install-extension-dev.sh
2. Disable and enable the extension
3. Log out and log back in
4. Remove installed extension directory and reinstall
```

## Troubleshooting Matrix

| Symptom | Likely Cause | Action |
| --- | --- | --- |
| Extension does not enable | Schema missing or GNOME Shell version mismatch | Compile schemas, check `gnome-extensions info`, check logs |
| Popup does not open | Keybinding not registered or focused window is not normal | Check logs for keybinding registration and popup messages |
| Popup title shows stale version | Installed extension is stale or GJS module cache is stale | Reinstall, disable/enable, then logout/login |
| Preset does nothing | Focused window is not a normal window or Mutter rejected resize | Check logs for ignored window or post-correction messages |
| Right/left edge is visually off for Electron app | App minimum width constraint | Confirm post-resize correction logs; this may be expected |
| Full-workarea window refuses to resize | Breakout flow did not complete | Check full-workarea breakout logs; retry after logout/login if stale |
| GNOME app grid appears partially blank | External Shell / Ubuntu Dock issue | Disable/re-enable related Shell extensions; not currently treated as Ubuntu Wayland Sizer blocker |
| `Not Found` update warning appears | Extension is not published on extensions.gnome.org | Non-blocking during local development |

## Non-blocking Warnings

The following warnings have been observed during development and are not automatically treated as Ubuntu Wayland Sizer blockers:

```text
DING: ...
Gio.DBusError: Unknown interface org.freedesktop.IBus or property Engines
Error while downloading update for extension ubuntu-wayland-sizer@sawaichi9527: (Unexpected response: Not Found)
Invalid sequence for VSYNC frame info
Error in size change accounting.
libinput error: client bug: timer button-debounce-debounce-event4: scheduled expiry is in the past
Can't update stage views actor unnamed [...] is on because it needs an allocation.
cogl_framebuffer_set_viewport: assertion 'width > 0 && height > 0' failed
```

Treat these as context, not automatic release blockers, unless they correlate with a visible regression in Ubuntu Wayland Sizer behavior.

## Protected Core Reminder

Deployment troubleshooting must not remove or simplify protected-core behavior just to silence logs.

Protected areas include:

```text
- workarea-based geometry
- full-workarea / maximized-like breakout
- safe restore before resizing
- delayed resize after Mutter state transition
- post-resize readback and correction
- Electron / minimum-width constrained app correction
- mixed-scaling and multi-monitor handling
```

See:

```text
docs/phase-7-5a-roadmap-and-guardrails.md
```

## Pass Criteria

Phase 7.5c passes when:

```text
- deployment flow is documented
- update flow is documented
- rollback flow is documented
- full reset flow is documented
- schema and GJS cache caveats are documented
- troubleshooting matrix is documented
- no runtime behavior changes are introduced
```
