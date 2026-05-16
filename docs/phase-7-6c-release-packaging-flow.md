# Phase 7.6c — Release Packaging Flow

## Purpose

Phase 7.6c defines the release packaging flow for Ubuntu Wayland Sizer.

The goal is to make the extension packageable for future GitHub Releases and extensions.gnome.org preparation.

This phase is documentation-first and does not require runtime changes.

## Scope

Included:

- define release artifact structure
- define release ZIP naming
- define package contents
- define package validation checklist
- define manual packaging flow
- define future release-script direction

Excluded:

- publishing to extensions.gnome.org
- uploading GitHub Releases
- automatic CI release workflow
- runtime behavior changes
- metadata version bump policy implementation
- gettext/i18n packaging

## Release Artifact Goal

A future release artifact should package only the GNOME Shell extension runtime files.

The ZIP should contain:

```text
extension.js
metadata.json
schemas/
schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
schemas/gschemas.compiled
```

The ZIP should not contain:

```text
.git/
docs/
assets/
scripts/
README.md
CHANGELOG.md
development-only files
```

## Extension UUID

Current extension UUID:

```text
ubuntu-wayland-sizer@sawaichi9527
```

Installed user-local path:

```text
~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527
```

## Release ZIP Naming

Suggested release artifact naming:

```text
ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Naming pattern:

```text
ubuntu-wayland-sizer-v<display-version>-gnome<shell-version>.zip
```

Current baseline:

```text
metadata version: 1
popup display version: v1.0
GNOME Shell target: 50
```

Therefore current package name should be:

```text
ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

## Manual Packaging Flow

From repository root:

```bash
rm -rf build/release
mkdir -p build/release/ubuntu-wayland-sizer@sawaichi9527

cp extension/extension.js build/release/ubuntu-wayland-sizer@sawaichi9527/
cp extension/metadata.json build/release/ubuntu-wayland-sizer@sawaichi9527/
cp -r extension/schemas build/release/ubuntu-wayland-sizer@sawaichi9527/
```

Compile schemas inside the release package:

```bash
glib-compile-schemas build/release/ubuntu-wayland-sizer@sawaichi9527/schemas
```

Create ZIP:

```bash
cd build/release
zip -r ../ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip ubuntu-wayland-sizer@sawaichi9527
cd ../..
```

Expected output:

```text
build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

## Package Inspection

Inspect ZIP contents:

```bash
unzip -l build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Expected top-level contents:

```text
ubuntu-wayland-sizer@sawaichi9527/extension.js
ubuntu-wayland-sizer@sawaichi9527/metadata.json
ubuntu-wayland-sizer@sawaichi9527/schemas/
ubuntu-wayland-sizer@sawaichi9527/schemas/org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
ubuntu-wayland-sizer@sawaichi9527/schemas/gschemas.compiled
```

## Local Package Install Test

To test the generated ZIP manually:

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527 || true
rm -rf ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527

mkdir -p ~/.local/share/gnome-shell/extensions
unzip build/ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip -d ~/.local/share/gnome-shell/extensions
```

Then log out and log back in.

Enable extension:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Check state:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected:

```text
狀態: ACTIVE
```

## Validation Checklist

After installing from ZIP, validate:

```text
- extension enables successfully
- popup opens with Super + Alt + Space
- popup title shows Ubuntu Wayland Sizer · v1.0
- metadata description appears correctly in Extension Manager
- Center Presets section appears
- Position Presets section appears
- Saved Presets section appears
- Left half works
- Right half works
- Full workarea works
- center cycling works
- no TypeError / ReferenceError / CRITICAL logs appear
```

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

## Future Release Script Direction

A future helper script may be added:

```text
scripts/build-release-zip.sh
```

Potential behavior:

```text
- clean build/release
- copy extension runtime files
- compile schemas
- read metadata version
- derive display version vN.0
- derive GNOME Shell version from metadata.json
- create release ZIP
- print package path
- optionally inspect ZIP contents
```

This script is deferred until the manual flow is reviewed and validated.

## extensions.gnome.org Note

extensions.gnome.org may have its own packaging and review expectations.

Before publishing, confirm:

```text
- ZIP structure matches GNOME extension expectations
- metadata.json fields are acceptable
- shell-version is correct
- schema is included and compiled if needed
- no development-only files are included
- screenshots are prepared
- README and release notes are aligned
```

## Pass Criteria

Phase 7.6c passes when:

```text
- release ZIP structure is documented
- manual packaging flow is documented
- package validation flow is documented
- release artifact naming is documented
- future release script direction is documented
- no runtime behavior changes are introduced
```
