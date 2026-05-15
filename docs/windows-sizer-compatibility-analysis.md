# Windows Sizer Compatibility Analysis for Ubuntu Wayland Sizer

## Purpose

This document analyzes which Windows Sizer user-guide features are realistic to implement in Ubuntu Wayland Sizer on Ubuntu 26.04 / GNOME Shell 50 / Wayland.

This analysis is aligned with the visible sections from the Windows Sizer user guide screenshot:

- Precise resizing
- System Menu Integration
- System Tray Resizing
- Interactive resizing
- Configuring Sizer

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

## User Guide Feature Mapping

| Windows Sizer User Guide Feature | What it does in Windows Sizer | Ubuntu GNOME Wayland Feasibility | Recommended Ubuntu Wayland Direction |
|---|---|---|---|
| Precise resizing by right-clicking window border/corner during resize | Opens a size menu while the resizing cursor is active. | Poor for extension-only Wayland. | Do not intercept borders. Use keyboard-triggered popup or panel menu instead. |
| Resize from restore button when maximized | Opens a resize menu from the restore button area. | Poor. | Keep existing full-workarea breakout, then apply preset by hotkey or popup. |
| System Menu Integration | Adds Sizer items into the standard Windows window system menu. | Poor. | Replace with GNOME Shell popup menu or panel indicator menu. |
| System Tray Resizing | Tray icon menu applies size presets to the active window. | Medium. | Prefer GNOME Shell panel indicator or keyboard-triggered popup; avoid legacy tray dependency. |
| Interactive resizing tooltip | Shows current window size while manually resizing. | Medium/Poor. | Possible only as approximate Shell overlay; defer. Not required for core Sizer-like workflow. |
| Snap to nearest grid size while holding modifier during resize | Manual resizing snaps to configured grid size. | Poor. | Do not implement in extension-only scope. Mutter owns interactive resizing. |
| Configuring preset list | User can add/edit/remove sizes, including description, width, height, and optional move-to position. | Medium/Good. | Implement after popup selection: JSON/GSettings custom preset model first, preferences UI later. |
| Move to position with preset | Preset can resize and reposition, including top/left coordinates. | Good with Wayland-specific limits. | Support relative workarea positions; avoid raw global absolute coordinates as the user model. |
| Always show tooltip while resizing | Persistent resize feedback. | Medium/Poor. | Defer; consider debug overlay later, not part of MVP. |
| Load Sizer on system start / tray startup | Starts app automatically for tray workflow. | Not directly applicable. | GNOME extensions are loaded by Shell; no separate startup tray app is needed. |

## Compatibility Summary

| Windows Sizer-style Feature | Ubuntu Wayland Feasibility | Recommended Direction |
|---|---|---|
| Resize focused window to preset sizes | Good | Implement directly through GNOME Shell / Mutter APIs. |
| Move focused window to preset positions | Good | Already partially implemented through left/right/full/center geometry. |
| Center window presets | Good | Already implemented. Expand with more size presets later. |
| Size cycling | Good | Already implemented for center presets in Phase 7.2b. |
| Popup preset menu | Good | Implement as GNOME Shell UI, not as a Windows tray/system-menu clone. |
| Keyboard shortcuts per preset | Good | Use GNOME Shell keybindings and GSettings schema keys. |
| User-configurable preset list | Medium | Implement later through GSettings or JSON config; avoid full UI until popup model stabilizes. |
| Grouped preset menu | Good | Use the existing size groups: basic, 4:3, 16:9, 16:10, large. |
| Multi-monitor aware presets | Good | Already workarea/monitor-aware. Need UI display refinement later. |
| Window system menu integration | Poor | Windows-specific. Use GNOME Shell popup/menu or extension indicator instead. |
| Tray icon menu | Medium/Poor | GNOME Shell does not treat tray icons like classic Windows. Prefer Shell panel indicator or keyboard-driven popup. |
| Resize by dragging window border with helper menu | Poor | Not suitable for extension-only Wayland scope. Mutter owns interactive resize behavior. |
| Resize tooltip during manual resizing | Medium/Poor | Possible as overlay later, but not a core requirement. |
| Grid snapping during manual resizing | Poor | Do not implement unless Mutter-level integration becomes available. |
| Per-window class rules | Medium | Possible later, but needs careful app identity handling. |
| Per-application saved presets | Medium | Possible later; use WM_CLASS/app id where available. |
| Exact physical pixel control | Poor | Wayland/GNOME uses logical coordinates and compositor-managed scaling. Keep logical-pixel model. |
| Force resize of constrained windows | Poor | Apps and Mutter may enforce minimum sizes. Current correction model should respect constraints. |
| System-wide non-GNOME support | Poor | Current project is GNOME Shell / Mutter specific. KDE/Sway need separate backend strategy. |

