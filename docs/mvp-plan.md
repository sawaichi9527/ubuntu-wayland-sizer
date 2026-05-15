# MVP Plan

## Goal

Build Ubuntu Wayland Sizer from the smallest stable GNOME Shell Extension baseline.

The project should avoid reintroducing the previous prototype complexity too early. The first usable milestone is not a complete Sizer clone. It is a reliable hotkey-driven focused-window resize tool.

## Phase 1 — Extension Lifecycle Baseline

Scope:

- `metadata.json`
- `extension.js`
- Standard GNOME Shell Extension class export
- Enable / disable logging

Success criteria:

- Extension appears in `gnome-extensions list`
- Extension can be enabled
- Extension can be disabled
- GNOME Shell journal shows clean enable / disable logs
- No constructor error
- No lingering actors, signals, timers, or services

Out of scope:

- Window resizing
- D-Bus
- GTK app
- System tray
- Border trigger
- Floating menu

## Phase 2 — Focused Window Resize Probe

Scope:

- Add one keybinding
- Detect focused `MetaWindow`
- Move/resize focused window to a fixed geometry
- Cleanly unregister keybinding on disable

Success criteria:

- Hotkey triggers reliably
- Focused normal windows can be resized
- Special windows are ignored safely
- Shell does not crash or log repeated errors

## Phase 3 — Built-in Presets

Scope:

- Add a small preset engine
- Built-in presets only
- Workarea-based calculations

Candidate presets:

- Left half
- Right half
- Top half
- Bottom half
- Center 1280x720
- Full workarea

Success criteria:

- Presets work across one monitor
- Workarea is respected
- Bounds are clamped

## Phase 4 — Multi-monitor Awareness

Scope:

- Detect window monitor
- Use monitor workarea
- Handle negative coordinates where applicable
- Avoid assuming monitor index 0

Success criteria:

- Resize applies on the monitor containing the target window
- Mixed monitor layouts do not break basic presets

## Phase 5 — D-Bus API

Scope:

- Export a minimal session-bus API from the extension
- Add `Ping()` first
- Add resize/list methods only after Ping is stable

Candidate API:

```text
Ping() -> s
ListWindows() -> aa{sv}
ApplyPreset(s preset_id, u window_id) -> b
ResizeWindow(u window_id, i x, i y, u width, u height) -> b
```

Success criteria:

- External tool can call `Ping()`
- Extension owns and releases D-Bus resources correctly
- No D-Bus name leak after disable

## Phase 6 — GTK4 Companion App

Scope:

- Status page
- Preset list
- Test controls
- D-Bus client only

Success criteria:

- App can detect extension status
- App can list windows through extension
- App can apply a preset through extension

## Deferred Features

These are intentionally not part of the initial MVP:

- Border trigger UX
- Floating resize menu
- Titlebar menu monkey-patch
- System tray / AppIndicator
- StatusNotifierItem fallback
- Advanced macro expression grammar
- Grid overlay
- Per-app rules

## Non-goals for MVP

- Pixel-perfect clone of Windows Sizer
- Cross-desktop support outside GNOME Shell
- X11 compatibility layer
- Flatpak distribution
- Complex packaging
