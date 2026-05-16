# Phase 7.7e — Final RC Smoke Checklist

## Purpose

Phase 7.7e defines the final release-candidate gate for Ubuntu Wayland Sizer v1.0-rc1.

This checklist answers:

```text
Is this branch ready to produce and publish a GitHub Release Candidate?
```

## Scope

Included:

- repository cleanliness check
- release ZIP build check
- RC artifact naming check
- ZIP content inspection
- ZIP install validation
- GNOME Shell runtime smoke test
- documentation sync check
- known limitation review

Excluded:

- new runtime features
- extensions.gnome.org publishing
- CI/CD automation
- stable v1.0.0 release tagging

## RC Target

```text
Git tag: v1.0-rc1
GitHub Release title: Ubuntu Wayland Sizer v1.0-rc1
ZIP artifact: ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
Target: Ubuntu 26.04 / GNOME Shell 50 / Wayland
```

## Repository Gate

Run:

```bash
git status
git log --oneline --decorate --graph -8
```

Required:

```text
- working tree clean
- branch synced with origin
- branch based on latest main
```

## Build Gate

Run:

```bash
./scripts/build-release-zip.sh rc1
```

Required output:

```text
build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

## Package Inspection Gate

Run:

```bash
unzip -l build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Required contents:

```text
ubuntu-wayland-sizer@sawaichi9527/extension.js
ubuntu-wayland-sizer@sawaichi9527/metadata.json
ubuntu-wayland-sizer@sawaichi9527/schemas/
ubuntu-wayland-sizer@sawaichi9527/schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
ubuntu-wayland-sizer@sawaichi9527/schemas/gschemas.compiled
```

Must not contain:

```text
.git/
docs/
assets/
scripts/
README.md
CHANGELOG.md
```

## ZIP Install Gate

Install from generated ZIP:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true

rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
mkdir -p ~/.local/share/gnome-shell/extensions

unzip build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip -d ~/.local/share/gnome-shell/extensions
```

Then:

```text
logout/login
```

Enable:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Required:

```text
Status: ACTIVE
```

or equivalent localized ACTIVE status.

## Runtime Smoke Gate

Validate:

```text
- popup opens with Super + Alt + Space
- popup title shows Ubuntu Wayland Sizer · v1.0
- Center Presets appears
- Position Presets appears
- Saved Presets appears
- Actions appears
- Left half works
- Right half works
- Full workarea works
- Center preset cycling works
- saved preset apply works if existing user presets are present
```

## Log Gate

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

Must not show:

```text
TypeError
ReferenceError
[CRITICAL]
```

Non-blocking for local/dev RC validation:

```text
Error while downloading update for extension ubuntu-wayland-sizer@sawaichi9527: (Unexpected response: Not Found)
```

Reason:

```text
The extension is not yet published on extensions.gnome.org.
```

## Documentation Sync Gate

Confirm the following files agree on v1.0-rc1:

```text
CHANGELOG.md
docs/release-notes-v1.0-rc1.md
docs/phase-7-7c-version-and-tag-policy.md
docs/phase-7-6c-release-packaging-flow.md
docs/phase-7-6f-release-validation.md
```

Check:

```bash
grep -R "v1.0-rc1" -n CHANGELOG.md docs/release-notes-v1.0-rc1.md docs/phase-7-7c-version-and-tag-policy.md docs/phase-7-6c-release-packaging-flow.md docs/phase-7-6f-release-validation.md
```

## Known Limitations Review

Expected known limitations for v1.0-rc1:

```text
- local/dev ZIP installs are not published on extensions.gnome.org
- Extension Manager View Details may show an error until published
- update check may show Not Found until published
- no GTK settings UI
- no panel indicator
- no D-Bus service
- no gettext/i18n runtime integration
```

These are acceptable for v1.0-rc1.

## Release Candidate Decision

v1.0-rc1 can be considered ready when:

```text
- repository gate passes
- build gate passes
- package inspection gate passes
- ZIP install gate passes
- runtime smoke gate passes
- log gate passes
- documentation sync gate passes
- known limitations are accepted
```

## Pass Criteria

Phase 7.7e passes when:

```text
- final RC smoke checklist is documented
- RC artifact gate is documented
- ZIP install gate is documented
- runtime smoke gate is documented
- log gate is documented
- documentation sync gate is documented
```
