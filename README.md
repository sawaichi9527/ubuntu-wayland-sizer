# Ubuntu Wayland Sizer

Ubuntu Wayland Sizer is an experimental GNOME Shell Extension project for Ubuntu GNOME on Wayland.

The long-term goal is to provide Sizer-like window resize and positioning presets on GNOME Wayland, while respecting the Wayland security model.

## Current Strategy

This repository intentionally starts from a minimal baseline.

Earlier prototype ideas are treated as design inspiration only. The first implementation phase focuses on a stable GNOME Shell Extension lifecycle before adding D-Bus, GTK4 UI, tray integration, floating menus, or border-trigger UX.

## MVP Scope

Phase 1 focuses on:

- A clean GNOME Shell Extension entry point
- Stable enable / disable lifecycle
- Minimal logging for startup verification
- A documented debugging workflow

Phase 2 will add:

- A global hotkey
- Focused-window resize testing
- A few hardcoded resize presets

Later phases may add:

- Preset JSON support
- D-Bus control API
- GTK4/libadwaita companion settings app
- Macro-based expressions
- Floating sizer menu
- Border trigger UX

## Target Platform

Initial target:

- Ubuntu 26.04 LTS
- GNOME Shell 50
- Wayland session

The extension is expected to evolve with GNOME Shell API changes.

## Repository Layout

```text
ubuntu-wayland-sizer/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── mvp-plan.md
│   └── debug-extension-startup.md
└── extension/
    ├── metadata.json
    └── extension.js
```

## Development Notes

Do not add multiple managers at once during early development.

The preferred workflow is:

1. Keep `extension.js` minimal.
2. Verify enable / disable lifecycle.
3. Add one module at a time.
4. Check GNOME Shell logs after every change.
5. Only add D-Bus and GTK UI after hotkey-based window resize is stable.
