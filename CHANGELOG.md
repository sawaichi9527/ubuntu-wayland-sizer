# Changelog

All notable changes to Ubuntu Wayland Sizer will be documented in this file.

The project is currently preparing its first public release-candidate baseline for Ubuntu GNOME Wayland environments.

---

# Unreleased

## Planned for release-candidate preparation

- GitHub release candidate workflow
- release notes cleanup
- versioning policy refinement
- final smoke validation checklist
- extensions.gnome.org preparation notes

---

# v1.0-rc1 baseline

Release-readiness and public-release preparation baseline for v1.0-rc1.

Validated target:

```text
Ubuntu 26.04
GNOME Shell 50
Wayland
```

## Core window sizing

- focused-window resize and reposition presets
- left / right / full workarea presets
- expanded center preset library
- center preset cycling
- popup preset selector
- saved custom presets
- popup save/delete flows

## Wayland / Mutter compatibility

- workarea-based geometry
- full-workarea/maximized-like breakout handling
- safe restore before resize
- delayed resize sequencing for Mutter state transitions
- post-resize readback and correction
- Electron minimum-width correction handling

## Display handling

Validated:

- multi-monitor support
- portrait-right monitor support
- mixed-scaling handling
- fractional scaling smoke validation
- 100%, 125%, and 150% scaling scenarios

## Runtime and UX

- popup runtime actions
- debug log toggle
- popup version visibility
- wording polish for popup sections
- improved extension metadata description

## Packaging and release preparation

- release-oriented README rewrite
- screenshot asset structure
- popup overview screenshot
- release ZIP packaging documentation
- release ZIP build script
- release ZIP install validation
- clean release artifact policy
- .gitignore release cleanup

## Documentation

Added or expanded:

- deployment and troubleshooting docs
- release packaging flow
- screenshot asset planning
- release validation baseline
- i18n-ready notes
- guardrail and protected-core notes
- UX wording polish notes

## Validation

Validated:

- ZIP install workflow
- popup runtime stability
- preset persistence behavior
- Extension Manager integration behavior
- local/dev install behavior
- GNOME Shell 50 baseline operation

## Known limitations

Still intentionally deferred:

- extensions.gnome.org publication
- GTK settings UI
- panel indicator
- D-Bus service
- gettext runtime integration
- CI/CD automation

---

# v0.1-baseline

Initial validated Wayland geometry baseline.

## Initial capabilities

- GNOME Shell extension lifecycle
- focused-window resize presets
- workarea-based geometry
- keybinding registration
- GSettings schema integration
- user-local install workflow

## Initial compatibility validation

Validated applications:

- Firefox
- GNOME Terminal
- Ubuntu Text Editor
- LibreOffice
- VSCode (.deb)
- UpNote (.deb)

## Historical note

This baseline established the original GNOME Shell + Wayland + Mutter resize compatibility foundation that later release-readiness phases were built upon.