## Feature-by-Feature Analysis

### 1. Precise Resizing

Windows Sizer behavior:

- When Sizer is running, the user can move the cursor over a window border/corner until the resize cursor appears.
- Right-clicking while the resize cursor is active opens a preset size menu.
- Choosing a preset resizes the window.
- The guide also mentions using the restore button area for maximized windows.

Ubuntu GNOME Wayland feasibility: poor for direct cloning.

Reason:

- Mutter owns interactive window resize behavior.
- GNOME Shell extensions should not depend on intercepting low-level border-resize pointer state.
- Client-side decoration and server-side decoration behavior differ across apps.
- Wayland intentionally limits global input interception.

Recommended replacement:

```text
keyboard-triggered popup menu
```

Recommended UX:

```text
focus window
Super + Alt + Space -> open preset popup
select preset -> apply to focused window
```

This preserves the core user value:

```text
choose a size preset for the active/focused window
```

without depending on Windows-specific border interaction.

### 2. System Menu Integration

Windows Sizer behavior:

- Adds Sizer entries into the standard Windows window system menu.
- The system menu can be accessed from the titlebar icon or titlebar right-click.
- Selecting a Sizer submenu item resizes/repositions the window.

Ubuntu GNOME Wayland feasibility: poor.

Reason:

- GNOME apps do not share a Windows-style system menu equivalent.
- Many GNOME apps use client-side decorations.
- There is no stable extension-level way to inject custom menu items into every application's titlebar/system menu.

Recommended replacement:

```text
GNOME Shell popup menu
```

or:

```text
GNOME Shell panel indicator menu
```

Recommended project direction:

- Do not attempt titlebar/system-menu injection.
- Implement a Shell-owned preset menu that acts on the currently focused normal window.

### 3. System Tray Resizing

Windows Sizer behavior:

- Sizer can live in the system tray.
- Right-clicking the tray icon opens a menu of sizes.
- Selecting a size resizes the active window.
- The menu may include configuration commands such as Configure Sizer, About, and Exit.

Ubuntu GNOME Wayland feasibility: medium, but not as a classic tray clone.

Reason:

- Ubuntu GNOME may support AppIndicator-style tray icons through distribution extensions, but this is not the same as classic Windows tray behavior.
- Depending on tray support adds another compatibility surface.
- A GNOME Shell extension can provide a panel indicator menu more natively than a legacy tray app.

Recommended replacement:

```text
GNOME Shell panel indicator menu
```

Possible menu:

```text
Ubuntu Wayland Sizer
├── Center Presets
│   ├── Compact center
│   ├── Custom center
│   └── Large center
├── Window Positions
│   ├── Left half
│   ├── Right half
│   └── Full workarea
├── Size Library
│   ├── Basic
│   ├── 4:3
│   ├── 16:9
│   ├── 16:10
│   └── Large
└── Settings / About
```

MVP recommendation:

- Start with keyboard-triggered popup first.
- Add a panel indicator only if a persistent menu entry is needed.

### 4. Interactive Resizing

Windows Sizer behavior:

- Shows the current size of a window in a tooltip while resizing.
- Can snap manual resize to the nearest configured grid size while holding a modifier key.
- Tooltip/grid settings are configurable.

Ubuntu GNOME Wayland feasibility: medium for tooltip, poor for grid snapping.

Reason:

- A Shell extension could theoretically show an overlay when it observes window size changes.
- However, reliably detecting all interactive resize states and modifier keys is fragile.
- Snapping manual resize while the user drags is compositor-level behavior and should not be part of the extension-only scope.

Recommended project decision:

```text
defer interactive resizing
```

Potential later alternative:

```text
Phase future: debug/size overlay
```

Possible safe version:

- show current focused window size after preset application
- show transient overlay after resize/cycle actions
- do not intercept manual border dragging
- do not implement grid snapping during pointer resize

### 5. Configuring Sizer

Windows Sizer behavior:

The screenshot shows a configuration dialog with:

