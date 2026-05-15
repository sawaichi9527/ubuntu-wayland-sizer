# Ubuntu Wayland Sizer

Ubuntu Wayland Sizer is a lightweight GNOME Shell Extension for Ubuntu GNOME on Wayland.

The project provides Sizer-like focused-window resize and positioning presets while staying inside the GNOME Shell / Mutter window-management model.

## Current Status

```text
Baseline: v0.1-baseline
Target: Ubuntu 26.04 / GNOME Shell 50 / Wayland
Architecture: GNOME Shell extension only
```

The current baseline has validated:

- Focused-window resize/move on Wayland
- Primary and secondary monitor handling
- Secondary monitor portrait-right layout
- 100%, 125%, 150%, and mixed-scaling smoke tests
- Full-workarea / maximized-like breakout before resizing
- Electron minimum-width constrained app correction
- Workarea-based geometry instead of raw monitor geometry

## Default Shortcuts

```text
Super + Alt + H      -> Left half
Super + Alt + L      -> Right half
Super + Alt + F      -> Full workarea
Super + Alt + C      -> Center 1280x720
```

Arrow-key defaults are intentionally avoided because Ubuntu/GNOME may intercept `Super + Alt + Arrow` combinations for built-in window-management behavior.

## Target Platform

Initial target:

- Ubuntu 26.04
- GNOME Shell 50
- Wayland session

Other GNOME Shell versions may require API adjustments.

## Install for Development

Clone the repository:

```bash
git clone git@github.com:sawaichi9527/ubuntu-wayland-sizer.git
cd ubuntu-wayland-sizer
```

Install or update the user-local extension:

```bash
./scripts/install-extension-dev.sh
```

If schemas or shortcut defaults changed, log out and log back in.

Enable the extension:

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Check status:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Watch logs:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell
```

## Update Existing Development Install

```bash
git pull
./scripts/install-extension-dev.sh

gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

If GSettings schema keys changed, log out and back in before testing.

## Repository Layout

```text
ubuntu-wayland-sizer/
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── architecture.md
│   ├── debug-extension-startup.md
│   ├── keybinding-policy.md
│   ├── known-issues.md
│   ├── phase-3-built-in-presets.md
│   ├── phase-4-multi-monitor-and-safety.md
│   ├── reference-implementations.md
│   ├── status.md
│   └── test-matrix.md
├── extension/
│   ├── extension.js
│   ├── metadata.json
│   └── schemas/
│       └── org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
└── scripts/
    └── install-extension-dev.sh
```

## Design Principles

- Keep the baseline extension-only.
- Use GNOME Shell keybindings instead of low-level key capture.
- Use monitor workarea, not raw monitor geometry.
- Treat full-workarea frames as maximized-like even when `get_maximized()` is insufficient.
- Apply a safe restore before resizing full-workarea/maximized-like windows.
- Read back actual frame geometry after resize and correct edge alignment for constrained apps.
- Defer D-Bus, GTK UI, tray integration, floating menus, and border triggers until geometry behavior is stable.

## Reference Implementation Notes

See:

```text
docs/reference-implementations.md
```

The project uses Ubuntu/Tiling Assistant as a practical reference for GNOME Shell / Mutter tiling behavior, especially around maximized-like states, monitor movement, and Wayland move/resize ordering.

## Current Development Direction

Current phase:

```text
Phase 5 — Baseline hardening and release hygiene
```

Near-term work:

- Keep README and docs aligned with tested behavior.
- Maintain a practical test matrix.
- Track known GNOME Shell / Ubuntu Dock / Mutter warnings separately from extension issues.
- Add a debug-log setting before expanding feature scope.

Future phase:

```text
Phase 6 — User-configurable presets
```

Potential Phase 6 items:

- Configurable center size
- Additional built-in presets
- Cleaner debug-log toggle
- User-facing shortcut documentation
- Preset configuration model
