# Phase 7.7c — Version and Tag Policy

## Purpose

Phase 7.7c defines the version, tag, and release artifact naming policy for Ubuntu Wayland Sizer.

The goal is to avoid confusion between:

```text
- GNOME Shell extension metadata version
- popup display version
- Git tag / GitHub Release version
- release ZIP artifact name
```

## Recommended Policy

Use separate version roles:

```text
metadata.json version   -> GNOME Shell / Extension Manager integer version
popup display version   -> user-visible simplified version
Git tag                 -> release lifecycle version
ZIP artifact            -> release package identity + GNOME target
```

## metadata.json Version

Keep `metadata.json` version as an integer:

```json
"version": 1
```

Policy:

```text
- integer only
- increment when publishing a new extension version
- used by GNOME Shell / Extension Manager / extensions.gnome.org
- not used for full semantic versioning
```

Do not change it to:

```text
"1.0.0"
"v1.0"
"v1.0-rc1"
```

## Popup Display Version

Popup title formats the metadata integer as:

```text
vN.0
```

Current example:

```text
metadata version: 1
popup title: Ubuntu Wayland Sizer · v1.0
```

Purpose:

```text
- gives users a readable version in the popup
- avoids changing metadata.json away from integer versioning
- keeps UI simple
```

## Git Tags and GitHub Releases

Use Git tags for release lifecycle naming.

Release candidate tags:

```text
v1.0-rc1
v1.0-rc2
v1.0-rc3
```

Stable release tag:

```text
v1.0.0
```

Policy:

```text
- Git tags represent public release lifecycle
- GitHub Releases should use the same tag name
- RC suffix belongs in Git tag / release title, not metadata.json
```

## Release ZIP Naming

Use ZIP artifact names that include:

```text
project name
release version / RC version
GNOME Shell target
```

Release candidate package:

```text
ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

Stable package:

```text
ubuntu-wayland-sizer-v1.0.0-gnome50.zip
```

Pattern:

```text
ubuntu-wayland-sizer-<release-version>-gnome<shell-version>.zip
```

## Current v1.0-rc1 Mapping

Current baseline should use:

```text
metadata.json version: 1
popup display version: v1.0
Git tag: v1.0-rc1
GitHub Release title: Ubuntu Wayland Sizer v1.0-rc1
ZIP artifact: ubuntu-wayland-sizer-v1.0-rc1-gnome50.zip
```

## Why This Split Exists

`metadata.json` version is for GNOME Shell extension management.

Git tags and GitHub Releases are for public release lifecycle.

The ZIP filename is for humans and release artifact management.

Keeping these roles separate avoids forcing one versioning system to serve every purpose.

## Future Examples

For another release candidate:

```text
metadata.json version: 1
popup display version: v1.0
Git tag: v1.0-rc2
ZIP artifact: ubuntu-wayland-sizer-v1.0-rc2-gnome50.zip
```

For stable release:

```text
metadata.json version: 1
popup display version: v1.0
Git tag: v1.0.0
ZIP artifact: ubuntu-wayland-sizer-v1.0.0-gnome50.zip
```

For future GNOME 51-compatible release:

```text
metadata.json version: 2
popup display version: v2.0
Git tag: v2.0.0
ZIP artifact: ubuntu-wayland-sizer-v2.0.0-gnome51.zip
```

## Pass Criteria

Phase 7.7c passes when:

```text
- metadata version policy is documented
- popup display version policy is documented
- Git tag policy is documented
- ZIP artifact naming policy is documented
- v1.0-rc1 mapping is documented
```
