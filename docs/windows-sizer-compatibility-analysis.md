# Windows Sizer Compatibility Analysis for Ubuntu Wayland Sizer

## Purpose

This document analyzes which Windows Sizer 4.0-style features are realistic to implement in Ubuntu Wayland Sizer on Ubuntu 26.04 / GNOME Shell 50 / Wayland.

The goal is not to clone Windows behavior one-to-one. The goal is to identify:

- features that can be implemented directly
- features that can be implemented with GNOME/Wayland-specific changes
- features that should use alternatives
- features that are not suitable for this project

## Current Project Baseline

Current validated baseline:

```text
Ubuntu 26.04
GNOME Shell 50
Wayland session
GNOME Shell extension only
```

Validated behavior so far:

- focused-window resize and move
- workarea-based geometry
- primary and secondary monitor handling
- secondary portrait-right monitor support
- center preset size library
- center preset cycling
- full-workarea breakout
- post-resize correction for constrained apps
- multi-app validation across Firefox, VSCode, Terminal, LibreOffice, and Nautilus

## Compatibility Summary

| Windows Sizer-style Feature | Ubuntu Wayland Feasibility | Recommended Direction |
|---|---|---|
| Resize focused window to preset sizes | Good | Implement directly through GNOME Shell / Mutter APIs. |
| Move focused window to preset positions | Good | Already partially implemented through left/right/full/center geometry. |
| Center window presets | Good | Already implemented. Expand with more size presets later. |
| Size cycling | Good | Already implemented for center presets in Phase 7.2b. |
| Popup preset menu | Good | Implement as GNOME Shell UI, not as a Windows tray/system-menu clone. |
| Keyboard shortcuts per preset | Good | Use GNOME Shell keybindings and GSettings schema keys. |
| User-configurable preset list | Medium | Implement later through GSettings or JSON config; avoid full UI until core model stabilizes. |
| Grouped preset menu | Good | Use the existing size groups: basic, 4:3, 16:9, 16:10, large. |
| Multi-monitor aware presets | Good | Already workarea/monitor-aware. Need UI display refinement later. |
| Window system menu integration | Poor | Windows-specific. Use GNOME Shell popup/menu or extension indicator instead. |
| Tray icon menu | Medium/Poor | GNOME Shell does not treat tray icons like classic Windows. Prefer Shell panel indicator or keyboard-driven popup. |
| Resize by dragging window border with helper overlay | Poor | Not suitable for extension-only Wayland scope. Mutter owns interactive resize behavior. |
| Per-window class rules | Medium | Possible later, but needs careful app identity handling. |
| Per-application saved presets | Medium | Possible later; use WM_CLASS/app id where available. |
| Exact physical pixel control | Poor | Wayland/GNOME uses logical coordinates and compositor-managed scaling. Keep logical-pixel model. |
| Force resize of constrained windows | Poor | Apps and Mutter may enforce minimum sizes. Current correction model should respect constraints. |
| System-wide non-GNOME support | Poor | Current project is GNOME Shell / Mutter specific. KDE/Sway need separate backend strategy. |

## Feature-by-Feature Analysis

### 1. Preset Size Library

Status: already started and feasible.

Windows Sizer-style behavior usually centers around a reusable list of named sizes.

Ubuntu Wayland Sizer should keep this as a backend-neutral logical model:

```text
preset id -> preset definition -> optional size library entry -> calculated geometry
```

Current project state already supports:

```text
center-compact -> 800x600
center         -> configurable, currently 1200x854 in current test environment
center-large   -> 1440x768, clamped on narrow workareas
```

Recommended next expansion:

- add more fixed center presets from the existing size library
- avoid exposing all sizes in shortcuts
- expose all sizes through a popup menu later

### 2. Popup Preset Menu

Status: feasible, recommended next major UI phase.

