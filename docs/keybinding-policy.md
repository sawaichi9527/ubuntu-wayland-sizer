# Keybinding Policy

## User Preference

The preferred physical key gesture for development testing is:

```text
Right Super + Right Alt + Arrow
```

This is intended to reduce accidental activation during normal desktop use.

## Current Technical Binding

The current GNOME Shell/GSettings accelerator format uses logical modifier masks:

```text
<Super><Alt>Left
<Super><Alt>Right
<Super><Alt>Up
<Super><Alt>Down
```

In practice, these bindings usually mean:

```text
Any Super + Any Alt + Arrow
```

They do not reliably distinguish left/right modifier keys.

## Decision

For the MVP and early development phases, Ubuntu Wayland Sizer will keep the GNOME-native keybinding path:

```text
Main.wm.addKeybinding() + GSettings accelerator arrays
```

This keeps the implementation stable and avoids low-level key event interception while the core resize logic is still being validated.

## Deferred Right-side-only Binding

A true right-side-only binding would likely require lower-level key event tracking, such as:

```text
global.stage captured-event
→ track Super_R press/release
→ track Alt_R / ISO_Level3_Shift press/release
→ dispatch on Arrow key press
```

This is intentionally deferred because it may be affected by:

- Keyboard layout differences
- AltGr handling
- Input method behavior
- Remote desktop or VM key mapping
- GNOME Shell internal shortcut handling

## Future Requirement

The project should keep all shortcuts configurable.

Future settings should allow users to change:

```text
resize-left
resize-right
resize-full
resize-center
show-menu
cycle-presets
```

The default binding may remain `<Super><Alt>Arrow`, while documentation can recommend physically pressing the right-side modifier keys when available.