- menu configuration list
- description field
- width field
- height field
- move-to dropdown
- top/left fields for positioning
- add/delete/move up/move down controls
- options such as showing tooltip while resizing
- option to add Sizer items to the system menu
- option to load Sizer at system start and show the system tray icon

Ubuntu GNOME Wayland feasibility: medium/good for preset configuration, poor for Windows shell options.

Recommended mapping:

| Windows Config Item | Ubuntu Wayland Mapping |
|---|---|
| Description | preset label |
| Width | logical width |
| Height | logical height |
| Move to dropdown | position mode: center, left, right, full, top-left, etc. |
| Top / Left | relative workarea offsets, not raw global physical pixels |
| Add | add custom preset later |
| Delete | delete custom preset later |
| Move Up / Move Down | reorder popup/cycle list later |
| Show tooltip while resizing | defer; maybe transient overlay later |
| Add Sizer to system menu | not applicable |
| Load Sizer at system start | handled by GNOME extension enablement |
| Show Sizer tray icon | replace with optional panel indicator |

Recommended storage path:

```text
Phase 7.4 — User Preset Configuration Model
```

Recommended first storage model:

```text
GSettings string containing validated JSON
```

or:

```text
JSON file under user config directory
```

Recommended later UI:

```text
Phase 7.5 — Optional Preferences UI
```

Do not build the full configuration editor before the popup menu and preset model are stable.

### 6. Preset Size Library

Status: already started and feasible.

Windows Sizer-style behavior centers around a reusable list of named sizes.

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

### 7. Popup Preset Menu

Status: feasible, recommended next major UI phase.

Windows Sizer exposes presets through menu interaction. On Ubuntu GNOME Wayland, this should not be implemented as a Windows-style titlebar/system-menu injection.

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

### 8. Hotkeys

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

### 9. Groups / Menu Organization

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

### 10. Move + Resize Positions

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

### 11. Multi-monitor Behavior

Status: feasible and already validated.

Current approach is correct:

```text
focused window -> current monitor -> active workspace workarea -> target geometry
```

Recommended future improvements:

- popup menu should show active monitor context
- optional monitor-specific preset memory later
- do not introduce raw physical monitor coordinates in the user model

### 12. Exact Coordinates and Physical Pixels

Status: not recommended.

On GNOME Wayland, the safe model is logical workarea geometry. Physical pixels, fractional scaling, and compositor-managed transformations should remain internal to Mutter.

Recommended wording:

```text
Ubuntu Wayland Sizer presets use logical pixels inside the current monitor workarea.
```

Do not promise exact physical-pixel sizing.

### 13. Force Resize / Override App Constraints

Status: not suitable.

Some apps enforce minimum sizes. Mutter and the app toolkit may reject a requested geometry. Current project behavior is better:

```text
request target -> read actual frame -> correct alignment
```

This means:

- exact size may not always be achieved
- alignment should still match preset intent
- this is acceptable and safer than fighting the compositor/app

### 14. Importing Windows Sizer Presets

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

### Future / Deferred — Interactive Resize Overlay

Goal:

- optional transient size overlay
- no border interception
- no grid snapping unless Mutter-level support exists

## Recommended Do / Do Not

### Do

- Use GNOME Shell extension APIs.
- Use logical workarea coordinates.
- Keep focused-window-first behavior.
- Keep popup UI inside GNOME Shell.
- Keep Windows Sizer compatibility at the concept level.
- Preserve current post-resize correction behavior.
- Treat Windows Sizer menu behavior as UX inspiration.

### Do Not

- Do not attempt Windows system-menu injection.
- Do not depend on legacy tray behavior as the primary UI.
- Do not intercept manual border/corner resizing in the extension-only scope.
- Do not promise physical-pixel exactness.
- Do not force app windows below their minimum sizes.
- Do not expand into KDE/Sway before the GNOME backend is stable.
- Do not add a full preferences editor before popup selection is validated.
- Do not implement grid snapping during pointer resize as an early feature.

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
optional panel indicator
```

The parts that should not be cloned directly are mainly Windows shell integration and interactive pointer-resize features:

```text
window system menu injection
classic tray-first workflow
border/corner right-click interception
manual resize grid snapping
physical-pixel assumptions
force-resize behavior
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

The closest practical equivalent to Windows Sizer's most useful menu behavior is:

```text
focus window
open Ubuntu Wayland Sizer popup
choose preset
apply to focused window
```