Windows Sizer commonly exposes presets through menu interaction. On Ubuntu GNOME Wayland, this should not be implemented as a Windows-style titlebar/system-menu injection.

Recommended alternatives:

1. keyboard-triggered popup near focused window
2. top-panel extension indicator menu
3. command-palette-style GNOME Shell popup

Preferred project direction:

```text
Phase 7.2c — Popup preset menu design
```

First implementation should be read-only/select-only:

- show grouped preset list
- selecting an entry applies that preset to the focused window
- no editing UI yet

Avoid in first popup version:

- drag-to-resize UI
- per-app rules
- complex preference editor
- persistent custom preset editing

### 3. System Menu Integration

Status: not recommended.

Windows Sizer can integrate with Windows window menu behavior. GNOME Shell / Wayland does not provide an equivalent safe project-level target for injecting custom items into each app window's system menu.

Recommended alternative:

```text
GNOME Shell popup menu or panel indicator
```

This preserves the same user goal without depending on Windows-only UI concepts.

### 4. Tray Icon / Status Menu

Status: possible but not ideal as a first UI target.

Classic tray behavior is a Windows-centric interaction model. Ubuntu GNOME may have AppIndicator-style support depending on distribution extensions, but relying on that would add another compatibility surface.

Recommended alternative order:

1. keyboard-triggered popup menu
2. optional GNOME Shell panel indicator
3. avoid legacy tray dependency

### 5. Hotkeys

Status: feasible and already used.

GNOME Shell keybindings are the correct model for this project.

Current examples:

```text
Super + Alt + H      -> left
Super + Alt + L      -> right
Super + Alt + F      -> full
Super + Alt + C      -> center
Super + Alt + J      -> center-compact
Super + Alt + K      -> center-large
Super + Alt + .      -> cycle center next
Super + Alt + ,      -> cycle center previous
```

Recommended future design:

- keep only a small set of default hotkeys
- allow direct binding for common presets
- avoid assigning hotkeys to every size-library entry by default
- keep arrow keys avoided by default because GNOME/Ubuntu may reserve them

### 6. Custom Presets

Status: feasible, but should be deferred until popup/menu behavior is validated.

Potential storage models:

| Storage Option | Pros | Cons | Recommendation |
|---|---|---|---|
| GSettings scalar keys | Simple | Poor for arbitrary preset arrays | Use only for simple values. |
| GSettings string/JSON | Extension-native | Harder to edit manually | Good intermediate option. |
| JSON file under user config | Flexible | Needs file IO and validation | Good later option. |
| Full GTK preferences UI | User-friendly | More implementation cost | Defer. |

Recommended staged approach:

```text
Phase A: built-in presets only
Phase B: popup menu selection
Phase C: JSON/GSettings custom presets
Phase D: preferences UI
```

### 7. Groups / Menu Organization

Status: feasible.

Existing size groups are suitable for popup UI:

```text
Basic
4:3
16:9
16:10
Large
```

Recommended menu structure:

```text
Center Presets
├── Compact center
├── Custom center
└── Large center

Size Library
├── Basic
├── 4:3
├── 16:9
├── 16:10
└── Large

Window Positions
├── Left half
├── Right half
└── Full workarea
```

### 8. Move + Resize Positions

Status: feasible.

Already validated:

- left half
- right half
- full workarea
- centered presets

Recommended future additions:

- top-left
- top-right
- bottom-left
- bottom-right
- top half
- bottom half
- thirds, if desired

Caution:

- On portrait monitors, half-width and third-width presets may collide with app minimum widths.
- Use current post-resize correction model instead of forcing exact size.

### 9. Multi-monitor Behavior

Status: feasible and already validated.

Current approach is correct:

```text
focused window -> current monitor -> active workspace workarea -> target geometry
```

Recommended future improvements:

- popup menu should show active monitor context
- optional monitor-specific preset memory later
- do not introduce raw physical monitor coordinates in the user model

### 10. Exact Coordinates and Physical Pixels

