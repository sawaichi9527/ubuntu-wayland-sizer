# Phase 7.2b — Preset Cycling Engine

## Goal

Phase 7.2b adds a minimal preset cycling engine for centered window sizes.

This phase intentionally does not add popup UI, tray UI, D-Bus control, or user-defined preset lists. The goal is to validate the cycling model first while keeping the project extension-only.

## Scope

Included:

- explicit ordered center preset cycle list
- next / previous center cycling actions
- wrap-around behavior
- shortcut registration for cycling actions
- best-effort inference of the current centered preset from the focused window geometry
- reuse of existing centered preset geometry, workarea clamping, and post-resize correction logic

Deferred:

- popup menu
- visible on-screen preset indicator
- custom user-defined cycle order
- cycling through the entire size library
- per-app remembered preset state
- persistent cycle state across GNOME Shell reloads or login sessions

## Cycling Order

The center preset cycling order is explicit and does not depend on JavaScript object insertion order.

Current order:

```text
center-compact -> center -> center-large -> center-compact
```

Reverse order:

```text
center-large -> center -> center-compact -> center-large
```

The order maps to:

| Cycle Index | Preset ID | Meaning |
|---:|---|---|
| 0 | `center-compact` | Fixed 800x600 centered preset. |
| 1 | `center` | Configurable centered preset, default 1280x720. |
| 2 | `center-large` | Fixed 1440x768 centered preset. |

## Default Shortcuts

```text
Super + Alt + .      -> Cycle center preset forward
Super + Alt + ,      -> Cycle center preset backward
```

Existing direct preset shortcuts remain available:

```text
Super + Alt + J      -> Center compact
Super + Alt + C      -> Center custom
Super + Alt + K      -> Center large
```

## Behavior

When a cycling shortcut is triggered:

1. The extension tries to infer the current cycle index from the focused window geometry.
2. If the current frame matches one of the known center preset geometries, that index is used.
3. If no geometry match is found, the extension falls back to the last remembered center cycle index.
4. If there is no remembered index, the virtual starting index is `-1`.
5. The requested direction is applied.
6. The index wraps around the cycle list.
7. The selected preset is applied using the existing resize path.

This means the first forward cycle from an unknown state applies:

```text
center-compact
```

The first backward cycle from an unknown state applies:

```text
center-large
```

## Geometry Inference

The cycling engine performs best-effort geometry inference by comparing the focused window frame with each centered preset target for the current monitor workarea.

This is useful when a user directly triggers one of the center presets and then starts cycling.

Example:

```text
Super + Alt + C      -> center
Super + Alt + .      -> center-large
Super + Alt + .      -> center-compact
```

The inference is intentionally best-effort. If an application enforces minimum-size constraints or Mutter returns a slightly different frame, the remembered cycle index is used as a fallback.

## State Model

The cycling state is runtime-only:

```text
_centerCycleIndex
```

It is reset when the extension is disabled, reloaded, or GNOME Shell restarts.

This is intentional for Phase 7.2b. Persistent state should be considered separately only after cycling behavior is validated.

## Validation Checklist

After reinstalling the extension and logging out/in if needed for schema refresh, validate:

```text
Super + Alt + .      cycles compact -> custom -> large -> compact
Super + Alt + ,      cycles large -> custom -> compact -> large
Super + Alt + J      applies compact and updates remembered cycle index
Super + Alt + C      applies custom and updates remembered cycle index
Super + Alt + K      applies large and updates remembered cycle index
```

Expected debug logs include:

```text
[ubuntu-wayland-sizer] enable: keybinding registered: cycle-center-next -> center-cycle(1)
[ubuntu-wayland-sizer] enable: keybinding registered: cycle-center-previous -> center-cycle(-1)
[ubuntu-wayland-sizer] action: center cycle next: index=...
[ubuntu-wayland-sizer] action: center cycle previous: index=...
[ubuntu-wayland-sizer] action: remembered center cycle index=...
```

## Validation Results

### Firefox dual-monitor validation — PASS

Environment:

```text
Application: Firefox
Primary monitor workarea:   67,32 1853x1168
Secondary monitor workarea: 1920,0 1080x1920
```

Validated behavior:

- Center cycling works on the primary monitor.
- Center cycling works on the secondary portrait-right monitor.
- Forward cycle wraps correctly: `center-compact -> center -> center-large -> center-compact`.
- Reverse cycle wraps correctly: `center-large -> center -> center-compact -> center-large`.
- Direct center presets update the remembered cycle index.
- Full-workarea breakout works before applying centered presets.
- Left, right, full, and center presets continue to work after cycling.
- Workarea clamping works on the secondary monitor where wide center presets clamp to 1080px width.

Observed secondary monitor clamp examples:

```text
center       configured=1200x854 -> target=1080x854
center-large configured=1440x768 -> target=1080x768
```

Notes:

- Some primary-monitor rapid cycling logs showed a post-correction pass where Mutter temporarily reported the previous frame size before settling on the requested size in the next action.
- This did not block Firefox validation because repeated cycling recovered and final Firefox behavior was reported as normal on both monitors.
- Keep this behavior in mind when testing slower or constraint-heavy applications.

### Multi-app dual-monitor validation — PASS

Applications confirmed by manual validation:

- VSCode
- Terminal
- LibreOffice
- Nautilus

Validated behavior:

- Center cycling shortcuts work normally on both monitors.
- Direct center preset shortcuts work normally on both monitors.
- Left, right, full, and center shortcuts work normally on both monitors.
- Secondary portrait-right monitor clamping continues to behave as expected.
- Full-workarea breakout continues to work before returning to centered presets.

This expands Phase 7.2b validation from Firefox-only coverage to a mixed desktop application set, including Electron-style, terminal, office, and GNOME file manager behavior.

Current validation status:

```text
Phase 7.2b implementation: COMPLETE
Phase 7.2b Firefox dual-monitor validation: PASS
Phase 7.2b multi-app dual-monitor validation: PASS
```

## Known Limitations

- Cycling currently covers only the three active centered presets.
- It does not cycle left/right/full presets.
- It does not expose the full size library yet.
- Runtime state is global to the extension, not per-window or per-app.
- Geometry inference can fail when an application enforces minimum size constraints.

These limitations are acceptable for Phase 7.2b because the purpose is to validate the cycling engine before adding UI.

## Next Candidate Phase

After validation passes, a reasonable follow-up is:

```text
Phase 7.2c — Popup preset menu design
```
