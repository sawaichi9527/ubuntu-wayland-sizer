# Phase 7.2e — Capture Current Geometry MVP

## Goal

Phase 7.2e extends Ubuntu Wayland Sizer from:

```text
static built-in presets
```

into:

```text
user-defined persistent geometry presets
```

This is the first phase where the extension becomes a true workspace/layout management tool rather than only a preset resizer.

---

# Core UX

## Primary Flow

```text
focus window
Super + Alt + Space
Save Current Window As Preset
enter preset name
save
future popup -> apply saved preset
```

---

# MVP Scope

Included in 7.2e:

- capture current focused window geometry
- store geometry persistently in GSettings JSON
- popup section for saved presets
- apply saved preset
- workarea-relative geometry model
- automatic workarea clamping
- multi-monitor adaptive apply
- portrait/landscape compatibility

Deferred after MVP:

- rename preset
- delete preset
- reorder preset
- import/export
- per-application preset mapping
- monitor-specific preset binding
- keyboard shortcuts for custom presets
- panel indicator integration
- popup search/filter
- visual layout thumbnails

---

# Why Workarea-Relative Geometry Matters

Traditional Windows Sizer style tools often store:

```text
absolute monitor coordinates
```

Example:

```text
x=1920 y=0 w=1440 h=768
```

That approach breaks easily when:

- monitor order changes
- resolution changes
- DPI changes
- docking/undocking occurs
- portrait/landscape rotates
- laptop moves between desks

Ubuntu Wayland Sizer instead uses:

```text
workarea-relative geometry
```

Example:

```text
x=0
width=50% of current workarea
```

or:

```text
centered 1200x854
```

This makes saved layouts portable across:

- different monitor sizes
- different monitor arrangements
- portrait/landscape transitions
- GNOME workarea changes

---

# Storage Model

## GSettings Key

```text
custom-presets-json
```

Schema type:

```text
string JSON blob
```

---

# JSON Structure

## Top-Level Structure

```json
{
  "version": 1,
  "presets": []
}
```

---

# MVP Preset Entry

```json
{
  "id": "uuid-like-string",
  "name": "terminal-left-dev",
  "kind": "relative-geometry",
  "x": 0,
  "y": 0,
  "width": 926,
  "height": 1168,
  "workareaWidth": 1853,
  "workareaHeight": 1168,
  "createdAt": 1747290000
}
```

---

# Relative Geometry Definition

Captured values are stored relative to:

```text
current monitor workarea
```

Meaning:

```text
relativeX = frame.x - workarea.x
relativeY = frame.y - workarea.y
```

Stored geometry is NOT global desktop space.

This avoids dependency on:

- monitor ordering
- Xinerama-style global coordinates
- fixed monitor IDs

---

# Apply Algorithm

## Apply Steps

```text
1. detect focused window monitor
2. get current monitor workarea
3. scale/clamp geometry if necessary
4. move_resize_frame()
```

---

# Portrait Monitor Handling

Example:

Saved:

```text
1440x768 on 1853x1168 monitor
```

Applied later on:

```text
1080x1920 portrait monitor
```

Expected behavior:

```text
target width clamp to 1080
center vertically
preserve intended layout style
```

This behavior already exists in 7.2d built-in presets and should be reused.

---

# Popup UX Changes

## New Popup Section

Below built-in presets:

```text
Saved Presets
  terminal-left-dev
  vscode-debug
  browser-research
```

---

# Save Action Placement

Initial MVP:

```text
Save Current Window As Preset
```

implemented as:

```text
popup button
```

Future phases may use:

- inline text entry
- secondary modal
- preferences dialog
- panel dropdown

---

# Naming Rules

MVP rules:

- user-provided text
- duplicates allowed initially
- empty name rejected
- max length soft-limited in UI

Future phases may add:

- uniqueness enforcement
- tagging
- categories
- app association

---

# Runtime Validation

The extension must safely handle:

- invalid JSON
- corrupted entries
- missing fields
- negative geometry
- zero-size geometry
- oversized geometry

Invalid entries should:

```text
be ignored
```

without crashing GNOME Shell.

---

# Logging Expectations

## Save

```text
[ubuntu-wayland-sizer] custom-preset: saved preset id=... name=...
```

## Apply

```text
[ubuntu-wayland-sizer] custom-preset: applying preset id=... name=...
```

## Invalid JSON

```text
[ubuntu-wayland-sizer] custom-preset: failed to parse custom-presets-json
```

---

# Acceptance Criteria

Phase 7.2e MVP is complete when:

- popup can save current window geometry
- saved presets survive GNOME restart
- popup lists saved presets
- saved presets apply correctly
- portrait monitor clamping works
- no GNOME Shell crash on invalid JSON
- no regression to built-in presets
- no regression to popup lifecycle

---

# Strategic Importance

Phase 7.2e is the first step toward:

```text
persistent adaptive workspace layouts
```

This becomes the foundation for future features such as:

- per-app layout memory
- session restore
- workspace scene management
- dock/undock adaptive layouts
- AI-assisted workspace arrangement

This is also the point where Ubuntu Wayland Sizer begins to exceed the original Windows Sizer 4.0 capability model.