Status: not recommended.

On GNOME Wayland, the safe model is logical workarea geometry. Physical pixels, fractional scaling, and compositor-managed transformations should remain internal to Mutter.

Recommended wording:

```text
Ubuntu Wayland Sizer presets use logical pixels inside the current monitor workarea.
```

Do not promise exact physical-pixel sizing.

### 11. Force Resize / Override App Constraints

Status: not suitable.

Some apps enforce minimum sizes. Mutter and the app toolkit may reject a requested geometry. Current project behavior is better:

```text
request target -> read actual frame -> correct alignment
```

This means:

- exact size may not always be achieved
- alignment should still match preset intent
- this is acceptable and safer than fighting the compositor/app

### 12. Snap / Interactive Border Behavior

Status: not recommended for extension-only Wayland scope.

Interactive resize by window border is compositor-owned behavior. Trying to intercept or modify it would significantly increase risk and likely require Mutter-level patches or unsupported behavior.

Recommended alternative:

- keyboard shortcuts
- popup menu
- preset cycling
- optional panel indicator

### 13. Importing Windows Sizer Presets

Status: possible later, but not first priority.

If Sizer exports presets in a readable format, a later migration tool could map:

```text
name
width
height
position
```

into Ubuntu Wayland Sizer presets.

Caveats:

- Windows coordinates do not map cleanly to GNOME logical workareas.
- Multi-monitor layouts differ.
- Physical pixels vs logical pixels can differ under scaling.

Recommended later approach:

```text
import as logical size presets only
ignore absolute screen coordinates by default
```

## Recommended Implementation Roadmap

### Phase 7.2c — Popup Preset Menu Design

Goal:

- define GNOME Shell popup menu structure
- decide keyboard-triggered popup vs panel indicator first
- reuse existing preset model

Recommended MVP:

```text
Super + Alt + Space -> open preset popup
select preset -> apply to focused window
```

### Phase 7.2d — Popup Preset Menu Implementation

Goal:

- implement select-only popup
- no editing yet
- grouped built-in presets only

### Phase 7.3 — Expanded Built-in Preset Exposure

Goal:

- expose more size-library entries through popup
- keep hotkeys minimal
- validate with existing app set

### Phase 7.4 — User Preset Configuration Model

Goal:

- add custom preset storage
- likely JSON or GSettings JSON string
- no complex GTK preferences yet

### Phase 7.5 — Optional Preferences UI

Goal:

- edit custom presets
- reorder cycle list
- maybe import/export presets

## Recommended Do / Do Not

### Do

- Use GNOME Shell extension APIs.
- Use logical workarea coordinates.
- Keep focused-window-first behavior.
- Keep popup UI inside GNOME Shell.
- Keep Windows Sizer compatibility at the concept level.
- Preserve current post-resize correction behavior.

### Do Not

- Do not attempt Windows system-menu injection.
- Do not depend on legacy tray behavior as the primary UI.
- Do not promise physical-pixel exactness.
- Do not force app windows below their minimum sizes.
- Do not expand into KDE/Sway before the GNOME backend is stable.
- Do not add a full preferences editor before popup selection is validated.

## Practical Conclusion

Ubuntu Wayland Sizer can implement the most valuable Windows Sizer-style behavior:

```text
named size presets
centered resize presets
position presets
hotkeys
cycling
popup menu selection
custom preset model
```

The parts that should not be cloned directly are mainly Windows shell integration features:

```text
window system menu injection
classic tray-first workflow
physical-pixel assumptions
force-resize behavior
interactive border interception
```

The best direction is to treat Windows Sizer as a UX reference, not as an implementation blueprint.

For Ubuntu 26.04 GNOME Wayland, the native shape should be:

```text
GNOME Shell extension
focused-window actions
logical workarea geometry
keyboard-first operation
GNOME popup or panel indicator UI
optional custom preset configuration later
```
