# Phase 7.2d — Popup MVP

## Goal

Phase 7.2d implements the first select-only popup MVP for Ubuntu Wayland Sizer.

The popup is opened by keyboard shortcut and acts on the currently focused normal window.

```text
Super + Alt + Space -> open Ubuntu Wayland Sizer popup
```

## MVP Scope

Included:

- popup keybinding: `open-preset-popup`
- default shortcut: `Super + Alt + Space`
- GNOME Shell `ModalDialog` popup
- focused-window geometry display
- monitor/workarea geometry display
- workarea-relative geometry display
- built-in center preset buttons
- built-in position preset buttons
- click-to-apply existing preset pipeline

Deferred:

- saved custom presets
- naming current window geometry
- custom preset persistence
- rename/delete/reorder
- panel indicator
- popup styling polish
- full preferences UI

## Implementation Notes

The popup dialog must be registered as a GObject class because it subclasses `ModalDialog.ModalDialog`.

```text
PresetPopupDialog -> GObject.registerClass(...)
```

This fixed the earlier runtime error:

```text
Tried to construct an object without a GType
```

The popup lifecycle avoids manually destroying already-disposed dialogs. When opening a new popup, the extension now closes the previous popup and immediately clears the reference.

This fixed the earlier warning:

```text
Object ... PresetPopupDialog ... has been already disposed
```

## Current Popup Layout

```text
Ubuntu Wayland Sizer

Focused Window
  Monitor: <index>
  Frame: x=<x> y=<y> w=<width> h=<height>
  Workarea: x=<x> y=<y> w=<width> h=<height>
  Relative: x=<x> y=<y> w=<width> h=<height>

Center Presets
  Compact center — 800x600
  Custom center — <center-width>x<center-height>
  Large center — 1440x768

Window Positions
  Left half — current workarea left half
  Right half — current workarea right half
  Full workarea — current workarea

Close
```

## Validation Status

### Popup open validation — PASS

Confirmed behavior:

- `Super + Alt + Space` opens the popup.
- Popup displays focused-window geometry.
- Popup displays monitor/workarea geometry.
- Popup displays workarea-relative geometry.
- Popup opens correctly on the primary monitor.
- Popup opens correctly on the secondary portrait monitor.
- Repeated popup open no longer produces disposed-object warnings.

Observed clean lifecycle logs:

```text
[ubuntu-wayland-sizer] popup: open requested
[ubuntu-wayland-sizer] popup: closed previous dialog (replace)
[ubuntu-wayland-sizer] popup: context monitor=...
```

### Popup apply validation — PENDING

Next validation target:

- Click each popup preset button.
- Confirm the focused window is resized/repositioned correctly.
- Confirm the existing resize pipeline is reused.
- Confirm no popup lifecycle warning appears after applying a preset.

## Apply Test Checklist

Test on primary monitor:

```text
Super + Alt + Space -> Compact center
Super + Alt + Space -> Custom center
Super + Alt + Space -> Large center
Super + Alt + Space -> Left half
Super + Alt + Space -> Right half
Super + Alt + Space -> Full workarea
```

Test on secondary portrait monitor:

```text
Super + Alt + Space -> Compact center
Super + Alt + Space -> Custom center
Super + Alt + Space -> Large center
Super + Alt + Space -> Left half
Super + Alt + Space -> Right half
Super + Alt + Space -> Full workarea
```

Expected logs:

```text
[ubuntu-wayland-sizer] popup: selected preset <preset-id>
[ubuntu-wayland-sizer] action: preset triggered: <preset-id>
[ubuntu-wayland-sizer] action: geometry context (...)
[ubuntu-wayland-sizer] action: applied preset <preset-id>: ...
```

For center presets, expected additional logs may include:

```text
[ubuntu-wayland-sizer] action: remembered center cycle index=...
[ubuntu-wayland-sizer] action: post-correction not needed for ...
```

For full-workarea breakout cases, expected logs may include:

```text
[ubuntu-wayland-sizer] action: full-workarea state detected; breaking out before preset ...
[ubuntu-wayland-sizer] action: applied safe restore before preset ...
```

## Acceptance Criteria

Phase 7.2d can be marked complete when:

- popup opens on both monitors
- popup repeat-open lifecycle is clean
- all built-in center presets apply correctly from popup
- left/right/full presets apply correctly from popup
- no regression to direct hotkeys
- no regression to center cycling

## Current Project Status

```text
Phase 7.2d popup keybinding: PASS
Phase 7.2d popup open: PASS
Phase 7.2d dual-monitor popup display: PASS
Phase 7.2d repeat-open lifecycle: PASS
Phase 7.2d popup apply: PENDING
```

## Next Phase After PASS

After popup apply validation passes, the next logical phase is:

```text
Phase 7.2e — Capture Current Geometry MVP
```

That phase will add:

- Save Current Window As Preset
- user-provided preset name
- workarea-relative geometry capture
- persistent custom preset storage
- saved preset apply flow
