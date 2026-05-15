# Phase 7.2c — Popup Preset Menu Design

## Goal

Phase 7.2c defines the popup preset menu design for Ubuntu Wayland Sizer.

The popup is not only a preset picker. It should become the main focused-window workflow for:

```text
inspect current window geometry
choose built-in preset
apply preset to focused window
capture current window geometry
save captured geometry as a named custom preset
apply saved custom preset later
```

This design keeps the project aligned with Windows Sizer's useful menu-based workflow while staying native to Ubuntu 26.04 / GNOME Shell / Wayland.

## Primary User Flow

```text
focus window
Super + Alt + Space
open Ubuntu Wayland Sizer popup
inspect current focused-window geometry
choose preset or saved preset
apply to focused window
```

Extended capture flow:

```text
focus window
Super + Alt + Space
open Ubuntu Wayland Sizer popup
inspect current focused-window geometry
Save Current Window As Preset
enter preset name
save current position and size
later: open popup again
select saved preset
apply saved geometry to focused window
```

## Core Concept

The popup has three responsibilities:

1. **Inspect**
   - Show the currently focused window's monitor, position, and size.

2. **Apply**
   - Apply built-in or saved presets to the currently focused normal window.

3. **Capture**
   - Save the current focused window's geometry as a named custom preset.

This turns the popup into a practical equivalent of the most useful Windows Sizer workflows without requiring Windows-specific system menu integration or border right-click interception.

## MVP Scope

### Included in MVP

- Keyboard-triggered popup.
- Display current focused-window geometry.
- Display current monitor/workarea geometry.
- Built-in preset list.
- Saved custom preset list.
- Apply selected preset to focused window.
- Save current focused-window geometry as a named preset.
- Use logical workarea coordinates.
- Store saved preset width and height.
- Store saved preset position relative to the current monitor workarea.

### Deferred

- Full preferences UI.
- Drag-and-drop preset reordering.
- Import/export Windows Sizer config.
- Tray icon workflow.
- System menu integration.
- Border/corner right-click interception.
- Manual resize tooltip.
- Grid snapping during manual resize.
- Per-application rules.
- Per-monitor custom preset filtering.

## Popup Trigger

Recommended default shortcut:

```text
Super + Alt + Space -> open Ubuntu Wayland Sizer popup
```

Rationale:

- It is keyboard-first.
- It avoids GNOME/Ubuntu arrow-key conflicts.
- It maps well to a command-palette style interaction.
- It does not depend on tray icons or titlebar menu injection.

The shortcut should be backed by a GSettings key:

```text
open-preset-popup
```

## Current Geometry Display

When the popup opens, it should read the focused window context.

Suggested display:

```text
Focused Window
App:        Firefox
Title:      Sizer User Guide
Monitor:    0
Frame:      x=393 y=189 w=1200 h=854
Workarea:   x=67 y=32 w=1853 h=1168
Relative:   x=326 y=157 w=1200 h=854
```

For the secondary portrait monitor example:

```text
Focused Window
Monitor:    1
Frame:      x=1920 y=533 w=1080 h=854
Workarea:   x=1920 y=0 w=1080 h=1920
Relative:   x=0 y=533 w=1080 h=854
```

The important stored values should be relative to the active workarea, not raw global absolute screen coordinates.

## Geometry Model

### Runtime Geometry

The extension can read:

```text
frame.x
frame.y
frame.width
frame.height
workarea.x
workarea.y
workarea.width
workarea.height
monitor index
```

### Saved Geometry

A captured custom preset should store:

```json
{
  "id": "custom-my-layout",
  "label": "My Layout",
  "type": "custom-geometry",
  "geometry": {
    "mode": "workarea-relative",
    "x": 326,
    "y": 157,
    "width": 1200,
    "height": 854
  }
}
```

The popup may display the saved preset as:

```text
My Layout — 1200x854 @ +326,+157
```

### Why Workarea-relative Coordinates

Do not store raw absolute global coordinates as the primary model.

Reason:

