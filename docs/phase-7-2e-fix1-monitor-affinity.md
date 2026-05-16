# Phase 7.2e-fix1 — Saved Preset Monitor Affinity and Adaptive Placement

## Problem

Phase 7.2e introduced saved custom geometry presets. Initial validation showed that capture/save works, but cross-monitor apply exposed two design gaps:

1. A saved preset does not remember which monitor it was captured on.
2. A saved preset stores raw workarea-relative `x/y`, which can produce bad placement when applied to a monitor with a different orientation, size, or workarea.

Observed result:

```text
A preset captured on the secondary portrait monitor can be applied on the primary landscape monitor,
but the placement may be visually wrong or clipped.
```

The fix requires monitor affinity and adaptive placement.

---

# Design Goal

A saved preset should behave like:

```text
Restore this window to the same saved monitor context when available.
```

If the original monitor is not available, the preset should fall back safely to the current monitor using adaptive placement.

---

# Built-in Presets vs Saved Presets

## Built-in Presets

Built-in presets are monitor-independent:

```text
center-compact
center
center-large
left
right
full
```

They apply to the focused window's current monitor.

They do not need origin monitor metadata.

## Saved Presets

Saved presets are monitor-contextual:

```text
user saved this exact window geometry on a specific monitor/workarea
```

Therefore, saved presets should store and display monitor context.

---

# Preset Display Naming Strategy

## Principle

Keep the user-provided name as the primary label, but add a generated context suffix in the popup.

Do not mutate the user's name automatically unless necessary.

Recommended display format:

```text
<user name> — <monitor label> <orientation> <size> @ +x,+y
```

Example:

```text
texteditor2 — Monitor 2 Portrait 1080x1920 @ +140,+660
upnote1 — Monitor 1 Landscape 1853x1168 @ +206,+200
```

This preserves the user's chosen name while making the origin monitor context obvious.

---

# Mature Naming Pattern

A mature preset naming model usually separates:

```text
internal identity
user label
system-generated context metadata
```

Recommended fields:

```json
{
  "id": "custom-...",
  "name": "upnote2",
  "displayContext": "Monitor 2 Portrait 1080x1920",
  "geometrySummary": "1440x768 @ +73,+170"
}
```

Popup display can compose:

```text
name + displayContext + geometrySummary
```

This avoids forcing users to manually encode monitor names into preset names.

---

# Proposed Popup Display

## MVP Display

```text
Saved Presets
  texteditor   — Monitor 1 Landscape 1853x1168 — 1080x720 @ +386,+224
  texteditor2  — Monitor 2 Portrait 1080x1920 — 800x600 @ +140,+660
  upnote1      — Monitor 1 Landscape 1853x1168 — 1440x768 @ +206,+200
  upnote2      — Monitor 2 Portrait 1080x1920 — 1440x768 @ +73,+170
```

## Later Improved Display

```text
Saved Presets
  Monitor 1 · Landscape
    texteditor   1080x720 @ +386,+224
    upnote1      1440x768 @ +206,+200

  Monitor 2 · Portrait
    texteditor2  800x600 @ +140,+660
    upnote2      1440x768 @ +73,+170
```

MVP recommendation:

```text
Use flat list with generated context suffix first.
Group by monitor later if the list becomes long.
```

---

# Monitor Identity Model

GNOME monitor index is useful but not always stable across hardware changes.

Therefore store multiple hints:

```json
{
  "originMonitorIndex": 1,
  "originWorkareaX": 1920,
  "originWorkareaY": 0,
  "originWorkareaWidth": 1080,
  "originWorkareaHeight": 1920,
  "originOrientation": "portrait",
  "originScaleHint": 1.0
}
```

## MVP Resolution Strategy

When applying a saved preset:

1. Try `originMonitorIndex` if it exists and still has a valid workarea.
2. If unavailable, try to find a monitor with matching workarea size/orientation.
3. If still unavailable, fall back to the focused window's current monitor.

This provides useful behavior without overengineering monitor EDID / connector identity at this phase.

---

# Orientation Model

Orientation can be inferred from workarea shape:

```text
landscape: width >= height
portrait:  height > width
```

Examples:

```text
1853x1168 -> landscape
1080x1920 -> portrait
```

This is enough for popup display and adaptive placement.

---

# Scaling / Fractional Scaling Considerations

GNOME Wayland APIs expose logical workarea geometry.

