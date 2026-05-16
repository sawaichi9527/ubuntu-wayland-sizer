# Phase 7.7f — v1.0-rc1 Validation Result

## Purpose

Phase 7.7f records the actual release-candidate gate validation result for Ubuntu Wayland Sizer v1.0-rc1.

This document summarizes the final checks performed after generating and installing the v1.0-rc1 ZIP artifact.

## Validation Target

```text
Project: Ubuntu Wayland Sizer
Release candidate: v1.0-rc1
Git tag target: v1.0-rc1
GitHub Release title: Ubuntu Wayland Sizer v1.0-rc1
ZIP artifact: ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
Target environment: Ubuntu 26.04 / GNOME Shell 50 / Wayland
```

## Branch State

Validated branch:

```text
phase-7-7-release-candidate-prep
```

Validation commit range included:

```text
CHANGELOG cleanup
release notes draft
version/tag policy
RC-aware release ZIP tooling
final RC smoke checklist
CHANGELOG v1.0-rc1 sync
```

Repository gate result:

```text
PASS
```

Observed:

```text
- working tree clean
- branch synced with origin/phase-7-7-release-candidate-prep
- branch based on main after Phase 7.6 merge
```

## Build Gate

Command:

```bash
./scripts/build-release-zip.sh rc1
```

Observed output:

```text
Metadata version: 1
Display version: v1.0
Release suffix: rc1
Release version: v1.0-rc1
GNOME Shell version: 50
Output: build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Result:

```text
PASS
```

## Package Inspection Gate

Validated artifact:

```text
build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Observed size:

```text
16K
```

Observed ZIP contents:

```text
ubuntu-wayland-sizer@sawaichi9527/
ubuntu-wayland-sizer@sawaichi9527/schemas/
ubuntu-wayland-sizer@sawaichi9527/schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
ubuntu-wayland-sizer@sawaichi9527/schemas/gschemas.compiled
ubuntu-wayland-sizer@sawaichi9527/metadata.json
ubuntu-wayland-sizer@sawaichi9527/extension.js
```

Confirmed excluded from release ZIP:

```text
.git/
docs/
assets/
scripts/
README.md
CHANGELOG.md
build tooling
development-only files
```

Result:

```text
PASS
```

## Documentation Sync Gate

Confirmed v1.0-rc1 references in:

```text
CHANGELOG.md
docs/release-notes-v1.0-rc1.md
docs/phase-7-7c-version-and-tag-policy.md
docs/phase-7-6c-release-packaging-flow.md
docs/phase-7-6f-release-validation.md
docs/phase-7-7e-final-rc-smoke-checklist.md
```

Result:

```text
PASS
```

## ZIP Install Gate

Install flow:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true

rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
mkdir -p ~/.local/share/gnome-shell/extensions

unzip build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip -d ~/.local/share/gnome-shell/extensions
```

Then:

```text
logout/login
enable extension
confirm extension status
```

Result:

```text
PASS
```

## Runtime Smoke Gate

Validated runtime behavior:

```text
- extension enabled
- keybindings registered
- popup opens
- popup runtime sections available
- center presets work
- center cycle next works
- center cycle previous works
- left preset works
- right preset works
- full workarea preset works
- full-workarea breakout works
- safe restore before center preset works
- portrait monitor workarea clamp works
- saved preset save works
- saved preset apply works
- saved preset delete works
- debug logging toggle works
- popup reopen / refresh flow works
```

Result:

```text
PASS
```

## Display / Geometry Notes

Observed validation covered:

```text
- landscape monitor workarea
- portrait-right monitor workarea
- mixed monitor geometry
- center preset clamping on narrow portrait workarea
- full workarea state breakout
- post-resize correction path
```

Notable observed behavior:

```text
center presets larger than the portrait monitor workarea were clamped to the available workarea width.
```

This is expected and matches the protected workarea-based geometry behavior.

## Log Gate

Observed log status:

```text
No TypeError
No ReferenceError
No [CRITICAL]
```

Result:

```text
PASS
```

## Non-blocking Log Warnings

Observed GNOME/Clutter warnings:

```text
clutter_input_focus_set_cursor_location: assertion 'clutter_input_focus_is_focused (focus)' failed
clutter_input_focus_set_surrounding: assertion 'clutter_input_focus_is_focused (focus)' failed
```

Assessment:

```text
NON-BLOCKING
```

Reason:

```text
These warnings appeared during save-dialog/input-focus interaction, but did not prevent:
- save dialog opening
- empty-name rejection
- preset save
- popup refresh
- preset delete cancel
- preset delete confirm
```

No runtime failure was observed.

## Known Limitations Accepted for v1.0-rc1

Accepted limitations:

```text
- not yet published on extensions.gnome.org
- Extension Manager View Details may fail for local/dev installs
- update check may show Not Found until publication
- no GTK settings UI
- no panel indicator
- no D-Bus service
- no gettext/i18n runtime integration
```

These are acceptable for v1.0-rc1.

## Final RC Gate Summary

```text
Repository Gate: PASS
Build Gate: PASS
Package Inspection Gate: PASS
Documentation Sync Gate: PASS
ZIP Install Gate: PASS
Runtime Smoke Gate: PASS
Log Gate: PASS
```

## Decision

Ubuntu Wayland Sizer v1.0-rc1 is ready to be considered a valid release-candidate baseline.

Recommended next steps:

```text
1. Merge phase-7-7-release-candidate-prep into main.
2. Rebuild v1.0-rc1 ZIP from main.
3. Create Git tag v1.0-rc1.
4. Create GitHub Release using docs/release-notes-v1.0-rc1.md.
5. Attach build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip to the GitHub Release.
```

## Pass Criteria

Phase 7.7f passes when:

```text
- RC validation result is documented
- final gate summary is recorded
- non-blocking warnings are documented
- v1.0-rc1 release-candidate decision is recorded
```