- monitor layout can change
- dock/panel workarea can change
- scaling can change
- secondary monitor origin can differ
- portrait/landscape layouts differ

Instead, store coordinates relative to the monitor workarea:

```text
relative_x = frame.x - workarea.x
relative_y = frame.y - workarea.y
width      = frame.width
height     = frame.height
```

When applying the preset later:

```text
target_x = current_workarea.x + relative_x
target_y = current_workarea.y + relative_y
```

Then clamp the result to the current workarea.

## Saved Preset Behavior

A saved custom preset should apply to the currently focused window, not only to the original app.

Initial behavior:

```text
saved preset -> apply to currently focused normal window
```

Deferred behavior:

```text
per-app saved preset -> apply only/specially to matching app id
```

Reason:

- global saved presets are simpler and more Sizer-like
- per-app behavior requires app identity handling and UI decisions
- current architecture is focused-window-first

## Capture Flow

### Minimal Capture Flow

```text
open popup
select Save Current Window As Preset
enter name
save geometry
```

Minimum fields:

```text
Name
Width
Height
Relative X
Relative Y
```

The initial UI can auto-fill all geometry values from the focused window.

### Naming Rules

Preset name should be user-facing and can contain spaces:

```text
Browser reading layout
Terminal narrow left
Report writing size
```

Internal ID should be generated safely:

```text
custom-browser-reading-layout
custom-terminal-narrow-left
custom-report-writing-size
```

If duplicate names exist, append a suffix:

```text
custom-browser-reading-layout-2
```

## Apply Flow

When applying a saved custom geometry preset:

1. Get focused normal window.
2. Get current monitor workarea.
3. Convert saved workarea-relative geometry to current absolute logical geometry.
4. Clamp geometry to current workarea.
5. Apply safe full-workarea breakout if needed.
6. Move/resize focused window.
7. Run post-resize correction.

This reuses the existing resize pipeline rather than introducing a separate path.

## Popup Menu Structure

Recommended MVP structure:

```text
Ubuntu Wayland Sizer

Focused Window
  App: Firefox
  Geometry: 1200x854 @ +326,+157
  Monitor: 0, Workarea: 1853x1168

Center Presets
  Compact center       800x600
  Custom center        1200x854
  Large center         1440x768

Saved Presets
  Browser reading      1200x854 @ +326,+157
  Terminal left        900x1000 @ +0,+80

Window Positions
  Left half
  Right half
  Full workarea

Actions
  Save Current Window As Preset
  Manage Presets...       deferred
```

## Keyboard Navigation

MVP should support keyboard-driven selection.

Recommended behavior:

```text
Super + Alt + Space -> open popup
Arrow Up/Down       -> move selection
Enter               -> apply selected preset/action
Esc                 -> close popup
```

If text input is used for naming, the popup should enter a capture mode:

```text
Name: [ current geometry preset name ]
Enter -> save
Esc   -> cancel
```

## Storage Model

Recommended initial storage:

```text
GSettings string containing validated JSON
```

Candidate key:

```text
custom-presets-json
```

Example:

```json
{
  "version": 1,
  "presets": [
    {
      "id": "custom-browser-reading",
      "label": "Browser reading",
      "type": "custom-geometry",
      "geometry": {
        "mode": "workarea-relative",
        "x": 326,
        "y": 157,
        "width": 1200,
        "height": 854
      }
    }
  ]
}
```

Alternative later:

```text
JSON file under user config directory
```

For MVP, GSettings JSON is acceptable because:

- extension-local schema already exists
- no external config file path policy is needed yet
- validation can be centralized

## Validation Rules for Saved Presets

When loading custom presets:

- JSON must parse successfully.
- `version` must be supported.
- `presets` must be an array.
- each preset must have a non-empty `id`.
- each preset must have a non-empty `label`.
- geometry mode must be `workarea-relative`.
- x/y/width/height must be finite integers.
- width/height must be greater than zero.
- invalid entries should be ignored, not crash the extension.

When applying custom presets:

- clamp geometry to current workarea.
- respect app minimum-size constraints.
- use post-resize correction.

## Relationship to Existing Presets

Existing built-in presets remain first-class:

```text
left
right
full
center
center-compact
center-large
```

New saved presets should be separate:

```text
custom-* presets
```

Do not mix saved custom presets directly into `SIZE_LIBRARY`.

Reason:

- `SIZE_LIBRARY` is built-in reference data.
- custom presets are user data.
- custom presets may include position as well as size.

## Position Semantics

Saved custom geometry should use `workarea-relative` position semantics.

Example:

Current frame:

```text
frame:    x=393 y=189 w=1200 h=854
workarea: x=67  y=32  w=1853 h=1168
```

Saved geometry:

```text
x=326 y=157 w=1200 h=854
```

Apply on same monitor:

```text
target x=67+326=393
target y=32+157=189
```

Apply on secondary monitor:

```text
workarea x=1920 y=0 w=1080 h=1920
saved x=326 y=157 w=1200 h=854
clamped target width=1080
final x=1920+326, then clamped if needed
```

The exact clamping behavior should be documented and tested before enabling cross-monitor saved preset workflows widely.

## Open Design Question: Clamp Position vs Preserve Offset

When a saved geometry is too wide for the current workarea, there are two possible behaviors:

### Option A — Clamp size, preserve offset if possible

```text
x = workarea.x + saved.x
width = min(saved.width, workarea.width - saved.x)
```

Pros:

- preserves the user's saved left/top offset

Cons:

- may produce unexpectedly narrow windows if saved.x is large on a small monitor

### Option B — Clamp size, then re-center if too large

```text
width = min(saved.width, workarea.width)
x = clamp(workarea.x + saved.x)
```

Pros:

- more likely to keep usable size

Cons:

- less faithful to saved position

MVP recommendation:

```text
Option A for explicit saved geometry,
existing clampGeometryToWorkArea behavior first,
then revise if validation shows poor UX.
```

## Suggested Phasing

### Phase 7.2c-doc — Popup design document

Status: this document.

### Phase 7.2d — Select-only popup MVP

Implement:

- popup trigger
- current focused-window geometry display
- built-in preset application
- no saving yet

### Phase 7.2e — Capture current geometry MVP

Implement:

- Save Current Window As Preset
- prompt for name
- save workarea-relative geometry to custom-presets-json
- display saved presets in popup
- apply saved presets

### Phase 7.2f — Saved preset management

Implement:

- delete saved preset
- rename saved preset
- maybe reorder saved presets

### Phase 7.3 — Expanded built-in preset exposure

Implement:

- more size library entries in popup
- grouping by Basic / 4:3 / 16:9 / 16:10 / Large

## MVP Acceptance Criteria

For Phase 7.2d select-only popup:

- `Super + Alt + Space` opens popup.
- Popup shows focused window geometry.
- Popup shows active monitor/workarea information.
- Selecting built-in center/position preset applies it correctly.
- Popup closes cleanly after apply or Esc.
- No regression to existing hotkeys and cycling.

For Phase 7.2e capture MVP:

- Popup can save current focused window geometry with a user-provided name.
- Saved preset appears in popup.
- Saved preset applies to the currently focused window.
- Saved preset is persisted across extension reload/login.
- Invalid saved preset data does not crash the extension.

## Conclusion

The recommended workflow becomes:

```text
focus window
Super + Alt + Space
open Ubuntu Wayland Sizer popup
inspect current position and size
choose built-in or saved preset
apply to focused window
```

And the capture workflow becomes:

```text
focus window
arrange window manually or by existing preset
Super + Alt + Space
Save Current Window As Preset
name it
reuse it later from the same popup
```

This is a strong GNOME Wayland-native replacement for the most useful Windows Sizer behaviors:

- preset menu
- current size awareness
- custom named sizes
- saved positions
- focused-window resize workflow

without depending on Windows-only mechanisms such as system menu injection, tray-first operation, or right-click border interception.