Saved presets should remain in logical pixels, not physical pixels.

Implication:

```text
A preset saved under 100% scale and applied under another scale should adapt to the current logical workarea.
```

Do not attempt to preserve physical pixels.

Use current monitor workarea as the source of truth.

---

# Adaptive Placement Algorithm

Raw saved x/y should not be applied directly when the target workarea differs from the origin workarea.

## Old model

```text
targetX = targetWorkarea.x + savedX
targetY = targetWorkarea.y + savedY
```

This fails when a preset captured on a portrait monitor is applied on a landscape monitor or vice versa.

## New model

Use relative position within the available movement range:

```text
originRangeX = max(1, originWorkareaWidth  - savedWidth)
originRangeY = max(1, originWorkareaHeight - savedHeight)

targetWidth  = min(savedWidth,  targetWorkareaWidth)
targetHeight = min(savedHeight, targetWorkareaHeight)

targetRangeX = max(0, targetWorkareaWidth  - targetWidth)
targetRangeY = max(0, targetWorkareaHeight - targetHeight)

xRatio = clamp(savedX / originRangeX, 0, 1)
yRatio = clamp(savedY / originRangeY, 0, 1)

targetX = targetWorkarea.x + round(targetRangeX * xRatio)
targetY = targetWorkarea.y + round(targetRangeY * yRatio)
```

This preserves the intent:

- left stays left
- right stays right
- top stays top
- bottom stays bottom
- center-ish stays center-ish

without clipping unnecessarily.

---

# Save-Time Geometry Normalization

When saving, store the visible clamped geometry relative to the current workarea.

Do not store offscreen overflow as raw frame state.

Recommended save behavior:

1. Read frame rect.
2. Clamp frame rect to current workarea.
3. Store relative x/y/width/height from the clamped rect.
4. Store origin workarea metadata.

This prevents a preset from permanently remembering an already-invalid geometry.

---

# App Affinity

For Phase 7.2e-fix1, saved presets remain app-agnostic.

This is intentional.

A saved preset means:

```text
Apply this geometry/layout to the currently focused window.
```

It does not mean:

```text
Only apply to the app that created it.
```

Future phases may add optional app affinity, but it should not be required for the MVP.

---

# Data Model Changes

Existing custom preset entry:

```json
{
  "id": "custom-...",
  "name": "upnote2",
  "kind": "relative-geometry",
  "x": 73,
  "y": 170,
  "width": 1440,
  "height": 768,
  "workareaWidth": 1080,
  "workareaHeight": 1920,
  "createdAt": 1778898280
}
```

New custom preset entry:

```json
{
  "id": "custom-...",
  "name": "upnote2",
  "kind": "relative-geometry",
  "x": 73,
  "y": 170,
  "width": 1007,
  "height": 768,
  "originMonitorIndex": 1,
  "originWorkareaX": 1920,
  "originWorkareaY": 0,
  "originWorkareaWidth": 1080,
  "originWorkareaHeight": 1920,
  "originOrientation": "portrait",
  "createdAt": 1778898280
}
```

Existing presets without origin fields should still load for compatibility.

Fallback mapping:

```text
workareaWidth  -> originWorkareaWidth
workareaHeight -> originWorkareaHeight
originMonitorIndex -> unknown/current fallback
```

---

# Acceptance Criteria

Phase 7.2e-fix1 passes when:

- saved presets show origin monitor context in the popup
- a preset saved on monitor 2 can move the focused window back to monitor 2
- a preset saved on monitor 1 can move the focused window back to monitor 1
- portrait-to-landscape application no longer clips or drifts badly
- landscape-to-portrait application clamps safely
- existing saved presets still load
- built-in presets remain monitor-independent
- saved presets remain app-agnostic

---

# Recommended Next Implementation

1. Extend custom preset creation with origin monitor/workarea fields.
2. Normalize/clamp frame geometry at save time.
3. Resolve target monitor before applying custom preset.
4. Use adaptive ratio-based placement when origin and target workareas differ.
5. Update popup display label to include monitor context.

---

# Status

```text
Phase 7.2e capture/save: PASS
Phase 7.2e saved preset listing: PASS
Phase 7.2e same-monitor apply: PARTIAL PASS
Phase 7.2e cross-monitor apply: NEED FIX
Phase 7.2e-fix1 design: COMPLETE
```
